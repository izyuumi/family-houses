"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

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
const MOBILE_MARKER_TAP_RADIUS = 25;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [viewCenter, setViewCenter] = useState({
    x: BASE_WIDTH / 2,
    y: BASE_HEIGHT / 2,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const touchStartTime = useRef<number>(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

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

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev * 1.5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev / 1.5));
  }, []);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isEditMode && e.touches.length === 1) return;
      
      touchStartTime.current = Date.now();
      hasMoved.current = false;

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        setIsPanning(true);
        setLastMousePos({ x: touch.clientX, y: touch.clientY });
      } else if (e.touches.length === 2) {
        e.preventDefault();
        lastTouchDistance.current = getTouchDistance(e.touches);
        lastTouchCenter.current = getTouchCenter(e.touches);
      }
    },
    [isEditMode]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const newDistance = getTouchDistance(e.touches);
        const newCenter = getTouchCenter(e.touches);

        if (lastTouchDistance.current && newDistance) {
          const scaleFactor = newDistance / lastTouchDistance.current;
          const newZoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, zoom * scaleFactor)
          );

          const point = getSvgPoint(newCenter.x, newCenter.y);
          if (point) {
            const zoomFactor = newZoom / zoom;
            const newCenterX = point.x + (viewCenter.x - point.x) / zoomFactor;
            const newCenterY = point.y + (viewCenter.y - point.y) / zoomFactor;
            setViewCenter({ x: newCenterX, y: newCenterY });
          }

          setZoom(newZoom);
          lastTouchDistance.current = newDistance;
        }

        if (lastTouchCenter.current && svgRef.current) {
          const svg = svgRef.current;
          const rect = svg.getBoundingClientRect();
          const scaleX = viewWidth / rect.width;
          const scaleY = viewHeight / rect.height;

          const dx = (newCenter.x - lastTouchCenter.current.x) * scaleX;
          const dy = (newCenter.y - lastTouchCenter.current.y) * scaleY;

          setViewCenter((prev) => ({
            x: prev.x - dx,
            y: prev.y - dy,
          }));
          lastTouchCenter.current = newCenter;
        }
      } else if (e.touches.length === 1 && isPanning && !isEditMode) {
        hasMoved.current = true;
        const touch = e.touches[0];
        
        if (svgRef.current) {
          const svg = svgRef.current;
          const rect = svg.getBoundingClientRect();
          const scaleX = viewWidth / rect.width;
          const scaleY = viewHeight / rect.height;

          const dx = (touch.clientX - lastMousePos.x) * scaleX;
          const dy = (touch.clientY - lastMousePos.y) * scaleY;

          setViewCenter((prev) => ({
            x: prev.x - dx,
            y: prev.y - dy,
          }));
          setLastMousePos({ x: touch.clientX, y: touch.clientY });
        }
      }
    },
    [zoom, viewCenter, viewWidth, viewHeight, isPanning, isEditMode, getSvgPoint, lastMousePos]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touchDuration = Date.now() - touchStartTime.current;
      const isTap = touchDuration < 200 && !hasMoved.current;

      if (isTap && touchStartPos.current && props.mode === "view") {
        const point = getSvgPoint(touchStartPos.current.x, touchStartPos.current.y);
        if (point) {
          const hitMarker = markers.find((marker) => {
            const hitRadius = (MOBILE_MARKER_TAP_RADIUS / zoom);
            const dx = Math.abs(marker.x - point.x);
            const dy = Math.abs(marker.y - point.y);
            return dx < hitRadius && dy < hitRadius;
          });

          if (hitMarker && props.onMarkerClick) {
            setActiveMarker(hitMarker.id);
            setTimeout(() => setActiveMarker(null), 150);
            props.onMarkerClick(hitMarker);
          }
        }
      }

      if (e.touches.length === 0) {
        setIsPanning(false);
        lastTouchDistance.current = null;
        lastTouchCenter.current = null;
        touchStartPos.current = null;
      } else if (e.touches.length === 1) {
        lastTouchDistance.current = null;
        lastTouchCenter.current = null;
        setLastMousePos({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        });
      }
    },
    [markers, zoom, props, getSvgPoint]
  );

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

  const baseMarkerSize = 12 / zoom;
  const hoverMarkerSize = 16 / zoom;
  const activeMarkerSize = 18 / zoom;
  const innerDotSize = 5 / zoom;
  const strokeWidth = 2.5 / zoom;
  const tooltipHeight = 28 / zoom;
  const tooltipRadius = 4 / zoom;
  const fontSize = 14 / zoom;
  const tooltipOffset = 46 / zoom;
  const touchTargetSize = MOBILE_MARKER_TAP_RADIUS / zoom;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden touch-none">
      <svg
        ref={svgRef}
        viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
        className={`w-full h-full select-none ${
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
          const isActive = activeMarker === marker.id;
          const radius = isActive
            ? activeMarkerSize
            : isHovered
            ? hoverMarkerSize
            : baseMarkerSize;

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
                r={touchTargetSize}
                fill="transparent"
                className="pointer-events-auto"
              />
              
              {isActive && (
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={activeMarkerSize * 1.8}
                  fill="hsl(var(--primary) / 0.2)"
                  className="pointer-events-none"
                />
              )}
              
              <circle
                cx={marker.x}
                cy={marker.y}
                r={radius}
                fill={
                  isActive
                    ? "hsl(var(--primary))"
                    : isHovered
                    ? "hsl(var(--primary))"
                    : "hsl(var(--destructive))"
                }
                stroke="hsl(var(--background))"
                strokeWidth={strokeWidth}
                className="transition-all duration-100"
              />
              <circle
                cx={marker.x}
                cy={marker.y}
                r={innerDotSize}
                fill="hsl(var(--background))"
                className="pointer-events-none"
              />

              {(isHovered || isActive) && (
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

      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        <div className="flex gap-1">
          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="w-10 h-10 flex items-center justify-center bg-background/95 backdrop-blur-sm border border-border rounded-lg hover:bg-muted active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
            aria-label="Zoom in"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="w-10 h-10 flex items-center justify-center bg-background/95 backdrop-blur-sm border border-border rounded-lg hover:bg-muted active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
            aria-label="Zoom out"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground text-center shadow-sm">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {zoom > 1.05 && (
        <button
          onClick={resetView}
          className="absolute bottom-4 right-4 h-10 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-4 text-sm font-medium hover:bg-muted active:scale-95 transition-all z-10 shadow-sm"
        >
          Reset
        </button>
      )}
    </div>
  );
}
