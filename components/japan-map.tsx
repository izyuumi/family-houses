"use client";

import { useState } from "react";

interface Location {
  id: string;
  name: string;
  xPercent: number;
  yPercent: number;
}

const LOCATIONS: Location[] = [
  { id: "tokyo", name: "Tokyo", xPercent: 71.5, yPercent: 51.1 },
  { id: "osaka", name: "Osaka", xPercent: 53, yPercent: 56.5 },
  { id: "kyoto", name: "Kyoto", xPercent: 51, yPercent: 54.1 },
  { id: "sapporo", name: "Sapporo", xPercent: 81, yPercent: 17.1 },
  { id: "fukuoka", name: "Fukuoka", xPercent: 27, yPercent: 61.5 },
  { id: "nagoya", name: "Nagoya", xPercent: 59, yPercent: 53.8 },
  { id: "hiroshima", name: "Hiroshima", xPercent: 38, yPercent: 57.9 },
  { id: "sendai", name: "Sendai", xPercent: 76, yPercent: 39 },
  { id: "okinawa", name: "Okinawa", xPercent: 27.5, yPercent: 89.8 },
];

interface JapanMapProps {
  onLocationClick?: (location: Location) => void;
}

export function JapanMap({ onLocationClick }: JapanMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location.id);
    onLocationClick?.(location);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className="relative w-full h-full max-w-4xl"
        style={{
          backgroundImage: "url(/jp.svg)",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {LOCATIONS.map((location) => {
          const isHovered = hoveredLocation === location.id;
          const isSelected = selectedLocation === location.id;

          return (
            <div
              key={location.id}
              className="absolute cursor-pointer group"
              style={{
                left: `${location.xPercent}%`,
                top: `${location.yPercent}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() => setHoveredLocation(location.id)}
              onMouseLeave={() => setHoveredLocation(null)}
              onClick={() => handleLocationClick(location)}
            >
              <div
                className={`
                  relative flex items-center justify-center rounded-full transition-all duration-200
                  ${isHovered || isSelected ? "w-8 h-8" : "w-6 h-6"}
                  ${
                    isSelected
                      ? "bg-primary"
                      : isHovered
                        ? "bg-primary/80"
                        : "bg-destructive"
                  }
                `}
              >
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>

              {(isHovered || isSelected) && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 px-3 py-1.5 bg-popover border border-border rounded whitespace-nowrap">
                  <span className="text-sm font-medium text-popover-foreground">
                    {location.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { Location };
