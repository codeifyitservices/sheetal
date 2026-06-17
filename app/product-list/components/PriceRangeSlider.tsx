"use client";

import { useState, useRef, useCallback } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

/**
 * Converts a slider position (0..STEPS) to a price value.
 * Steps 0..8  → ₹0..₹2000   (step size 250)
 * Steps 8..N  → ₹2000..max  (step size 500)
 */
const BREAKPOINT = 2000;
const SMALL_STEP = 250;
const LARGE_STEP = 500;

const buildStops = (min: number, max: number): number[] => {
  const stops: number[] = [];
  // below breakpoint
  for (let v = min; v < Math.min(BREAKPOINT, max); v += SMALL_STEP) {
    stops.push(v);
  }
  // at and above breakpoint
  for (let v = Math.max(BREAKPOINT, min); v <= max; v += LARGE_STEP) {
    if (stops[stops.length - 1] !== v) stops.push(v);
  }
  // ensure max is included
  if (stops[stops.length - 1] !== max) stops.push(max);
  return stops;
};

const snapToStop = (value: number, stops: number[]): number => {
  return stops.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
};

const valueToPercent = (value: number, stops: number[]): number => {
  const idx = stops.findIndex((s) => s >= value);
  if (idx <= 0) return 0;
  if (idx >= stops.length - 1) return 100;
  const lo = stops[idx - 1];
  const hi = stops[idx];
  const frac = (value - lo) / (hi - lo);
  return ((idx - 1 + frac) / (stops.length - 1)) * 100;
};

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  onChange,
}) => {
  const stops = buildStops(min, max);
  const totalSteps = Math.max(0, stops.length - 1);

  const [minIdx, setMinIdx] = useState(0);
  const [maxIdx, setMaxIdx] = useState(totalSteps);

  // Sync state if stops change
  useState(() => {
    if (maxIdx > totalSteps) setMaxIdx(totalSteps);
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const minVal = stops[minIdx] ?? min;
  const maxVal = stops[maxIdx] ?? max;

  const debouncedOnChange = (minV: number, maxV: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(minV, maxV), 500);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Math.min(Number(e.target.value), maxIdx - 1);
    const newMinIdx = Math.max(0, idx);
    setMinIdx(newMinIdx);
    debouncedOnChange(stops[newMinIdx] ?? min, maxVal);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Math.max(Number(e.target.value), minIdx + 1);
    const newMaxIdx = Math.min(totalSteps, idx);
    setMaxIdx(newMaxIdx);
    debouncedOnChange(minVal, stops[newMaxIdx] ?? max);
  };

  const minPercent = totalSteps > 0 ? (minIdx / totalSteps) * 100 : 0;
  const maxPercent = totalSteps > 0 ? (maxIdx / totalSteps) * 100 : 100;

  return (
    <>
      <style>{`
        .price-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #bd9951;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: grab;
          pointer-events: all;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .price-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.2);
          box-shadow: 0 2px 8px rgba(189,153,81,0.35);
        }
        .price-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #bd9951;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: grab;
          pointer-events: all;
        }
        .price-slider::-webkit-slider-runnable-track { background: transparent; }
        .price-slider::-moz-range-track { background: transparent; }
      `}</style>

      <div className="px-1 pb-2">
        {/* Price display */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Min</span>
            <span className="text-sm font-semibold text-gray-800">
              ₹{(minVal ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-px w-6 bg-gray-300 mt-3" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Max</span>
            <span className="text-sm font-semibold text-gray-800">
              ₹{(maxVal ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Track */}
        <div className="relative h-1.5 w-full mx-auto">
          {/* Base grey track */}
          <div className="absolute inset-0 bg-gray-200 rounded-full" />

          {/* Gold active range */}
          <div
            className="absolute top-0 h-full bg-[#bd9951] rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />

          {/* Min thumb — uses index-based range */}
          <input
            type="range"
            min={0}
            max={totalSteps}
            step={1}
            value={minIdx}
            onChange={handleMinChange}
            className="price-slider absolute w-full h-full appearance-none bg-transparent pointer-events-none"
            style={{ zIndex: minIdx > totalSteps - 2 ? 5 : 3 }}
          />

          {/* Max thumb */}
          <input
            type="range"
            min={0}
            max={totalSteps}
            step={1}
            value={maxIdx}
            onChange={handleMaxChange}
            className="price-slider absolute w-full h-full appearance-none bg-transparent pointer-events-none"
            style={{ zIndex: 4 }}
          />
        </div>

        {/* Bounds */}
        <div className="flex justify-between mt-3">
          <span className="text-[11px] text-gray-400">₹{min.toLocaleString("en-IN")}</span>
          <span className="text-[11px] text-gray-400">₹{max.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </>
  );
};

export default PriceRangeSlider;