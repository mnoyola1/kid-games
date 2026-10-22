/**
 * STUDY SETS
 * Spelling lists and flashcard decks built from Emma's and Liam's Google Classroom
 * by the homework job on the family PC (table `study_sets`, read-only here).
 * Load after shared/supabase-config.js. The last good copy is kept in localStorage
 * so Spell Quest and Flash Quest still have the lists offline.
 *
 *   StudySets.load({ kind: 'spelling' })            -> [{ id, kid, kind, name, subject, test_date, data }]
 *   StudySets.load({ kind: 'deck', kid: 'emma' })
 */
(function (global) {
  const CACHE_KEY = 'studySets.cache.v1';

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || []; } catch (e) { return []; }
  }

  function filter(sets, { kind, kid }) {
    return sets.filter((s) => (!kind || s.kind === kind) && (!kid || s.kid === kid));
  }

  async function load(opts = {}) {
    const cfg = global.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return filter(readCache(), opts);
    try {
      const res = await fetch(
        `${cfg.url}/rest/v1/study_sets?select=id,kid,kind,name,subject,test_date,data,updated_at&order=test_date.desc.nullslast,updated_at.desc`,
        { headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` } },
      );
      if (!res.ok) throw new Error(`study_sets ${res.status}`);
      const sets = await res.json();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(sets)); } catch (e) {}
      return filter(sets, opts);
    } catch (e) {
      console.warn('[StudySets] using cached copy:', e.message);
      return filter(readCache(), opts);
    }
  }

  global.StudySets = { load, cached: (opts = {}) => filter(readCache(), opts) };
})(typeof window !== 'undefined' ? window : globalThis);
