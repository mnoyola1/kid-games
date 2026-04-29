// ==================== WRITING CANVAS ====================
// Ported from n-learn's DrawingCanvas.tsx, then iterated against real iPad
// hardware. Final design:
//
//   • iOS path: native TOUCH events bound on the CANVAS element only.
//     Touch events have implicit pointer capture in the spec — once
//     touchstart fires on the canvas, all subsequent touchmove / end /
//     cancel events for that touch keep firing on the canvas, even while
//     the finger is outside the canvas's bounds. So canvas-only listeners
//     handle the "fast stroke briefly leaves the canvas" case cleanly,
//     without the window-level race conditions we hit earlier.
//   • Non-iOS path: native POINTER events (mouse + Pen + Android touch).
//   • New-touch detection uses `e.changedTouches.length` (touches that
//     STARTED in this event), NOT `e.touches.length` (all currently active
//     touches). On rapid taps, iOS sometimes hasn't dispatched the
//     previous touchend yet by the time the next touchstart fires —
//     `e.touches.length` reads as 2 transiently, and the old
//     `> 1 ⇒ multi-finger ⇒ bail` check was eating every other letter.
//   • touchmove / end / cancel are passive: `touch-action: none` on the
//     canvas (in CSS) already locks the gesture for its full duration, so
//     we don't need to preventDefault on every move and risk wedging iOS's
//     gesture arbiter.
//   • Initial seed segment on down so a tap-without-move (e.g. dot on "i")
//     still leaves ink.
//   • `touch-action: none` on canvas + `user-select: none` on html/body
//     (CSS) so iPadOS doesn't try to scroll, zoom, or select button text
//     when a fast stroke briefly grazes the "Hear the word" button.
//
// What we DON'T do, learned the hard way on iPadOS Safari:
//   • setPointerCapture: stuck state after ~2 strokes with Apple Pencil.
//   • PointerEvent on iOS: synthesis from native touches is flaky for
//     rapid taps — Safari drops every other pointerdown.
//   • Window-level touchend with passive:true: not always delivered when
//     the touch ends on a non-canvas element while the canvas is between
//     re-renders.

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
      // All four touch listeners on the CANVAS itself. Touch events have
      // implicit pointer capture in the spec — touchmove / end / cancel keep
      // firing on the element where touchstart originated, even when the
      // finger leaves that element's bounds. So canvas-only is enough to
      // track strokes that briefly overshoot the canvas.
      //
      // Critical: we check `e.changedTouches.length` (touches that started
      // in THIS event), not `e.touches.length` (all currently active touches).
      // On rapid taps, the previous stroke's touchend hasn't always been
      // processed by iOS by the time the next touchstart arrives, so
      // `e.touches.length` momentarily reads as 2 even though the user only
      // has one finger / Pencil down. That false-positive multi-touch was
      // dropping every other letter on fast handwriting.
      let activeTouchId = null;

      const findActiveTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            return e.changedTouches[i];
          }
        }
        return null;
      };

      const onTouchStart = (e) => {
        if (disabledRef.current) return;
        // Reject only TRUE multi-finger starts (>1 touch *changed* this event).
        if (e.changedTouches.length !== 1) return;
        // preventDefault suppresses the synthesized click that would follow
        // touchend — without this, the click can land on whatever button
        // happens to be under where the stroke ended.
        if (e.cancelable) e.preventDefault();
        // Reset any leftover stroke state, then start fresh.
        endStroke();
        const t = e.changedTouches[0];
        activeTouchId = t.identifier;
        const { x, y } = pointAt(t.clientX, t.clientY);
        startStroke(x, y);
      };

      const onTouchMove = (e) => {
        if (!drawingRef.current || disabledRef.current) return;
        const touch = findActiveTouch(e);
        if (!touch) return;
        // No preventDefault needed — `touch-action: none` on the canvas in
        // CSS already locks the gesture for its full duration.
        const { x, y } = pointAt(touch.clientX, touch.clientY);
        continueStroke(x, y);
      };

      const onTouchEnd = (e) => {
        if (!findActiveTouch(e)) return;
        endStroke();
        activeTouchId = null;
      };

      canvas.addEventListener('touchstart',  onTouchStart, { passive: false });
      canvas.addEventListener('touchmove',   onTouchMove,  { passive: true });
      canvas.addEventListener('touchend',    onTouchEnd,   { passive: true });
      canvas.addEventListener('touchcancel', onTouchEnd,   { passive: true });

      return () => {
        canvas.removeEventListener('touchstart',  onTouchStart);
        canvas.removeEventListener('touchmove',   onTouchMove);
        canvas.removeEventListener('touchend',    onTouchEnd);
        canvas.removeEventListener('touchcancel', onTouchEnd);
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
      // Flatten onto a white background AND downscale to a max longest side
      // (default 900px) so 25-word grading payloads stay well under Vercel's
      // 4.5 MB body limit. Claude reads handwriting fine at this resolution
      // — testing shows no transcription regression vs full-DPR canvas.
      const MAX_SIDE = 900;
      const w0 = canvas.width;
      const h0 = canvas.height;
      const scale = Math.min(1, MAX_SIDE / Math.max(w0, h0));
      const w = Math.max(1, Math.round(w0 * scale));
      const h = Math.max(1, Math.round(h0 * scale));
      const flat = document.createElement('canvas');
      flat.width = w;
      flat.height = h;
      const fctx = flat.getContext('2d');
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, w, h);
      fctx.imageSmoothingEnabled = true;
      fctx.imageSmoothingQuality = 'high';
      fctx.drawImage(canvas, 0, 0, w0, h0, 0, 0, w, h);
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
