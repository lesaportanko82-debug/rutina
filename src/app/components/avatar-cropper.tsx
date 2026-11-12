import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./theme";
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move } from "lucide-react";

interface AvatarCropperProps {
  file: File;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export function AvatarCropper({ file, onCrop, onCancel }: AvatarCropperProps) {
  const t = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Canvas / crop area sizes
  const CANVAS_SIZE = 280;
  const CROP_RADIUS = 120;

  // Load image from file
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      // Calculate initial scale to fill the crop circle
      const minDim = Math.min(img.width, img.height);
      const initialScale = (CROP_RADIUS * 2) / minDim * 1.1;
      setScale(initialScale);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(true);
    };
    img.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  // Render preview
  useEffect(() => {
    if (!imageLoaded || !imageRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image with transforms
    ctx.save();
    ctx.translate(cx + offset.x, cy + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Dark overlay outside crop circle
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // Cut out the circle
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, CROP_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(cx, cy, CROP_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid lines (crosshair)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 0.5;
    // Horizontal
    ctx.beginPath();
    ctx.moveTo(cx - CROP_RADIUS, cy);
    ctx.lineTo(cx + CROP_RADIUS, cy);
    ctx.stroke();
    // Vertical
    ctx.beginPath();
    ctx.moveTo(cx, cy - CROP_RADIUS);
    ctx.lineTo(cx, cy + CROP_RADIUS);
    ctx.stroke();
  }, [imageLoaded, scale, offset, rotation]);

  // Mouse/touch drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom with slider or buttons
  const handleZoom = useCallback((delta: number) => {
    setScale((prev) => Math.max(0.2, Math.min(5, prev + delta)));
  }, []);

  // Export cropped image
  const handleCrop = useCallback(() => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const outputSize = 512; // output avatar size
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outputSize;
    exportCanvas.height = outputSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    // Scale factor from canvas to output
    const sf = outputSize / (CROP_RADIUS * 2);

    // Clip to circle
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Apply same transforms, centered on the crop area
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.scale(sf, sf);
    ctx.translate(offset.x, offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    exportCanvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      "image/jpeg",
      0.92
    );
  }, [scale, offset, rotation, onCrop]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    if (!imageRef.current) return;
    const minDim = Math.min(imageRef.current.width, imageRef.current.height);
    setScale((CROP_RADIUS * 2) / minDim * 1.1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="rounded-3xl p-5 mx-4 w-full max-w-[340px] shadow-2xl"
          style={{ backgroundColor: t.card, border: `1px solid ${t.border}` }}
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>
              Обрезка фото
            </h3>
            <motion.button
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: t.bgSecondary }}
              onClick={onCancel}
              whileTap={{ scale: 0.85 }}
            >
              <X className="w-4 h-4" style={{ color: t.textMuted }} />
            </motion.button>
          </div>

          {/* Instruction */}
          <p className="text-center mb-3 flex items-center justify-center gap-1.5"
            style={{ fontSize: "0.72rem", color: t.textMuted }}>
            <Move className="w-3.5 h-3.5" />
            Перетаскивай фото для позиционирования
          </p>

          {/* Canvas area */}
          <div className="flex justify-center mb-4">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                backgroundColor: "#111",
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ display: "block" }}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-8 h-8 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: t.sage, borderTopColor: "transparent" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 mb-4 px-2">
            <motion.button
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: t.bgSecondary }}
              onClick={() => handleZoom(-0.15)}
              whileTap={{ scale: 0.85 }}
            >
              <ZoomOut className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
            </motion.button>
            <input
              type="range"
              min="0.2"
              max="5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, ${t.sage} ${((scale - 0.2) / 4.8) * 100}%, ${t.bgSecondary} ${((scale - 0.2) / 4.8) * 100}%)`,
                accentColor: t.sage,
              }}
            />
            <motion.button
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: t.bgSecondary }}
              onClick={() => handleZoom(0.15)}
              whileTap={{ scale: 0.85 }}
            >
              <ZoomIn className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
            </motion.button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <motion.button
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: t.bgSecondary }}
              onClick={handleRotate}
              whileTap={{ scale: 0.85 }}
              title="Повернуть"
            >
              <RotateCcw className="w-4 h-4" style={{ color: t.textMuted }} />
            </motion.button>
            <motion.button
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: t.bgSecondary }}
              onClick={handleReset}
              whileTap={{ scale: 0.85 }}
              title="Сбросить"
            >
              <span style={{ fontSize: "0.7rem", color: t.textMuted, fontWeight: 600 }}>↺</span>
            </motion.button>
            <motion.button
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-white"
              style={{ background: "linear-gradient(135deg, #8DB596, #7BAFB0)" }}
              onClick={handleCrop}
              whileTap={{ scale: 0.95 }}
            >
              <Check className="w-4 h-4" />
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Применить</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
