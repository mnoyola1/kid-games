// ==================== MATH MAGE — API CLIENT ====================
// Thin wrapper around /api/grade-math. Used by the lock-in mode; the
// action-arcade path doesn't call any server endpoint.

(function () {
  function describeServerError(body, status, label) {
    const main = body?.error || `${label} failed (${status})`;
    return body?.detail ? `${main} — ${body.detail}` : main;
  }

  async function gradeMath({ problem, imageDataUrl, studentName }) {
    const res = await fetch('/api/grade-math', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problem,
        imageBase64: imageDataUrl,
        studentName,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(describeServerError(body, res.status, 'Grading'));
    return body; // { transcribed, correct, note, expected }
  }

  window.MathMageAPI = { gradeMath };
})();
