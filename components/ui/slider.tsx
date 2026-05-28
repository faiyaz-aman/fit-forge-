"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      label,
      showValue = true,
      ...props
    },
    ref
  ) => {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    };

    // Calculate percentage for track background fill
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={cn("w-full space-y-1.5 select-none", className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
            )}
            {showValue && (
              <span className="text-xs font-mono font-bold text-primary tabular-nums bg-primary/10 px-2 py-0.5 rounded">
                {value}
              </span>
            )}
          </div>
        )}
        <div className="relative flex items-center h-5">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            style={{
              background: `linear-gradient(to right, #00FF88 0%, #00FF88 ${percentage}%, #1F1F23 ${percentage}%, #1F1F23 100%)`,
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:hover:scale-115"
            {...props}
          />
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";
