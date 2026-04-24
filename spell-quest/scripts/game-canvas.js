// ==================== WRITING CANVAS ====================
// Ported from n-learn's DrawingCanvas.tsx, adapted to:
//  - plain React via Babel (no TS)
//  - ref-based API so the parent can clear/read on demand
//  - Spell Quest "ink on parchment" styling + stroke hook
//  - resilient high-DPI layout that reflows on container resize

const WritingCanvas = React.forwardRef(function WritingCanvas(
  { onStroke, onChange, disabled = false, heightClass = 'h-[260px] sm:h-[300px]', className = '' },
  ref
) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const strokeStartedRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // (Re)initialise the canvas to the current CSS size, preserving existing ink.
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(200, Math.floor(rect.width));
    const cssH = Math.max(120, Math.floor(rect.height));

    // Preserve existing ink across resizes.
    const prev = document.createElement('canvas');
    prev.width = canvas.width;
    prev.height = canvas.height;
    if (canvas.width && canvas.height) {
      prev.getContext('2d').drawImage(canvas, 0, 0);
    }

    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#231505'; // dark sepia ink
    ctx.fillStyle = 'rgba(255,255,255,0)'; // transparent so parchment bg shows
    ctxRef.current = ctx;

    // Restore previous ink scaled to new size (approx).
    if (prev.width && prev.height) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(prev, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, []);

  // Initialise + observe resize.
  useEffect(() => {
    resizeCanvas();
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => resizeCanvas())
      : null;
    if (ro && wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('orientationchange', resizeCanvas);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, [resizeCanvas]);

  // -------------- Event coordinates --------------
  const pointAt = useCallback((evt) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const t = evt.touches?.[0] || evt.changedTouches?.[0];
    const clientX = t ? t.clientX : evt.clientX;
    const clientY = t ? t.clientY : evt.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const beginStroke = useCallback((evt) => {
    if (disabled) return;
    evt.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { x, y } = pointAt(evt);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
    if (!strokeStartedRef.current) {
      strokeStartedRef.current = true;
      if (typeof onStroke === 'function') onStroke();
    }
  }, [disabled, pointAt, onStroke]);

  const continueStroke = useCallback((evt) => {
    if (!drawingRef.current || disabled) return;
    evt.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { x, y } = pointAt(evt);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasDrawn(true);
      if (typeof onChange === 'function') onChange({ hasDrawn: true });
    }
  }, [disabled, pointAt, onChange]);

  const endStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    strokeStartedRef.current = false;
    const ctx = ctxRef.current;
    if (ctx) ctx.closePath();
  }, []);

  // -------------- Imperative API for parent --------------
  React.useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      hasDrawnRef.current = false;
      setHasDrawn(false);
      if (typeof onChange === 'function') onChange({ hasDrawn: false });
    },
    getDataUrl() {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      // Flatten onto a white background so Claude can read it clearly.
      const flat = document.createElement('canvas');
      flat.width = canvas.width;
      flat.height = canvas.height;
      const fctx = flat.getContext('2d');
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, flat.width, flat.height);
      fctx.drawImage(canvas, 0, 0);
      return flat.toDataURL('image/png');
    },
    isEmpty() {
      return !hasDrawnRef.current;
    },
  }), [onChange]);

  return (
    <div ref={wrapRef} className={`sq-canvas-wrap ${heightClass} ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseDown={beginStroke}
        onMouseMove={continueStroke}
        onMouseUp={endStroke}
        onMouseLeave={endStroke}
        onTouchStart={beginStroke}
        onTouchMove={continueStroke}
        onTouchEnd={endStroke}
        onTouchCancel={endStroke}
      />
      {!hasDrawn && !disabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="sq-scribe text-2xl sm:text-3xl opacity-40">
            ✒️ Write here…
          </p>
        </div>
      )}
    </div>
  );
});

window.WritingCanvas = WritingCanvas;
