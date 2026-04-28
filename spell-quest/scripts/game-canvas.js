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
  // Pattern: pointerdown ON THE CANVAS starts the stroke; pointermove and
  // pointerup/pointercancel are bound to the WINDOW for the duration of the
  // stroke and then removed. This avoids `setPointerCapture`, which on iPadOS
  // Safari has a known stuck-after-N-strokes bug with Apple Pencil / touch
  // (the third pointerdown stops being delivered to the captured element).
  // Window-level move/up is the same pattern long-standing drawing apps use.
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

    const endStroke = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      strokeStartedRef.current = false;
      activePointerRef.current = null;
      const ctx = ctxRef.current;
      if (ctx) ctx.closePath();
      detachWindow();
    };

    const onWindowMove = (e) => {
      if (!drawingRef.current || disabledRef.current) return;
      if (activePointerRef.current != null && e.pointerId !== activePointerRef.current) return;
      // We registered as non-passive on window, so this is honored.
      if (e.cancelable) e.preventDefault();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { x, y } = pointAt(e.clientX, e.clientY);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onWindowUp = (e) => {
      if (activePointerRef.current != null && e.pointerId !== activePointerRef.current) return;
      endStroke();
    };

    const attachWindow = () => {
      window.addEventListener('pointermove',   onWindowMove, { passive: false });
      window.addEventListener('pointerup',     onWindowUp,   { passive: false });
      window.addEventListener('pointercancel', onWindowUp,   { passive: false });
      // Tab loses focus / app backgrounded: terminate cleanly.
      window.addEventListener('blur',          endStroke);
    };
    const detachWindow = () => {
      window.removeEventListener('pointermove',   onWindowMove);
      window.removeEventListener('pointerup',     onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      window.removeEventListener('blur',          endStroke);
    };

    const onDown = (e) => {
      if (disabledRef.current) return;
      // Ignore non-primary mouse buttons. Touch / pen always report button 0.
      if (e.button !== undefined && e.button > 0) return;
      // If a previous stroke somehow didn't terminate, clean up first.
      if (drawingRef.current) endStroke();

      if (e.cancelable) e.preventDefault();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { x, y } = pointAt(e.clientX, e.clientY);

      activePointerRef.current = e.pointerId;
      drawingRef.current = true;

      ctx.beginPath();
      ctx.moveTo(x, y);
      dot(x, y); // tap-without-move still leaves ink + seeds the path

      attachWindow();

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

    canvas.addEventListener('pointerdown', onDown, { passive: false });

    // Belt-and-suspenders: stop iPadOS from interpreting the touch as scroll
    // or double-tap-to-zoom before pointerdown is even dispatched.
    const swallow = (e) => { if (e.cancelable) e.preventDefault(); };
    canvas.addEventListener('touchstart', swallow, { passive: false });
    canvas.addEventListener('touchmove',  swallow, { passive: false });
    // Block default gesture handlers on iOS (zoom-on-double-tap on canvases).
    const blockGesture = (e) => e.preventDefault();
    canvas.addEventListener('gesturestart',  blockGesture);
    canvas.addEventListener('gesturechange', blockGesture);
    canvas.addEventListener('gestureend',    blockGesture);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('touchstart',  swallow);
      canvas.removeEventListener('touchmove',   swallow);
      canvas.removeEventListener('gesturestart',  blockGesture);
      canvas.removeEventListener('gesturechange', blockGesture);
      canvas.removeEventListener('gestureend',    blockGesture);
      detachWindow();
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
