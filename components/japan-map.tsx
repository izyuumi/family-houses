"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface MapLocation {
  x: number;
  y: number;
}

export interface PropertyMarker {
  id: string;
  name: string;
  x: number;
  y: number;
}

const BASE_WIDTH = 1000;
const BASE_HEIGHT = 846;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.001;

type JapanMapViewProps = {
  mode: "view";
  markers: PropertyMarker[];
  onMarkerClick?: (marker: PropertyMarker) => void;
};

type JapanMapEditProps = {
  mode: "edit";
  selectedLocation?: MapLocation | null;
  onLocationClick?: (location: MapLocation) => void;
};

type JapanMapProps = JapanMapViewProps | JapanMapEditProps;

export function JapanMap(props: JapanMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [viewCenter, setViewCenter] = useState({
    x: BASE_WIDTH / 2,
    y: BASE_HEIGHT / 2,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const isEditMode = props.mode === "edit";
  const markers = isEditMode ? [] : props.markers;
  const selectedLocation = isEditMode ? props.selectedLocation : null;

  const viewWidth = BASE_WIDTH / zoom;
  const viewHeight = BASE_HEIGHT / zoom;
  const viewX = viewCenter.x - viewWidth / 2;
  const viewY = viewCenter.y - viewHeight / 2;

  const getSvgPoint = useCallback(
    (clientX: number, clientY: number): MapLocation | null => {
      if (!svgRef.current) return null;

      const svg = svgRef.current;
      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;

      const ctm = svg.getScreenCTM();
      if (!ctm) return null;

      const svgPoint = point.matrixTransform(ctm.inverse());
      return {
        x: Math.round(svgPoint.x * 10) / 10,
        y: Math.round(svgPoint.y * 10) / 10,
      };
    },
    []
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const point = getSvgPoint(e.clientX, e.clientY);
      if (!point) return;

      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, zoom * (1 + delta))
      );

      const zoomFactor = newZoom / zoom;
      const newCenterX = point.x + (viewCenter.x - point.x) / zoomFactor;
      const newCenterY = point.y + (viewCenter.y - point.y) / zoomFactor;

      setZoom(newZoom);
      setViewCenter({ x: newCenterX, y: newCenterY });
    },
    [zoom, viewCenter, getSvgPoint]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditMode) return;
      if (e.button !== 0) return;

      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    },
    [isEditMode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const scaleX = viewWidth / rect.width;
      const scaleY = viewHeight / rect.height;

      const dx = (e.clientX - lastMousePos.x) * scaleX;
      const dy = (e.clientY - lastMousePos.y) * scaleY;

      setViewCenter((prev) => ({
        x: prev.x - dx,
        y: prev.y - dy,
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    },
    [isPanning, lastMousePos, viewWidth, viewHeight]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isEditMode) return;
      if (isPanning) return;

      const point = getSvgPoint(e.clientX, e.clientY);
      if (point && props.mode === "edit" && props.onLocationClick) {
        props.onLocationClick(point);
      }
    },
    [isEditMode, isPanning, getSvgPoint, props]
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setViewCenter({ x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2 });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const wheelHandler = (e: WheelEvent) => handleWheel(e);
    svg.addEventListener("wheel", wheelHandler, { passive: false });
    return () => svg.removeEventListener("wheel", wheelHandler);
  }, [handleWheel]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const baseMarkerSize = 10 / zoom;
  const hoverMarkerSize = 14 / zoom;
  const innerDotSize = 4 / zoom;
  const strokeWidth = 2 / zoom;
  const tooltipHeight = 28 / zoom;
  const tooltipRadius = 4 / zoom;
  const fontSize = 14 / zoom;
  const tooltipOffset = 42 / zoom;

  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
        className={`w-full h-full ${
          isPanning
            ? "cursor-grabbing"
            : isEditMode
            ? "cursor-crosshair"
            : "cursor-grab"
        }`}
        preserveAspectRatio="xMidYMid slice"
        onClick={handleSvgClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <image
          href="/jp.svg"
          x="0"
          y="0"
          width={BASE_WIDTH}
          height={BASE_HEIGHT}
        />

        {markers.map((marker) => {
          const isHovered = hoveredMarker === marker.id;
          const radius = isHovered ? hoverMarkerSize : baseMarkerSize;

          return (
            <g
              key={marker.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredMarker(marker.id)}
              onMouseLeave={() => setHoveredMarker(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (props.mode === "view" && props.onMarkerClick) {
                  props.onMarkerClick(marker);
                }
              }}
            >
              <circle
                cx={marker.x}
                cy={marker.y}
                r={radius}
                fill={
                  isHovered ? "hsl(var(--primary))" : "hsl(var(--destructive))"
                }
                stroke="hsl(var(--background))"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={marker.x}
                cy={marker.y}
                r={innerDotSize}
                fill="hsl(var(--background))"
                className="pointer-events-none"
              />

              {isHovered && (
                <g className="pointer-events-none">
                  <rect
                    x={marker.x - 65 / zoom}
                    y={marker.y - tooltipOffset}
                    width={130 / zoom}
                    height={tooltipHeight}
                    rx={tooltipRadius}
                    fill="hsl(var(--popover))"
                    stroke="hsl(var(--border))"
                    strokeWidth={1 / zoom}
                  />
                  <text
                    x={marker.x}
                    y={marker.y - tooltipOffset + tooltipHeight * 0.65}
                    textAnchor="middle"
                    fill="hsl(var(--popover-foreground))"
                    fontWeight="500"
                    fontSize={fontSize}
                  >
                    {marker.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {selectedLocation && (
          <g className="pointer-events-none">
            <circle
              cx={selectedLocation.x}
              cy={selectedLocation.y}
              r={hoverMarkerSize}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={selectedLocation.x}
              cy={selectedLocation.y}
              r={innerDotSize}
              fill="hsl(var(--background))"
            />
          </g>
        )}
      </svg>

      {zoom > 1.05 && (
        <button
          onClick={resetView}
          className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors z-10"
        >
          Reset View
        </button>
      )}

      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-xs text-muted-foreground z-10">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
