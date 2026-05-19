"use client";

import React, { useState, useEffect, useCallback, MouseEvent } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

interface ProductImageModalProps {
  images: string[];
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  initialImage: string;
}

const ProductImageModal: React.FC<ProductImageModalProps> = ({
  images,
  videoUrl,
  isOpen,
  onClose,
  initialImage,
}) => {
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [showVideo, setShowVideo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const media = videoUrl ? [...images, videoUrl] : images;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    if (initialImage.startsWith("video::")) {
      setShowVideo(true);
      setSelectedImage("");
    } else {
      setSelectedImage(initialImage);
      setShowVideo(false);
    }
    setZoomLevel(1);
  }, [initialImage, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    const selectedMedia = media[index];
    if (selectedMedia === videoUrl) {
      setShowVideo(true);
      setSelectedImage("");
    } else {
      setShowVideo(false);
      setSelectedImage(selectedMedia);
    }
  }, [emblaApi, media, videoUrl]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    const target = showVideo ? videoUrl : selectedImage;
    if (target) {
      const index = media.indexOf(target);
      if (index !== -1 && emblaApi.selectedScrollSnap() !== index) {
        emblaApi.scrollTo(index);
      }
    }
  }, [emblaApi, onSelect, selectedImage, showVideo, media, videoUrl]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleZoom = (direction: "in" | "out") => {
    const newZoom = direction === "in" ? zoomLevel + 0.2 : zoomLevel - 0.2;
    if (newZoom >= 1 && newZoom <= 3) {
      setZoomLevel(newZoom);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[11000]">
      <div className="relative bg-white w-full h-full p-4 flex gap-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white bg-black rounded-full p-2 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Thumbnails */}
        <div className="flex flex-col gap-3 h-full overflow-y-auto no-scrollbar w-24">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`border cursor-pointer flex-shrink-0 ${selectedImage === img && !showVideo ? "border-[#bd9951]" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => {
                setSelectedImage(img);
                setShowVideo(false);
                setZoomLevel(1);
              }}
            >
              <Image
                src={img}
                alt={`thumb-${idx}`}
                width={160}
                height={133}
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
          {videoUrl && (
            <div
              className={`border cursor-pointer flex items-center justify-center h-24 flex-shrink-0 relative ${showVideo ? "border-[#bd9951]" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => {
                setShowVideo(true);
                setSelectedImage("");
                setZoomLevel(1);
              }}
            >
              <Image
                src={images[0] || "/assets/placeholder-product.jpg"}
                alt="video-thumbnail"
                width={160}
                height={133}
                className="w-full h-auto object-cover opacity-80"
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

        {/* Main Display */}
        <div
          className="flex-1 h-full relative overflow-hidden bg-gray-50"
          onMouseMove={handleMouseMove}
        >
          {showVideo ? (
            <video
              key={videoUrl}
              className="w-full h-full object-contain"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url(${selectedImage})`,
                backgroundPosition:
                  zoomLevel === 1
                    ? "center center"
                    : `${mousePos.x}% ${mousePos.y}%`,
                backgroundSize:
                  zoomLevel === 1 ? "contain" : `${zoomLevel * 100}%`,
                backgroundRepeat: "no-repeat",
                transition: "background-size 0.2s ease-out",
              }}
            />
          )}
        </div>

        {/* Zoom Controls */}
        {!showVideo && (
          <div className="absolute bottom-4 right-1/2 translate-x-1/2 flex gap-2">
            <button
              onClick={() => handleZoom("out")}
              disabled={zoomLevel <= 1}
              className="bg-black text-white rounded-full p-2 disabled:opacity-50 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button
              onClick={() => handleZoom("in")}
              disabled={zoomLevel >= 3}
              className="bg-black text-white rounded-full p-2 disabled:opacity-50 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageModal;
