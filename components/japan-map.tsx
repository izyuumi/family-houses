"use client";

import { useState, useRef, useCallback } from "react";

interface Prefecture {
  id: string;
  code: string;
  name: string;
  x: number;
  y: number;
}

interface MapLocation {
  x: number;
  y: number;
}

interface PropertyMarker {
  id: string;
  name: string;
  x: number;
  y: number;
}

const PREFECTURES: Prefecture[] = [
  { id: "hokkaido", code: "JP01", name: "Hokkaidō", x: 626.5, y: 123.4 },
  { id: "aomori", code: "JP02", name: "Aomori", x: 562.3, y: 233.6 },
  { id: "iwate", code: "JP03", name: "Iwate", x: 585.2, y: 275.2 },
  { id: "miyagi", code: "JP04", name: "Miyagi", x: 570.6, y: 313.1 },
  { id: "akita", code: "JP05", name: "Akita", x: 557.1, y: 268 },
  { id: "yamagata", code: "JP06", name: "Yamagata", x: 549.5, y: 312.8 },
  { id: "fukushima", code: "JP07", name: "Fukushima", x: 560.1, y: 357.8 },
  { id: "ibaraki", code: "JP08", name: "Ibaraki", x: 553.9, y: 402 },
  { id: "tochigi", code: "JP09", name: "Tochigi", x: 540.2, y: 381.9 },
  { id: "gunma", code: "JP10", name: "Gunma", x: 514.3, y: 389.4 },
  { id: "saitama", code: "JP11", name: "Saitama", x: 525.2, y: 407.3 },
  { id: "chiba", code: "JP12", name: "Chiba", x: 550.4, y: 430.9 },
  { id: "tokyo", code: "JP13", name: "Tokyo", x: 526.9, y: 419.8 },
  { id: "kanagawa", code: "JP14", name: "Kanagawa", x: 524.2, y: 427.8 },
  { id: "niigata", code: "JP15", name: "Niigata", x: 511.7, y: 361.1 },
  { id: "toyama", code: "JP16", name: "Toyama", x: 464.1, y: 385.6 },
  { id: "ishikawa", code: "JP17", name: "Ishikawa", x: 444.9, y: 395.6 },
  { id: "fukui", code: "JP18", name: "Fukui", x: 435, y: 409 },
  { id: "yamanashi", code: "JP19", name: "Yamanashi", x: 504, y: 420.8 },
  { id: "nagano", code: "JP20", name: "Nagano", x: 487.5, y: 399.3 },
  { id: "gifu", code: "JP21", name: "Gifu", x: 458.6, y: 419.2 },
  { id: "shizuoka", code: "JP22", name: "Shizuoka", x: 488, y: 443.9 },
  { id: "aichi", code: "JP23", name: "Aichi", x: 463.4, y: 442.6 },
  { id: "mie", code: "JP24", name: "Mie", x: 439.9, y: 463.4 },
  { id: "shiga", code: "JP25", name: "Shiga", x: 431.3, y: 436.6 },
  { id: "kyoto", code: "JP26", name: "Kyōto", x: 415.8, y: 438.2 },
  { id: "osaka", code: "JP27", name: "Ōsaka", x: 414, y: 457.4 },
  { id: "hyogo", code: "JP28", name: "Hyōgo", x: 391.7, y: 440.8 },
  { id: "nara", code: "JP29", name: "Nara", x: 424.6, y: 468 },
  { id: "wakayama", code: "JP30", name: "Wakayama", x: 410.7, y: 481.6 },
  { id: "tottori", code: "JP31", name: "Tottori", x: 364.7, y: 429.9 },
  { id: "shimane", code: "JP32", name: "Shimane", x: 326, y: 442.9 },
  { id: "okayama", code: "JP33", name: "Okayama", x: 362.4, y: 447.5 },
  { id: "hiroshima", code: "JP34", name: "Hiroshima", x: 337, y: 456.8 },
  { id: "yamaguchi", code: "JP35", name: "Yamaguchi", x: 297.8, y: 469.6 },
  { id: "tokushima", code: "JP36", name: "Tokushima", x: 377.3, y: 482.6 },
  { id: "kagawa", code: "JP37", name: "Kagawa", x: 368.6, y: 471.3 },
  { id: "ehime", code: "JP38", name: "Ehime", x: 337.3, y: 487.6 },
  { id: "kochi", code: "JP39", name: "Kōchi", x: 348.7, y: 493.7 },
  { id: "fukuoka", code: "JP40", name: "Fukuoka", x: 272.8, y: 492.5 },
  { id: "saga", code: "JP41", name: "Saga", x: 254.5, y: 504.2 },
  { id: "nagasaki", code: "JP42", name: "Nagasaki", x: 253.2, y: 517.3 },
  { id: "kumamoto", code: "JP43", name: "Kumamoto", x: 278.6, y: 522.3 },
  { id: "oita", code: "JP44", name: "Ōita", x: 294.3, y: 512 },
  { id: "miyazaki", code: "JP45", name: "Miyazaki", x: 291.2, y: 539.2 },
  { id: "kagoshima", code: "JP46", name: "Kagoshima", x: 266.4, y: 553.1 },
  { id: "okinawa", code: "JP47", name: "Okinawa", x: 196.1, y: 730.3 },
];

interface JapanMapProps {
  onPrefectureClick?: (prefecture: Prefecture) => void;
  onLocationClick?: (location: MapLocation) => void;
  onMarkerClick?: (marker: PropertyMarker) => void;
  activePrefectures?: string[];
  selectionMode?: boolean;
  selectedPrefectureId?: string | null;
  selectedLocation?: MapLocation | null;
  markers?: PropertyMarker[];
}

export function JapanMap({
  onPrefectureClick,
  onLocationClick,
  onMarkerClick,
  activePrefectures = [],
  selectionMode = false,
  selectedPrefectureId = null,
  selectedLocation = null,
  markers = [],
}: JapanMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [internalSelected, setInternalSelected] = useState<string | null>(null);

  const selectedPrefecture = selectedPrefectureId ?? internalSelected;

  const handlePrefectureClick = (prefecture: Prefecture) => {
    setInternalSelected(prefecture.id);
    onPrefectureClick?.(prefecture);
  };

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!selectionMode || !onLocationClick || !svgRef.current) return;

      const svg = svgRef.current;
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      const svgPoint = point.matrixTransform(ctm.inverse());
      onLocationClick({ x: Math.round(svgPoint.x * 10) / 10, y: Math.round(svgPoint.y * 10) / 10 });
    },
    [selectionMode, onLocationClick]
  );

  const visiblePrefectures =
    selectionMode || markers.length > 0
      ? []
      : PREFECTURES.filter((p) => activePrefectures.includes(p.id));

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div
        className="relative w-full h-full"
        style={{ maxWidth: "min(100%, calc(100vh * 1000 / 846))" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1000 846"
          className={`w-full h-full ${selectionMode ? "cursor-crosshair" : ""}`}
          preserveAspectRatio="xMidYMid meet"
          onClick={handleSvgClick}
        >
          <image href="/jp.svg" x="0" y="0" width="1000" height="846" />

          {visiblePrefectures.map((prefecture) => {
            const isHovered = hoveredPrefecture === prefecture.id;
            const isSelected = selectedPrefecture === prefecture.id;
            const radius = isHovered || isSelected ? 14 : 10;

            return (
              <g
                key={prefecture.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPrefecture(prefecture.id)}
                onMouseLeave={() => setHoveredPrefecture(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrefectureClick(prefecture);
                }}
              >
                <circle
                  cx={prefecture.x}
                  cy={prefecture.y}
                  r={radius}
                  className={`
                    transition-all duration-200
                    ${
                      isSelected
                        ? "fill-primary stroke-background stroke-2"
                        : isHovered
                          ? "fill-primary/80 stroke-background stroke-2"
                          : "fill-destructive stroke-background stroke-[1.5]"
                    }
                  `}
                />
                <circle
                  cx={prefecture.x}
                  cy={prefecture.y}
                  r={4}
                  className="fill-background pointer-events-none"
                />

                {(isHovered || isSelected) && (
                  <g className="pointer-events-none">
                    <rect
                      x={prefecture.x - 55}
                      y={prefecture.y - 42}
                      width={110}
                      height={28}
                      rx={4}
                      className="fill-popover stroke-border"
                    />
                    <text
                      x={prefecture.x}
                      y={prefecture.y - 23}
                      textAnchor="middle"
                      className="fill-popover-foreground font-medium"
                      style={{ fontSize: "14px" }}
                    >
                      {prefecture.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {markers.map((marker) => {
            const isHovered = hoveredMarker === marker.id;
            const radius = isHovered ? 14 : 10;

            return (
              <g
                key={marker.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredMarker(marker.id)}
                onMouseLeave={() => setHoveredMarker(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkerClick?.(marker);
                }}
              >
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={radius}
                  className={`
                    transition-all duration-200
                    ${isHovered ? "fill-primary stroke-background stroke-2" : "fill-destructive stroke-background stroke-[1.5]"}
                  `}
                />
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={4}
                  className="fill-background pointer-events-none"
                />

                {isHovered && (
                  <g className="pointer-events-none">
                    <rect
                      x={marker.x - 65}
                      y={marker.y - 42}
                      width={130}
                      height={28}
                      rx={4}
                      className="fill-popover stroke-border"
                    />
                    <text
                      x={marker.x}
                      y={marker.y - 23}
                      textAnchor="middle"
                      className="fill-popover-foreground font-medium"
                      style={{ fontSize: "14px" }}
                    >
                      {marker.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {selectionMode && selectedLocation && (
            <g className="pointer-events-none">
              <circle
                cx={selectedLocation.x}
                cy={selectedLocation.y}
                r={14}
                className="fill-primary stroke-background stroke-2"
              />
              <circle
                cx={selectedLocation.x}
                cy={selectedLocation.y}
                r={4}
                className="fill-background"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

export { PREFECTURES };
export type { Prefecture, MapLocation, PropertyMarker };
