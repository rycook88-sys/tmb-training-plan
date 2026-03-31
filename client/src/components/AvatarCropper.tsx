import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, Check, RotateCcw } from "lucide-react";

const AVATAR_KEY = "tmb-gps-avatar";
const DEFAULT_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/face-marker_e35512b8.png";

/** Get the saved avatar data URL, or the default CDN image */
export function getAvatarUrl(): string {
  try {
    return localStorage.getItem(AVATAR_KEY) || DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

/** Listen for avatar changes */
const listeners = new Set<() => void>();
export function onAvatarChange(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function notifyListeners() {
  listeners.forEach(cb => cb());
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AvatarCropper({ open, onClose }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [pinching, setPinching] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setImageSrc(null);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Touch handlers for drag + pinch ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartScale.current = scale;
      setPinching(true);
    } else if (e.touches.length === 1) {
      // Drag start
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      offsetStart.current = { ...offset };
      setDragging(true);
    }
  }, [scale, offset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinching) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = Math.max(0.5, Math.min(5, pinchStartScale.current * (dist / pinchStartDist.current)));
      setScale(newScale);
    } else if (e.touches.length === 1 && dragging && !pinching) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setOffset({ x: offsetStart.current.x + dx, y: offsetStart.current.y + dy });
    }
  }, [dragging, pinching]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) setPinching(false);
    if (e.touches.length === 0) setDragging(false);
  }, []);

  // ── Mouse handlers for desktop drag + scroll zoom ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    setDragging(true);
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: offsetStart.current.x + dx, y: offsetStart.current.y + dy });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.max(0.5, Math.min(5, s + delta)));
  }, []);

  // ── Save cropped circular image ──
  const handleSave = useCallback(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 128;
    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);

      // Clip to circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // The crop area is 280x280 in the UI, mapping to 128x128 output
      const cropSize = 280;
      const ratio = size / cropSize;

      // Calculate image draw position based on scale and offset
      const imgW = img.width * scale * ratio;
      const imgH = img.height * scale * ratio;
      const drawX = (size / 2) + (offset.x * ratio) - (imgW / 2);
      const drawY = (size / 2) + (offset.y * ratio) - (imgH / 2);

      ctx.drawImage(img, drawX, drawY, imgW, imgH);

      // Save as data URL
      const dataUrl = canvas.toDataURL("image/png", 0.9);
      try {
        localStorage.setItem(AVATAR_KEY, dataUrl);
      } catch {
        // localStorage might be full
      }
      notifyListeners();
      onClose();
    };
    img.src = imageSrc;
  }, [imageSrc, scale, offset, onClose]);

  const handleReset = useCallback(() => {
    try {
      localStorage.removeItem(AVATAR_KEY);
    } catch {}
    notifyListeners();
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-[340px] max-w-[95vw] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <span className="text-xs font-mono text-slate-300 uppercase tracking-wider">GPS Avatar</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!imageSrc ? (
            // Upload prompt
            <label className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors">
              <Camera className="w-8 h-8 text-slate-500" />
              <span className="text-xs font-mono text-slate-400">Tap to upload photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            // Crop area
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-mono text-slate-500 text-center">
                Drag to position · Pinch or scroll to zoom
              </p>

              {/* Circular crop preview */}
              <div
                ref={containerRef}
                className="relative w-[280px] h-[280px] rounded-full overflow-hidden border-2 border-blue-500 bg-slate-800 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                    maxWidth: "none",
                    width: "280px",
                  }}
                  draggable={false}
                />
                {/* Crosshair guides */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-500/20" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/20" />
                </div>
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-2 w-full px-2">
                <span className="text-[9px] font-mono text-slate-500">ZOOM</span>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-blue-500"
                />
                <span className="text-[9px] font-mono text-slate-400 w-8 text-right">{scale.toFixed(1)}x</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-700">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-600 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> DEFAULT
          </button>
          <div className="flex-1" />
          {imageSrc && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-4 py-1.5 rounded-md bg-blue-600 text-[10px] font-mono text-white hover:bg-blue-500 transition-colors"
            >
              <Check className="w-3 h-3" /> SAVE
            </button>
          )}
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
