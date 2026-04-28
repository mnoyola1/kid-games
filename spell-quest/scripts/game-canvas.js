// ==================== WRITING CANVAS ====================
// Ported from n-learn's DrawingCanvas.tsx, then iterated until iPad worked:
//
//   • iOS path: native TOUCH events. PointerEvent synthesis on iPadOS Safari
//     is flaky for rapid taps — every-other-stroke is dropped on fast
//     handwriting (we observed exactly this with PointerEvent). Touch events
//     are the underlying iOS input mechanism and don't have that problem,
//     which is also why n-learn's canvas uses them.
//   • Non-iOS path: native POINTER events (mouse + Pen + Android touch).
//   • Down-event on canvas; move + end events on WINDOW so a fast stroke
//     that briefly leaves the canvas keeps painting AND never lands a drag
//     on the neighbouring "Hear the word" button (which would trigger
//     iPadOS text-select / button-press).
//   • Window listeners are attached once (for the lifetime of the canvas)
//     so we never race against attach/detach during rapid touches.
//   • Initial seed segment on down so a tap-without-move (e.g. dot on "i")
//     still leaves ink.
//   • touch-action: none on the canvas + user-select: none on body (in CSS)
//     so iPadOS releases scroll / zoom / callout gestures and can't select
//     button text mid-stroke.
//
// What we DON'T do, learned the hard way on iPadOS Safari:
//   • setPointerCapture: stuck state after ~2 strokes with Apple Pencil/touch.
//   • preventDefault on `touchstart` AND using PointerEvent: cancels the
//     synthesized pointerdown for the next touch, silently breaking the
//     second stroke. (Safe with the touch-event path because we don't rely
//     on pointer-event synthesis there.)
//   • preventDefault on window-level pointermove: iOS uses these events for
//     gesture arbitration; preventing can wedge the next stroke.

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

  // ---- Input handling: touch on iOS, pointer everywhere else --------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const IS_IOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    const pointAt = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    // ---- Input-source-agnostic stroke logic ----
    const startStroke = (x, y) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      drawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
      // Seed the path with a hairline segment so a tap without movement
      // still leaves a visible dot AND so the very first sample of every
      // stroke is committed even before the next move arrives.
      ctx.lineTo(x + 0.01, y + 0.01);
      ctx.stroke();
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

    const continueStroke = (x, y) => {
      if (!drawingRef.current) return;
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const endStroke = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      strokeStartedRef.current = false;
      const ctx = ctxRef.current;
      if (ctx) ctx.closePath();
    };

    if (IS_IOS) {
      // ---- TOUCH EVENTS (iOS only) ----
      let activeTouchId = null;

      const onTouchStart = (e) => {
        if (disabledRef.current) return;
        // Multi-touch: cancel any in-flight stroke and bail (don't fight
        // pinch/zoom from a second finger).
        if (e.touches.length > 1) {
          endStroke();
          activeTouchId = null;
          return;
        }
        // Need preventDefault here so iOS doesn't generate the synthetic
        // mouseclick that follows touchend. (Pointer-event suppression that
        // bit us before doesn't apply, because we ARE NOT using PointerEvent
        // on this code path.)
        if (e.cancelable) e.preventDefault();
        const t = e.changedTouches[0];
        activeTouchId = t.identifier;
        const { x, y } = pointAt(t.clientX, t.clientY);
        // Reset any leftover stroke state, then start fresh.
        endStroke();
        startStroke(x, y);
      };

      const onTouchMove = (e) => {
        if (!drawingRef.current || disabledRef.current) return;
        let touch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            touch = e.changedTouches[i];
            break;
          }
        }
        if (!touch) return;
        if (e.cancelable) e.preventDefault();
        const { x, y } = pointAt(touch.clientX, touch.clientY);
        continueStroke(x, y);
      };

      const onTouchEnd = (e) => {
        let matched = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            matched = true;
            break;
          }
        }
        if (!matched) return;
        endStroke();
        activeTouchId = null;
      };

      // touchstart on canvas: only strokes that originate on the canvas count.
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      // touchmove / end on WINDOW so a fast stroke that briefly leaves the
      // canvas keeps painting (and the drag can't land selection on a button).
      window.addEventListener('touchmove',   onTouchMove, { passive: false });
      window.addEventListener('touchend',    onTouchEnd,  { passive: true });
      window.addEventListener('touchcancel', onTouchEnd,  { passive: true });

      return () => {
        canvas.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove',   onTouchMove);
        window.removeEventListener('touchend',    onTouchEnd);
        window.removeEventListener('touchcancel', onTouchEnd);
      };
    }

    // ---- POINTER EVENTS (desktop / Android) ----
    let activePointerId = null;

    const onPointerDown = (e) => {
      if (disabledRef.current) return;
      if (e.button !== undefined && e.button > 0) return;
      if (e.cancelable) e.preventDefault();
      activePointerId = e.pointerId;
      const { x, y } = pointAt(e.clientX, e.clientY);
      endStroke();
      startStroke(x, y);
    };

    const onPointerMove = (e) => {
      if (!drawingRef.current || disabledRef.current) return;
      if (activePointerId != null && e.pointerId !== activePointerId) return;
      const { x, y } = pointAt(e.clientX, e.clientY);
      continueStroke(x, y);
    };

    const onPointerUp = (e) => {
      if (activePointerId != null && e.pointerId !== activePointerId) return;
      endStroke();
      activePointerId = null;
    };

    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointermove',   onPointerMove, { passive: true });
    window.addEventListener('pointerup',     onPointerUp,   { passive: true });
    window.addEventListener('pointercancel', onPointerUp,   { passive: true });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove',   onPointerMove);
      window.removeEventListener('pointerup',     onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
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
