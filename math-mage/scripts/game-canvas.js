// ==================== HANDWRITING CANVAS ====================
// Ported from spell-quest. Same iPad-hardened input handling — see
// spell-quest/scripts/game-canvas.js for the full design rationale on:
//
//   • iOS path: native TOUCH events bound on the canvas only (implicit
//     pointer capture so strokes that briefly leave the canvas keep firing).
//   • Non-iOS path: native POINTER events.
//   • `e.changedTouches.length` (not `e.touches.length`) for new-touch
//     detection so rapid taps on iPad don't drop every other digit.
//   • `touch-action: none` in CSS locks the gesture for its full duration,
//     so we don't need preventDefault on every move.
//
// The Math Mage lock-in writes a 1–3 digit answer ("42", "144", etc.), so
// we keep it intentionally short — same canvas works as-is, only the
// graded payload changes.

const MathMageWritingCanvas = React.forwardRef(function MathMageWritingCanvas(
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

  // We measure with offsetWidth/offsetHeight (untransformed layout box)
  // instead of getBoundingClientRect (which is *transform-affected*).
  // The lock-in card mounts inside a `mm-pop` entrance animation that
  // runs scale(0.5) → scale(1) over 380ms — measuring with gBCR during
  // that window would lock the canvas pixel buffer at half-size and the
  // strokes from the lower half of the visible area would silently fall
  // off the canvas's internal coordinate space. ResizeObserver doesn't
  // fire for transform changes, so we'd never recover until the user
  // tapped Cast Rune (which causes a re-render → re-measurement).
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(200, Math.floor(wrap.offsetWidth));
    const cssH = Math.max(120, Math.floor(wrap.offsetHeight));

    // No-op if the buffer already matches — avoids stomping on existing
    // strokes when post-animation re-measures fire and nothing changed.
    if (canvas.width === cssW * dpr && canvas.height === cssH * dpr) return;

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
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0c1f3a';
    ctx.fillStyle = '#0c1f3a';
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

    // Defensive re-measures: catch layout settling after the mm-pop
    // entrance animation (scale 0.5 → 1 over ~380ms) and any font/CSS
    // load that shifts the box.
    const t1 = setTimeout(resizeCanvas, 60);
    const t2 = setTimeout(resizeCanvas, 220);
    const t3 = setTimeout(resizeCanvas, 450);

    // Listen for any animationend bubbling up from ancestors (mm-pop).
    const onAnimEnd = () => resizeCanvas();
    const wrapEl = wrapRef.current;
    if (wrapEl) wrapEl.addEventListener('animationend', onAnimEnd);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('orientationchange', resizeCanvas);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (wrapEl) wrapEl.removeEventListener('animationend', onAnimEnd);
    };
  }, [resizeCanvas]);

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

    const startStroke = (x, y) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      drawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
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
        if (e.changedTouches.length !== 1) return;
        if (e.cancelable) e.preventDefault();
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
      // Math answers are 1-3 digits — much smaller payload than spelling.
      // Cap longest side at 600px for fast Claude transcription.
      const MAX_SIDE = 600;
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
    <div ref={wrapRef} className={`mm-canvas-wrap ${heightClass} ${className}`}>
      <canvas ref={canvasRef} />
      {!hasDrawn && !disabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="mm-cinzel text-2xl sm:text-3xl opacity-30 text-[#1a1620]">
            ✒️ Write your answer…
          </p>
        </div>
      )}
    </div>
  );
});

window.MathMageWritingCanvas = MathMageWritingCanvas;
