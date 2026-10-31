"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/shared/utils";

const STARS = [1, 2, 3, 4, 5];

const STAR_SIZES = { sm: "size-3.5", md: "size-5" };

export function StarRating({
  rating,
  size = "sm",
  className,
}: {
  rating: number;
  size?: keyof typeof STAR_SIZES;
  className?: string;
}) {
  return (
    <div
      data-slot="star-rating"
      className={cn("flex gap-0.5", className)}
      role="img"
      aria-label={`Rated ${Math.round(rating * 10) / 10} out of 5`}
    >
      {STARS.map((star) => {
        const fill = Math.min(Math.max(rating - (star - 1), 0), 1);
        return (
          <span key={star} className="relative">
            <Star className={cn(STAR_SIZES[size], "fill-muted text-muted")} />
            {/* A runtime width can't be a Tailwind class, so the partial fill goes through `style`. */}
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className={cn(STAR_SIZES[size], "fill-rating text-rating")} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

// Controlled: owns only the hover state; the value lives with the caller (an RHF `Controller`).
export function StarRatingInput({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div
      data-slot="star-rating-input"
      role="radiogroup"
      aria-label={label}
      className={cn("flex gap-1", className)}
      onMouseLeave={() => setHovered(0)}
    >
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-safe:transition-transform motion-safe:hover:scale-110"
        >
          <Star
            className={cn(
              "size-6",
              active >= star
                ? "fill-rating text-rating"
                : "fill-muted text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}
