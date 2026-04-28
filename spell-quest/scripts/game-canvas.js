// ==================== WRITING CANVAS ====================
// Ported from n-learn's DrawingCanvas.tsx, then iterated until iPad worked:
//
//   • Pointer Events (mouse + touch + Apple Pencil unified, no extra logic).
//   • pointerdown bound to the canvas; pointermove + pointerup bound to the
//     WINDOW for the duration of an active stroke, then removed. Without that,
//     fast handwriting that briefly leaves the canvas truncates the stroke
//     AND can trigger iPadOS text-select on neighbouring buttons.
//   • Initial dot on pointerdown so a tap-without-move (e.g. dot on "i") still
//     leaves ink, and so the first sample of every stroke is always committed.
//   • touch-action: none on the canvas + user-select: none on body (in CSS)
//     so iPadOS releases scroll / zoom / callout gestures and never selects
//     button text mid-stroke.
//
// What we DON'T do, learned the hard way on iPadOS Safari:
//   • setPointerCapture: stuck state after ~2 strokes with Apple Pencil/touch.
//   • preventDefault on `touchstart`: cancels the synthesized pointerdown for
//     the next touch (WebKit suppresses the mouse/pointer cascade), silently
//     breaking the second stroke.
//   • preventDefault on window-level `pointermove`: iOS uses these for its
//     own gesture arbitration; preventing them can wedge the next stroke.

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

  // ---- Native pointer handling --------------------------------------------
  // pointerdown is bound to the canvas; pointermove + pointerup are bound to
  // the WINDOW for the duration of an active stroke, then removed. This keeps
  // tracking the stylus / finger when it temporarily moves off the canvas
  // (which happens constantly on a small canvas with fast handwriting), so:
  //   • fast strokes that briefly leave the canvas still paint correctly when
  //     they come back, and
  //   • the pointer drag never lands on neighbouring UI (e.g. the "Hear the
  //     word" button) and triggers text selection or a stray button press.
  //
  // What we DON'T do, learned the hard way on iPadOS Safari:
  //   • setPointerCapture: stuck state after ~2 strokes with Apple Pencil.
  //   • preventDefault on `touchstart`: cancels the synthesized pointerdown
  //     for the next touch (WebKit suppresses the mouse/pointer cascade),
  //     silently breaking the second stroke.
  //   • Manual gesturestart blocking: same family of regressions; not needed
  //     while CSS `touch-action: none` is set on the canvas.
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

    const closeAnyOpenStroke = () => {
      if (!drawingRef.current) {
        detachWindow();
        return;
      }
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
      // Don't preventDefault on window-level move — iOS uses this for gesture
      // arbitration and calling preventDefault here can wedge the next stroke.
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { x, y } = pointAt(e.clientX, e.clientY);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onWindowUp = (e) => {
      if (activePointerRef.current != null && e.pointerId !== activePointerRef.current) return;
      closeAnyOpenStroke();
    };

    let windowAttached = false;
    const attachWindow = () => {
      if (windowAttached) return;
      windowAttached = true;
      window.addEventListener('pointermove',   onWindowMove, { passive: true });
      window.addEventListener('pointerup',     onWindowUp,   { passive: true });
      window.addEventListener('pointercancel', onWindowUp,   { passive: true });
    };
    function detachWindow() {
      if (!windowAttached) return;
      windowAttached = false;
      window.removeEventListener('pointermove',   onWindowMove);
      window.removeEventListener('pointerup',     onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    }

    const onDown = (e) => {
      if (disabledRef.current) return;
      if (e.button !== undefined && e.button > 0) return;
      // Edge case: previous stroke ended off-canvas. Reset before starting.
      closeAnyOpenStroke();

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

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
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
