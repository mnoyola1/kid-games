// ==================== WRITING CANVAS ====================
// Ported from n-learn's DrawingCanvas.tsx, then hardened for iPad:
//
//   • Pointer Events (mouse + touch + Apple Pencil unified, no extra logic).
//   • Native non-passive listeners attached via useEffect — React 17+ attaches
//     onTouchStart / onTouchMove as PASSIVE, so evt.preventDefault() inside is
//     silently ignored by Safari. That made the iPad steal fast double-touches
//     for double-tap-to-zoom and miss the start of the second letter.
//   • setPointerCapture on pointerdown so we keep getting moves even if the
//     pointer briefly drifts outside the canvas during a quick stroke.
//   • Initial dot on pointerdown so a tap-without-move (e.g. dot on "i") still
//     leaves ink, and so the very first sample of every stroke is committed
//     even if the next pointermove is delayed.
//   • touch-action: none + user-select: none on the canvas so iPadOS releases
//     gestures (zoom / scroll / callout) immediately to us.

const WritingCanvas = React.forwardRef(function WritingCanvas(
  { onStroke, onChange, disabled = false, heightClass = 'h-[260px] sm:h-[300px]', className = '' },
  ref
) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const activePointerRef = useRef(null);
  const strokeStartedRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const onStrokeRef = useRef(onStroke);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => { onStrokeRef.current = onStroke; }, [onStroke]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  // (Re)initialise the canvas to the current CSS size, preserving existing ink.
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(200, Math.floor(rect.width));
    const cssH = Math.max(120, Math.floor(rect.height));

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
    ctx.strokeStyle = '#231505';
    ctx.fillStyle = '#231505';
    ctxRef.current = ctx;

    if (prev.width && prev.height) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(prev, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, []);

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

  // ---- Native pointer / touch handling (non-passive) -----------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pointAt = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const dot = (x, y) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const r = ctx.lineWidth / 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const onDown = (e) => {
      if (disabledRef.current) return;
      // Right-click / middle mouse button: ignore.
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { x, y } = pointAt(e.clientX, e.clientY);

      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      activePointerRef.current = e.pointerId;
      drawingRef.current = true;

      ctx.beginPath();
      ctx.moveTo(x, y);
      dot(x, y); // ensures a tap-without-move leaves ink, and seeds the path

      if (!strokeStartedRef.current) {
        strokeStartedRef.current = true;
        onStrokeRef.current?.();
      }
      if (!hasDrawnRef.current) {
        hasDrawnRef.current = true;
        setHasDrawn(true);
        onChangeRef.current?.({ hasDrawn: true });
      }
    };

    const onMove = (e) => {
      if (!drawingRef.current || disabledRef.current) return;
      if (activePointerRef.current != null && e.pointerId !== activePointerRef.current) return;
      e.preventDefault();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { x, y } = pointAt(e.clientX, e.clientY);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onUp = (e) => {
      if (!drawingRef.current) return;
      if (activePointerRef.current != null && e.pointerId !== activePointerRef.current) return;
      drawingRef.current = false;
      strokeStartedRef.current = false;
      activePointerRef.current = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      const ctx = ctxRef.current;
      if (ctx) ctx.closePath();
    };

    // Pointer Events cover mouse + touch + Pencil with a single API.
    canvas.addEventListener('pointerdown',   onDown, { passive: false });
    canvas.addEventListener('pointermove',   onMove, { passive: false });
    canvas.addEventListener('pointerup',     onUp,   { passive: false });
    canvas.addEventListener('pointercancel', onUp,   { passive: false });
    canvas.addEventListener('pointerleave',  onUp,   { passive: false });

    // Belt-and-suspenders: stop iPadOS from interpreting the gesture as scroll
    // or double-tap-to-zoom even before pointerdown fires.
    const swallow = (e) => { e.preventDefault(); };
    canvas.addEventListener('touchstart', swallow, { passive: false });
    canvas.addEventListener('touchmove',  swallow, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown',   onDown);
      canvas.removeEventListener('pointermove',   onMove);
      canvas.removeEventListener('pointerup',     onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave',  onUp);
      canvas.removeEventListener('touchstart', swallow);
      canvas.removeEventListener('touchmove',  swallow);
    };
  }, []);

  // ---- Imperative API for parent ------------------------------------------
  React.useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      hasDrawnRef.current = false;
      setHasDrawn(false);
      drawingRef.current = false;
      strokeStartedRef.current = false;
      activePointerRef.current = null;
      onChangeRef.current?.({ hasDrawn: false });
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
  }), []);

  return (
    <div ref={wrapRef} className={`sq-canvas-wrap ${heightClass} ${className}`}>
      <canvas ref={canvasRef} />
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
