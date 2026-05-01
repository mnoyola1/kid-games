// ==================== MATH MAGE — API CLIENT ====================
// Thin wrapper around /api/grade-math. Used by the lock-in mode; the
// action-arcade path doesn't call any server endpoint.

(function () {
  // Friendly per-status messages. The most common one in local dev is 501,
  // returned by Python's http.server for any POST (it only implements
  // GET/HEAD), so call that out explicitly with a hint to use Skip lock-in
  // or deploy to Vercel.
  function describeServerError(body, status, label) {
    if (status === 501) {
      return 'Grading server not running here. Tap "Skip lock-in" below — or open the deployed game to use real grading.';
    }
    if (status === 404) {
      return 'Grading endpoint not deployed yet. Try again in ~30s or use Skip lock-in.';
    }
    if (status === 500 && body?.detail?.includes('ANTHROPIC_API_KEY')) {
      return 'Grading is missing its API key on the server. Tap Skip lock-in for now.';
    }
    const main = body?.error || `${label} failed (${status})`;
    return body?.detail ? `${main} — ${body.detail}` : main;
  }

  async function gradeMath({ problem, imageDataUrl, studentName }) {
    let res;
    try {
      res = await fetch('/api/grade-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          imageBase64: imageDataUrl,
          studentName,
        }),
      });
    } catch (e) {
      // Network failure — endpoint unreachable, browser offline, etc.
      throw new Error('Grading server unreachable. Check your connection or tap Skip lock-in.');
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(describeServerError(body, res.status, 'Grading'));
    return body; // { transcribed, correct, note, expected }
  }

  window.MathMageAPI = { gradeMath };
})();
