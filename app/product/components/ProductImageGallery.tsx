"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  MouseEvent,
} from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

import ProductImageModal from "./ProductImageModal";
import { ChevronDown, ChevronUp, Share2 } from "lucide-react";
import ShareMenu from "../../components/ShareMenu";

interface ProductImageGalleryProps {
  images: string[];
  selectedImage: string;
  onImageChange: (img: string) => void;
  title: string;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onScrollToSimilar: () => void;
  videoUrl?: string;
  videoMimeType?: string;
}

const ZOOM_SCALE = 1.75;

const VIDEO_PREFIX = "video::";
const toVideoSlide = (url: string) => `${VIDEO_PREFIX}${url}`;
const isVideoSlide = (src: string) => src.startsWith(VIDEO_PREFIX);
const getVideoSrc = (src: string) => src.replace(VIDEO_PREFIX, "");

interface VideoPlayerProps {
  src: string;
  type: string;
  isActive: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, type, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch((err) => {
        console.log("Autoplay prevented:", err);
      });
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-contain"
      muted
      loop
      playsInline
    >
      <source src={src} type={type} />
    </video>
  );
};

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  selectedImage,
  onImageChange,
  title,
  isWishlisted,
  onToggleWishlist,
  onScrollToSimilar,
  videoUrl,
  videoMimeType,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("50% 50%");

  // Full media list — video slide appended if a video exists
  const media = useMemo(
    () => (videoUrl ? [...images, toVideoSlide(videoUrl)] : images),
    [images, videoUrl],
  );

  const resolvedVideoType =
    videoMimeType ||
    (videoUrl?.match(/\.(webm)(\?|#|$)/i)
      ? "video/webm"
      : videoUrl?.match(/\.(mov)(\?|#|$)/i)
        ? "video/quicktime"
        : videoUrl?.match(/\.(mkv)(\?|#|$)/i)
          ? "video/x-matroska"
          : "video/mp4");

  const isCurrentVideo = isVideoSlide(selectedImage);

  // Embla for mobile
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const item = media[emblaApi.selectedScrollSnap()];
    onImageChange(item);
  }, [emblaApi, media, onImageChange]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    const index = media.indexOf(selectedImage);
    if (index !== -1 && emblaApi.selectedScrollSnap() !== index) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi, onSelect, selectedImage, media]);

  const scroll = (direction: "up" | "down") => {
    scrollRef.current?.scrollBy({
      top: direction === "up" ? -150 : 150,
      behavior: "smooth",
    });
  };

  const updateScrollState = useCallback(() => {
    const c = scrollRef.current;
    if (!c) return;
    const hasOverflow = c.scrollHeight > c.clientHeight + 1;
    setCanScrollUp(hasOverflow && c.scrollTop > 0);
    setCanScrollDown(
      hasOverflow && c.scrollTop + c.clientHeight < c.scrollHeight - 1,
    );
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollState);
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [media.length, updateScrollState]);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (isCurrentVideo) return;
      const container = imageContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setTransformOrigin(`${x}% ${y}%`);
    },
    [isCurrentVideo],
  );

  const handleMouseEnter = () => {
    if (!isCurrentVideo) setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    setTransformOrigin("50% 50%");
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        {/* ── Desktop Thumbnails (Vertical) ── */}
        <div className="hidden md:flex flex-col items-center w-16 lg:w-24 flex-shrink-0 gap-2">
          <button
            onClick={() => scroll("up")}
            disabled={!canScrollUp}
            className="w-full py-1 cursor-pointer hover:bg-gray-100 rounded transition-colors flex justify-center items-center h-8 disabled:opacity-30"
          >
            <ChevronUp />
          </button>

          <div
            ref={scrollRef}
            className="flex flex-col gap-3 max-h-[400px] lg:max-h-[500px] overflow-y-auto scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Image thumbnails */}
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`border cursor-pointer transition-all flex-shrink-0 ${
                  selectedImage === img && !isCurrentVideo
                    ? "border-[#bd9951]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onImageChange(img)}
              >
                <Image
                  src={img || "/assets/placeholder-product.jpg"}
                  alt={`thumb-${idx}`}
                  width={100}
                  height={133}
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}

            {/* Video thumbnail — last in the list */}
            {videoUrl && (
              <div
                className={`border cursor-pointer transition-all flex-shrink-0 relative ${
                  isCurrentVideo
                    ? "border-[#bd9951]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onImageChange(toVideoSlide(videoUrl))}
              >
                <Image
                  src={images[0] || "/assets/placeholder-product.jpg"}
                  alt="video-thumbnail"
                  width={100}
                  height={133}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-white/80 rounded-full p-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="#bd9951"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => scroll("down")}
            disabled={!canScrollDown}
            className="w-full py-1 cursor-pointer hover:bg-gray-100 rounded transition-colors flex justify-center items-center h-8 disabled:opacity-30"
          >
            <ChevronDown />
          </button>
        </div>

        {/* ── Main Image / Video Container ── */}
        <div className="flex-1 relative">
          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {media.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-[0_0_100%] min-w-0 relative aspect-[3/4]"
                  >
                    {isVideoSlide(item) ? (
                      <VideoPlayer
                        src={getVideoSrc(item)}
                        type={resolvedVideoType}
                        isActive={selectedImage === item}
                      />
                    ) : (
                      <Image
                        src={item || "/assets/placeholder-product.jpg"}
                        alt={`${title}-${idx}`}
                        fill
                        className="object-cover"
                        priority={idx === 0}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-2 py-4">
              {media.map((item, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    selectedImage === item ? "bg-[#bd9951]" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Main Display */}
          <div
            ref={imageContainerRef}
            className="hidden md:block relative aspect-[3/4] w-full overflow-hidden bg-white"
            style={{
              cursor: isCurrentVideo
                ? "default"
                : isZooming
                  ? "zoom-in"
                  : "crosshair",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
              if (!isCurrentVideo) setIsModalOpen(true);
            }}
          >
            {isCurrentVideo ? (
              <VideoPlayer
                src={getVideoSrc(selectedImage)}
                type={resolvedVideoType}
                isActive={isCurrentVideo}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  transform: isZooming ? `scale(${ZOOM_SCALE})` : "scale(1)",
                  transformOrigin,
                  transition: isZooming
                    ? "transform 0.12s ease-out"
                    : "transform 0.2s ease-out",
                  willChange: "transform",
                }}
              >
                <Image
                  src={selectedImage || "/assets/placeholder-product.jpg"}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                  draggable={false}
                />
              </div>
            )}
          </div>

          {/* Floating Icons */}
          <div className="absolute top-4 right-0 rounded-l-xl z-20 flex flex-col gap-2 bg-[#f9f9f9]">
            <button
              className="p-2.5 rounded-md cursor-pointer"
              onClick={onToggleWishlist}
            >
              <Image
                src={
                  isWishlisted
                    ? "/assets/icons/heart-solid.svg"
                    : "/assets/icons/heart-pink.svg"
                }
                className="md:w-[30px] w-[22px]"
                width={3}
                height={3}
                alt="wishlist"
              />
            </button>
            <button
              className="p-2.5 rounded-md cursor-pointer"
              onClick={onScrollToSimilar}
            >
              <Image
                src="/assets/icons/view-similar.png"
                width={30}
                height={30}
                alt="similar"
                className="md:w-[30px] w-[22px]"
              />
            </button>
            <ShareMenu
              title={title}
              text={`Check out this ${title} at Studio By Sheetal!`}
            >
              <button
                className="p-2.5 rounded-md cursor-pointer flex items-center justify-center"
                aria-label="Share product"
              >
                <Share2 color="#fc6b8d" size={25}/>
              </button>
            </ShareMenu>
          </div>
        </div>
      </div>

      <ProductImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={images}
        videoUrl={videoUrl}
        initialImage={selectedImage}
      />
    </>
  );
};

export default ProductImageGallery;
