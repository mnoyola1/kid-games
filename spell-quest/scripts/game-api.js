// ==================== API CLIENTS ====================
// Thin wrappers around /api/extract-words and /api/grade-spelling.
// We pass the FULL data URL through; the server sniffs magic bytes to determine
// the correct media_type to send Claude. (Stripping the data-URL prefix client
// side previously made the server tell Claude every JPEG was a PNG, which
// caused 500s on photo upload.)

function describeServerError(body, status, label) {
  const main = body?.error || `${label} failed (${status})`;
  return body?.detail ? `${main} — ${body.detail}` : main;
}

async function extractWords(imageDataUrl, grade) {
  const res = await fetch('/api/extract-words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: imageDataUrl,
      grade,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(describeServerError(body, res.status, 'Extraction'));
  return body; // { suggestedName, words: [{word, sentence?}] }
}

async function gradeSpelling(canvases, { studentName } = {}) {
  const payload = {
    studentName,
    canvases: canvases.map(({ word, dataUrl }) => ({
      word,
      imageBase64: dataUrl,
    })),
  };
  const res = await fetch('/api/grade-spelling', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(describeServerError(body, res.status, 'Grading'));
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
