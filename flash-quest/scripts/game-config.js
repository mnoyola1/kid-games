// ==================== GAME CONFIG ====================
const LUMINA_ENABLED = typeof LuminaCore !== 'undefined';
const LUMINA_GAME_ID = 'flashQuest';

const ROUND_SIZE = { flip: 15, quiz: 10, match: 6 };
const MAX_BOX = 5; // Leitner boxes: 1 = new / missed, 5 = mastered
const REWARDS = { xpPerCorrect: 8, coinsPerCorrect: 1, roundXp: 20, matchXp: 30 };

const SUBJECT_STYLE = {
  ela: { icon: '📚', color: 'from-pink-500 to-rose-500' },
  reading: { icon: '📚', color: 'from-pink-500 to-rose-500' },
  science: { icon: '🧪', color: 'from-emerald-500 to-teal-500' },
  'social studies': { icon: '🗽', color: 'from-amber-500 to-orange-500' },
  math: { icon: '➗', color: 'from-sky-500 to-blue-600' },
  spelling: { icon: '✏️', color: 'from-violet-500 to-purple-600' },
  default: { icon: '🃏', color: 'from-indigo-500 to-purple-600' },
};
const subjectStyle = (subject) => SUBJECT_STYLE[(subject || '').toLowerCase()] || SUBJECT_STYLE.default;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const uid = () => `mine-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const cardKey = (card) => card.term.trim().toLowerCase();

function daysUntil(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
}

function testLabel(isoDate) {
  const n = daysUntil(isoDate);
  if (n === null || n < 0) return null;
  if (n === 0) return 'Test today!';
  if (n === 1) return 'Test tomorrow';
  return `Test in ${n} days`;
}

// Quizlet "Export" text: one card per line, term and definition split by a tab (default),
// or a custom separator like " - ", ",", or ":". Cards may also be split by ";" on one line.
function parseCardText(text) {
  const raw = text.replace(/\r/g, '').trim();
  if (!raw) return [];
  let rows = raw.split('\n').filter((l) => l.trim());
  if (rows.length === 1 && raw.includes(';')) rows = raw.split(';').filter((l) => l.trim());
  const seps = ['\t', ' - ', ' – ', ' — ', ':', ','];
  const sep = seps.find((s) => rows.filter((r) => r.includes(s)).length >= Math.ceil(rows.length * 0.6)) || '\t';
  return rows
    .map((r) => {
      const i = r.indexOf(sep);
      return i < 0 ? null : { term: r.slice(0, i).trim(), definition: r.slice(i + sep.length).trim() };
    })
    .filter((c) => c && c.term && c.definition);
}

// ---------- per-player storage: own decks + card progress (synced through LuminaCore game saves) ----------
class DeckStore {
  constructor(player) {
    this.player = player;
    this.key = `flashQuest.${player ? player.id : 'guest'}`;
    let local = {};
    try { local = JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) {}
    const cloud = player && LuminaCore.getGameSave ? LuminaCore.getGameSave(player.id, LUMINA_GAME_ID) : null;
    const pick = cloud && cloud.state && (cloud.savedAt || 0) >= (local.savedAt || 0) ? cloud.state : local;
    this.data = { decks: pick.decks || [], progress: pick.progress || {}, best: pick.best || {}, savedAt: pick.savedAt || 0 };
  }

  save() {
    this.data.savedAt = Date.now();
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {}
    if (this.player && LuminaCore.setGameSave) LuminaCore.setGameSave(this.player.id, LUMINA_GAME_ID, this.data);
  }

  saveDeck(deck) {
    this.data.decks = [deck, ...this.data.decks.filter((d) => d.id !== deck.id)];
    this.save();
  }

  deleteDeck(id) {
    this.data.decks = this.data.decks.filter((d) => d.id !== id);
    delete this.data.progress[id];
    this.save();
  }

  box(deckId, card) {
    return (this.data.progress[deckId] || {})[cardKey(card)] || 1;
  }

  mark(deckId, card, correct) {
    const p = (this.data.progress[deckId] = this.data.progress[deckId] || {});
    const k = cardKey(card);
    p[k] = correct ? Math.min(MAX_BOX, (p[k] || 1) + 1) : 1;
  }

  mastery(deck) {
    if (!deck.cards.length) return 0;
    const total = deck.cards.reduce((sum, c) => sum + (this.box(deck.id, c) - 1), 0);
    return Math.round((total / (deck.cards.length * (MAX_BOX - 1))) * 100);
  }

  mastered(deck) {
    return deck.cards.filter((c) => this.box(deck.id, c) >= MAX_BOX).length;
  }

  // Lowest boxes first, shuffled within a box, so missed cards keep coming back.
  pickCards(deck, n) {
    return shuffle(deck.cards)
      .sort((a, b) => this.box(deck.id, a) - this.box(deck.id, b))
      .slice(0, n);
  }
}

// Four choices: the right answer plus the deck's own wrong answers, topped up from other cards.
function choicesFor(card, deck, reversed) {
  const answer = reversed ? card.term : card.definition;
  const pool = reversed
    ? deck.cards.filter((c) => c !== card).map((c) => c.term)
    : [...(card.wrong || []), ...shuffle(deck.cards.filter((c) => c !== card).map((c) => c.definition))];
  const wrong = [];
  for (const option of pool) {
    if (wrong.length >= 3) break;
    if (option && option !== answer && !wrong.includes(option)) wrong.push(option);
  }
  return shuffle([answer, ...wrong]);
}
