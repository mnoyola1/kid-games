// ==================== SPELL QUEST — CONFIG ====================
// Constants, default word banks, encouragement lines, asset paths.
// Keep this file pure data so the rest of the game stays thin.

const ASSETS = {
  logo:         '../assets/spell-quest/logo_nobg.png',
  grimoire:     '../assets/spell-quest/grimoire_frame_nobg.png',
  rune:         '../assets/spell-quest/rune_medallion_nobg.png',
  keeper:       '../assets/spell-quest/keeper_portrait_nobg.png',
  victoryCrest: '../assets/spell-quest/victory_crest_nobg.png',
  bgMain:       '../assets/backgrounds/spell-quest/bg_main.png',
  bgMenu:       '../assets/backgrounds/spell-quest/bg_menu.png',
  bgScroll:     '../assets/backgrounds/spell-quest/bg_results_scroll.png',
};

const MUSIC = {
  menu:     '../assets/audio/spell-quest/music/menu.mp3',
  gameplay: '../assets/audio/spell-quest/music/gameplay_long.mp3',
  grading:  '../assets/audio/spell-quest/music/grading_pensive.mp3',
  victory:  '../assets/audio/spell-quest/music/victory.mp3',
  gameover: '../assets/audio/spell-quest/music/gameover.mp3',
};

const SFX = {
  quill:        '../assets/audio/spell-quest/sfx/quill_stroke.mp3',
  runeInscribe: '../assets/audio/spell-quest/sfx/rune_inscribe.mp3',
  inkFade:      '../assets/audio/spell-quest/sfx/ink_fade.mp3',
  scroll:       '../assets/audio/spell-quest/sfx/scroll_unfurl.mp3',
  stamp:        '../assets/audio/spell-quest/sfx/seal_stamp.mp3',
  pageTurn:     '../assets/audio/spell-quest/sfx/page_turn.mp3',
  levelup:      '../assets/audio/spell-quest/sfx/levelup.mp3',
  coin:         '../assets/audio/spell-quest/sfx/coin.mp3',
};

const KEEPER_LINES = {
  intro:         '../assets/audio/spell-quest/voice/keeper_intro.mp3',
  perfect:       '../assets/audio/spell-quest/voice/keeper_perfect.mp3',
  goodJob:       '../assets/audio/spell-quest/voice/keeper_good_job.mp3',
  tryAgain:      '../assets/audio/spell-quest/voice/keeper_try_again.mp3',
  practiceIntro: '../assets/audio/spell-quest/voice/keeper_practice_intro.mp3',
  retestIntro:   '../assets/audio/spell-quest/voice/keeper_retest_intro.mp3',
  grading:       '../assets/audio/spell-quest/voice/keeper_grading.mp3',
};

// Default word banks for quick starts (used when no custom list is loaded).
// Emma = 5th grade, Liam = 3rd grade.
const DEFAULT_LISTS = [
  {
    id: 'starter-grade3',
    name: 'Starter — Grade 3',
    grade: 3,
    words: [
      { word: 'because' }, { word: 'friend' }, { word: 'believe' },
      { word: 'favorite' }, { word: 'different' }, { word: 'thought' },
      { word: 'brought' }, { word: 'people' }, { word: 'every' },
      { word: 'school' }, { word: 'morning' }, { word: 'special' },
    ],
  },
  {
    id: 'starter-grade5',
    name: 'Starter — Grade 5',
    grade: 5,
    words: [
      { word: 'necessary' }, { word: 'mischievous' }, { word: 'occasionally' },
      { word: 'separate' }, { word: 'definitely' }, { word: 'immediately' },
      { word: 'rhythm' }, { word: 'vacuum' }, { word: 'conscience' },
      { word: 'acquire' }, { word: 'apparent' }, { word: 'beneficial' },
    ],
  },
];

// Words-per-list tuning.
const MAX_WORDS_PER_TEST = 20;
const SECONDS_PER_WORD = 15;
const MAX_TTS_REPLAYS = 2;

// Encouragement fallbacks for when Claude's note is missing.
const ENCOURAGE_OK = [
  'Perfectly inscribed.', 'Runes shine bright.', 'The ink holds.',
  'A clean strike of the quill.', 'Beautifully written.',
];
const ENCOURAGE_MISS = [
  'A stroke out of place — we will mend it.',
  'The ink faltered. Try again in practice.',
  'Almost! Note the letters carefully.',
];

// XP / coins (per plan).
function computeRewards(correct, total, isRetest) {
  const perfect = correct === total && total > 0;
  let xp = 40 + correct * 4 + (perfect ? 40 : 0);
  if (isRetest && perfect) xp += 30;
  const coins = Math.floor(xp * 0.5);
  const rewardPoints = Math.floor(xp / 20);
  return { xp, coins, rewardPoints, perfect };
}

// localStorage helpers
const LS_LISTS_KEY = 'spellQuest.lists.v1';
const LS_LAST_PROFILE = 'spellQuest.lastProfile';

function loadLists() {
  try {
    const raw = localStorage.getItem(LS_LISTS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) { /* ignore */ }
  return [];
}

function saveLists(lists) {
  try { localStorage.setItem(LS_LISTS_KEY, JSON.stringify(lists)); } catch (e) {}
}

function uid() {
  return 'list_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

// Expose on window for other modules (scripts load into same global scope via Babel).
window.SpellQuestConfig = {
  ASSETS, MUSIC, SFX, KEEPER_LINES,
  DEFAULT_LISTS, MAX_WORDS_PER_TEST, SECONDS_PER_WORD, MAX_TTS_REPLAYS,
  ENCOURAGE_OK, ENCOURAGE_MISS,
  computeRewards, loadLists, saveLists, uid,
};
