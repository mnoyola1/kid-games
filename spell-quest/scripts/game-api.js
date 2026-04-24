// ==================== API CLIENTS ====================
// Thin wrappers around /api/extract-words and /api/grade-spelling.
// Both API routes expect a JSON POST and return JSON. Both accept data-URL
// strings directly, but we strip the prefix here to keep payloads small.

function stripDataUrl(s) {
  if (typeof s !== 'string') return '';
  const m = s.match(/^data:image\/(?:png|jpeg|jpg);base64,(.+)$/i);
  return m ? m[1] : s;
}

async function extractWords(imageDataUrl, grade) {
  const res = await fetch('/api/extract-words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: stripDataUrl(imageDataUrl),
      grade,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Extraction failed (${res.status})`);
  return body; // { suggestedName, words: [{word, sentence?}] }
}

async function gradeSpelling(canvases, { studentName } = {}) {
  const payload = {
    studentName,
    canvases: canvases.map(({ word, dataUrl }) => ({
      word,
      imageBase64: stripDataUrl(dataUrl),
    })),
  };
  const res = await fetch('/api/grade-spelling', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Grading failed (${res.status})`);
  return body; // { items, overall_feedback, strengths, areas_to_improve, correct_count, total_count, score }
}

// Resize a browser-loaded image to cap longest side (reduces upload size).
function fileToResizedDataUrl(file, maxSide = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Unable to read image'));
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

window.SpellQuestAPI = { extractWords, gradeSpelling, fileToResizedDataUrl };
