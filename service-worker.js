/**
 * NOYOLA HUB - Service Worker
 * Enables offline play and auto-updates
 * 
 * Features:
 * - Caches all game assets for offline use
 * - Network-first for Supabase (sync when online)
 * - Cache-first for game files (fast offline loading)
 * - Auto-updates when new version is deployed
 */

const CACHE_VERSION = 'v1.9.2';
const CACHE_NAME = `noyola-games-${CACHE_VERSION}`;
const DEV_BYPASS_CACHE = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Critical files that MUST be cached for offline play
const CRITICAL_ASSETS = [
  // Root
  '/',
  '/index.html',
  '/manifest.json',
  
  // Shared Core Scripts
  '/shared/lumina-core.js',
  '/shared/lumina-cloud.js',
  '/shared/supabase-config.js',
  
  // Shared Hub Scripts
  '/shared/scripts/hub-config.js',
  '/shared/scripts/hub-theme.js',
  '/shared/scripts/hub-ui.js',
  '/shared/scripts/hub-games.js',
  '/shared/scripts/hub-modals.js',
  '/shared/scripts/hub-tutorial.js',
  '/shared/scripts/hub-init.js',
  
  // Shared Hub Styles
  '/shared/styles/hub-themes.css',
  '/shared/styles/hub-base.css',
  '/shared/styles/hub-animations.css',
  '/shared/styles/hub-layout.css',
  '/shared/styles/hub-components.css',
  
  // Profile Images
  '/assets/emma_profile.png',
  '/assets/liam_profile.png',
  '/assets/guest-avatar.svg',
  '/assets/mario_step_profile.png',
  '/assets/adriana_terra_profile.png',
  '/assets/noyola_hub_animated.mp4',
  
  // === SPELL SIEGE ===
  '/spell-siege/index.html',
  '/spell-siege/styles/game-base.css',
  '/spell-siege/scripts/game-config.js',
  '/spell-siege/scripts/game-audio.js',
  '/spell-siege/scripts/game-speech.js',
  '/spell-siege/scripts/game-main.js',
  '/spell-siege/scripts/game-init.js',
  
  // === CANADA ADVENTURE ===
  '/canada-adventure/index.html',
  '/canada-adventure/styles/game-base.css',
  '/canada-adventure/scripts/game-data.js',
  '/canada-adventure/scripts/game-sprites.js',
  '/canada-adventure/scripts/game-components.js',
  '/canada-adventure/scripts/game-audio.js',
  '/canada-adventure/scripts/game-main.js',
  '/canada-adventure/scripts/game-init.js',

  // === DRAGON SCROLLS OF CHINA ===
  '/china-adventure/index.html',
  '/china-adventure/styles/game-base.css',
  '/china-adventure/scripts/game-data.js',
  '/china-adventure/scripts/game-sprites.js',
  '/china-adventure/scripts/game-components.js',
  '/china-adventure/scripts/game-audio.js',
  '/china-adventure/scripts/game-main.js',
  '/china-adventure/scripts/game-init.js',
  
  // === LUMINA RACER ===
  '/lumina-racer/index.html',
  '/lumina-racer/styles/game-base.css',
  '/lumina-racer/scripts/game-config.js',
  '/lumina-racer/scripts/game-speech.js',
  '/lumina-racer/scripts/game-main.js',
  '/lumina-racer/scripts/game-init.js',
  '/lumina-racer/scripts/game-audio.js',
  
  // === WORD FORGE ===
  '/word-forge/index.html',
  '/word-forge/styles/game-base.css',
  '/word-forge/scripts/game-config.js',
  '/word-forge/scripts/game-components.js',
  '/word-forge/scripts/game-main.js',
  '/word-forge/scripts/game-init.js',
  '/word-forge/scripts/game-audio.js',
  
  // === MATH QUEST ===
  '/math-quest/index.html',
  '/math-quest/styles/game-base.css',
  '/math-quest/scripts/game-config.js',
  '/math-quest/scripts/game-audio.js',
  '/math-quest/scripts/game-juice.js',
  '/math-quest/scripts/game-main.js',
  '/math-quest/scripts/game-init.js',
  
  // === PIXEL QUEST ===
  '/pixel-quest/index.html',
  '/pixel-quest/styles/game-base.css',
  '/pixel-quest/scripts/game-config.js',
  '/pixel-quest/scripts/game-audio.js',
  '/pixel-quest/scripts/game-juice.js',
  '/pixel-quest/scripts/game-physics.js',
  '/pixel-quest/scripts/game-main.js',
  '/pixel-quest/scripts/game-init.js',
  
  // === RHYTHM ACADEMY ===
  '/rhythm-academy/index.html',
  '/rhythm-academy/styles/game-base.css',
  '/rhythm-academy/scripts/game-config.js',
  '/rhythm-academy/scripts/game-audio.js',
  '/rhythm-academy/scripts/game-juice.js',
  '/rhythm-academy/scripts/game-rhythm.js',
  '/rhythm-academy/scripts/game-main.js',
  '/rhythm-academy/scripts/game-init.js',
  
  // === PIANO PATH ===
  '/piano-path/index.html',
  '/piano-path/styles/game-base.css',
  '/piano-path/scripts/game-config.js',
  '/piano-path/scripts/game-audio.js',
  '/piano-path/scripts/game-main.js',
  '/piano-path/scripts/game-init.js',
  
  // === SHADOWS IN THE HALLS ===
  '/shadows-in-the-halls/index.html',
  '/shadows-in-the-halls/styles/game-base.css',
  '/shadows-in-the-halls/scripts/game-config.js',
  '/shadows-in-the-halls/scripts/game-audio.js',
  '/shadows-in-the-halls/scripts/game-components.js',
  '/shadows-in-the-halls/scripts/game-main.js',
  '/shadows-in-the-halls/scripts/game-init.js',

  // === 99 NIGHTS IN SPACE ===
  '/99-nights-in-space/index.html',
  '/99-nights-in-space/styles/game-base.css',
  '/99-nights-in-space/scripts/game-config.js',
  '/99-nights-in-space/scripts/game-main.js',
  '/99-nights-in-space/scripts/game-init.js',

  // === SPELL QUEST ===
  '/spell-quest/index.html',
  '/spell-quest/styles/game-base.css',
  '/spell-quest/scripts/game-config.js',
  '/spell-quest/scripts/game-audio.js',
  '/spell-quest/scripts/game-tts.js',
  '/spell-quest/scripts/game-api.js',
  '/spell-quest/scripts/game-canvas.js',
  '/spell-quest/scripts/game-main.js',
  '/spell-quest/scripts/game-init.js',
  '/assets/spell-quest/logo_nobg.png',
  '/assets/spell-quest/grimoire_frame_nobg.png',
  '/assets/spell-quest/rune_medallion_nobg.png',
  '/assets/spell-quest/keeper_portrait_nobg.png',
  '/assets/spell-quest/victory_crest_nobg.png',
  '/assets/backgrounds/spell-quest/bg_main.png',
  '/assets/backgrounds/spell-quest/bg_menu.png',
  '/assets/backgrounds/spell-quest/bg_results_scroll.png',
];

// Audio files (cached on-demand to avoid long initial load)
const AUDIO_PREFIXES = [
  '/assets/audio/spell-siege/',
  '/assets/audio/lumina-racer/',
  '/assets/audio/math-quest/',
  '/assets/audio/pixel-quest/',
  '/assets/audio/rhythm-academy/',
  '/assets/audio/piano-path/',
  '/assets/audio/crypto-quest/',
  '/assets/audio/word-hunt/',
  '/assets/audio/shadows-in-the-halls/',
  '/assets/audio/canada-adventure/',
  '/assets/audio/china-adventure/',
  '/assets/audio/spell-quest/',
];

// Image/sprite files (cached on-demand)
const ASSET_PREFIXES = [
  '/assets/sprites/',
  '/assets/backgrounds/',
  '/assets/models/',
  '/assets/textures/',
];

/**
 * Install Event: Cache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

/**
 * Activate Event: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker: Activating v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions
              return cacheName.startsWith('noyola-games-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event: Serve from cache or network
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Dev mode: skip caching on localhost for instant updates
  if (DEV_BYPASS_CACHE) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // === Spell Quest API routing ===
  // /api/tts: stable per (voice, text). Stale-while-revalidate caches the MP3
  //          so replays during a test and across sessions are instant.
  // /api/extract-words & /api/grade-spelling: NEVER cache — each request is unique.
  if (url.pathname === '/api/tts') {
    event.respondWith(
      caches.open(`${CACHE_NAME}-tts`).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request)
          .then((res) => {
            if (res && res.status === 200) cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    // Always go to network; never serve stale results from grading / extraction.
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for Supabase (always try to sync when online)
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline, return cached version (if available)
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Network-first for external resources (fonts, CDN scripts)
  if (url.hostname.includes('googleapis') || 
      url.hostname.includes('gstatic') || 
      url.hostname.includes('jsdelivr')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // === Network-first for the app shell ===
  // HTML, JS, CSS (and explicit versioned requests like ?v=16) change on
  // every deploy, so we MUST hit the network when online — otherwise users
  // see stale UI until they hard-refresh (Ctrl+Shift+R). The cache is still
  // populated on success so offline play continues to work.
  const isAppShell =
    url.pathname === '/' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');

  if (isAppShell || url.search) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Cache by pathname (no query) so `?v=N` and bare requests
              // share an offline fallback entry.
              const cacheKey = url.search
                ? new Request(url.origin + url.pathname)
                : event.request;
              cache.put(cacheKey, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: fall back to whatever's in cache (exact match first,
          // then by pathname so versioned requests still resolve).
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (url.search) return caches.match(url.pathname);
            // Final fallback for HTML navigations: the hub shell.
            if (url.pathname.endsWith('.html') || url.pathname === '/') {
              return caches.match('/index.html');
            }
            return new Response('', { status: 504, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  // Cache-first for static game assets (sprites, audio, fonts, images) —
  // these are large and stable, so cache wins for performance + offline.
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetchAndCache(event.request, url);
      })
  );
});

function fetchAndCache(request, url) {
  return fetch(request)
    .then((response) => {
      // Don't cache invalid responses
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      // Check if this is an audio/image file we should cache
      const shouldCache =
        AUDIO_PREFIXES.some(prefix => url.pathname.startsWith(prefix)) ||
        ASSET_PREFIXES.some(prefix => url.pathname.startsWith(prefix)) ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.html');

      if (shouldCache) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
      }

      return response;
    })
    .catch((error) => {
      console.error('❌ Service Worker: Fetch failed', url.pathname, error);

      // Fallback for HTML pages
      if (url.pathname.endsWith('.html') || url.pathname === '/') {
        return caches.match('/index.html');
      }

      // Fallback for versioned asset requests (strip query)
      if (url.search) {
        return caches.match(url.pathname);
      }

      // Final fallback: return an empty 504 response instead of throwing
      return new Response('', { status: 504, statusText: 'Offline' });
    });
}

/**
 * Message Event: Handle commands from main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_AUDIO') {
    // Preload audio files
    const audioUrl = event.data.url;
    caches.open(CACHE_NAME).then((cache) => {
      cache.add(audioUrl);
    });
  }
});

console.log('🚀 Service Worker: Loaded v' + CACHE_VERSION);
