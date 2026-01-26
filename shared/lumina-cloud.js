/**
 * LUMINA CLOUD - Supabase Integration Layer
 * Cross-device sync for Noyola Hub
 * 
 * Provides:
 * - Cloud storage with Supabase
 * - Offline fallback with localStorage
 * - Automatic sync when online
 * - Conflict resolution based on timestamps
 * - PIN-based profile lookup for new devices
 */

const LuminaCloud = (function() {
  'use strict';
  
  let _supabase = null;
  let _syncInterval = null;
  let _isOnline = navigator.onLine;
  let _lastSyncTime = null;
  let _pendingSync = false;
  
  // ==================== INITIALIZATION ====================
  
  /**
   * Initialize Supabase client
   * @returns {boolean} true if successfully initialized
   */
  function init() {
    if (!isSupabaseConfigured()) {
      console.log('☁️ LuminaCloud: Supabase not configured, running in offline mode');
      return false;
    }
    
    if (typeof supabase === 'undefined') {
      console.error('☁️ LuminaCloud: Supabase library not loaded');
      return false;
    }
    
    try {
      _supabase = supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey
      );
      
      // Set up online/offline listeners
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Start auto-sync if configured
      if (SUPABASE_CONFIG.syncInterval > 0) {
        startAutoSync();
      }
      
      console.log('☁️ LuminaCloud: Initialized successfully');
      return true;
    } catch (e) {
      console.error('☁️ LuminaCloud: Failed to initialize', e);
      return false;
    }
  }
  
  // ==================== SYNC OPERATIONS ====================
  
  /**
   * Sync local data to cloud
   * @param {Object} localData - The local lumina_game_data object
   * @returns {Promise<boolean>}
   */
  async function syncToCloud(localData) {
    if (!_supabase || !_isOnline) {
      console.log('☁️ LuminaCloud: Cannot sync - offline or not initialized');
      return false;
    }
    
    if (_pendingSync) {
      console.log('☁️ LuminaCloud: Sync already in progress');
      return false;
    }
    
    _pendingSync = true;
    
    try {
      // Sync each profile individually
      const profiles = localData.profiles;
      
      for (const [profileId, profile] of Object.entries(profiles)) {
        // Skip guest profile (no cloud storage for guests)
        if (profileId === 'guest') continue;
        
        const { error } = await _supabase
          .from(SUPABASE_CONFIG.tableName)
          .upsert({
            id: profileId,
            pin: profile.pin,
            data: {
              ...profile,
              resetAtVersion: localData.resetAtVersion || profile.resetAtVersion
            },
            family_quest: localData.familyQuest,
            settings: localData.settings,
            last_updated: localData.lastUpdated || new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (error) {
          console.error('☁️ LuminaCloud: Sync error for', profileId, error);
        }
      }
      
      _lastSyncTime = new Date();
      console.log('☁️ LuminaCloud: Synced to cloud at', _lastSyncTime.toLocaleTimeString());
      _pendingSync = false;
      return true;
      
    } catch (e) {
      console.error('☁️ LuminaCloud: Sync failed', e);
      _pendingSync = false;
      return false;
    }
  }
  
  /**
   * Fetch profile from cloud by profile ID
   * @param {string} profileId - The profile ID (emma, liam)
   * @returns {Promise<Object|null>}
   */
  async function fetchProfile(profileId) {
    if (!_supabase || !_isOnline) return null;
    
    try {
      const { data, error } = await _supabase
        .from(SUPABASE_CONFIG.tableName)
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not found is OK
          console.error('☁️ LuminaCloud: Fetch error', error);
        }
        return null;
      }
      
      console.log('☁️ LuminaCloud: Fetched profile', profileId, 'from cloud');
      return data;
    } catch (e) {
      console.error('☁️ LuminaCloud: Fetch failed', e);
      return null;
    }
  }
  
  /**
   * Fetch profile from cloud by PIN
   * Useful for logging in on a new device
   * @param {string} pin - The 4-digit PIN
   * @returns {Promise<Object|null>}
   */
  async function fetchProfileByPIN(pin) {
    if (!_supabase || !_isOnline) return null;
    
    try {
      const { data, error } = await _supabase
        .from(SUPABASE_CONFIG.tableName)
        .select('*')
        .eq('pin', pin)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('☁️ LuminaCloud: PIN lookup error', error);
        }
        return null;
      }
      
      console.log('☁️ LuminaCloud: Found profile via PIN');
      return data;
    } catch (e) {
      console.error('☁️ LuminaCloud: PIN lookup failed', e);
      return null;
    }
  }
  
  /**
   * Fetch all profiles from cloud
   * @returns {Promise<Array>}
   */
  async function fetchAllProfiles() {
    if (!_supabase || !_isOnline) return [];
    
    try {
      const { data, error } = await _supabase
        .from(SUPABASE_CONFIG.tableName)
        .select('*');
      
      if (error) {
        console.error('☁️ LuminaCloud: Fetch all error', error);
        return [];
      }
      
      console.log('☁️ LuminaCloud: Fetched', data.length, 'profiles from cloud');
      return data || [];
    } catch (e) {
      console.error('☁️ LuminaCloud: Fetch all failed', e);
      return [];
    }
  }
  
  /**
   * Merge cloud data with local data
   * @param {Object} localData - Local lumina_game_data
   * @param {Array} cloudProfiles - Array of cloud profile records
   * @returns {Object} Merged data
   */
  function mergeData(localData, cloudProfiles) {
    if (!cloudProfiles || cloudProfiles.length === 0) {
      return localData;
    }
    
    const merged = JSON.parse(JSON.stringify(localData)); // Deep clone
    
    for (const cloudRecord of cloudProfiles) {
      const profileId = cloudRecord.id;
      if (profileId === 'guest') continue;
      
      const cloudProfile = cloudRecord.data;
      const cloudUpdated = new Date(cloudRecord.last_updated);
      const localProfile = merged.profiles[profileId];
      
      if (!localProfile) {
        // Profile doesn't exist locally, use cloud version
        merged.profiles[profileId] = cloudProfile;
        console.log('☁️ LuminaCloud: Added cloud profile', profileId);
        continue;
      }
      
      const localUpdated = localProfile.lastPlayed 
        ? new Date(localProfile.lastPlayed) 
        : new Date(0);
      
      // If local data was reset in this version, keep it
      if (localData.resetAtVersion && cloudProfile?.resetAtVersion !== localData.resetAtVersion) {
        merged.profiles[profileId] = localProfile;
        console.log('☁️ LuminaCloud: Keeping local reset for', profileId);
        continue;
      }

      // Resolve conflicts based on configuration
      let useCloud = false;
      
      switch (SUPABASE_CONFIG.conflictResolution) {
        case 'cloud':
          useCloud = true;
          break;
        case 'local':
          useCloud = false;
          break;
        case 'newer':
        default:
          useCloud = cloudUpdated > localUpdated;
          break;
      }
      
      if (useCloud) {
        // Use cloud data but preserve any higher stats (best of both)
        merged.profiles[profileId] = mergeProfileStats(localProfile, cloudProfile);
        console.log('☁️ LuminaCloud: Merged profile', profileId, '(cloud was newer)');
      } else {
        // Keep local but merge in any higher cloud stats
        merged.profiles[profileId] = mergeProfileStats(cloudProfile, localProfile);
        console.log('☁️ LuminaCloud: Merged profile', profileId, '(local was newer)');
      }
      
      // Merge family quest (use newer)
      if (cloudRecord.family_quest) {
        const cloudQuestUpdated = cloudRecord.family_quest.startDate 
          ? new Date(cloudRecord.family_quest.startDate) 
          : new Date(0);
        const localQuestUpdated = merged.familyQuest.startDate 
          ? new Date(merged.familyQuest.startDate) 
          : new Date(0);
        
        if (cloudQuestUpdated > localQuestUpdated) {
          merged.familyQuest = cloudRecord.family_quest;
        }
      }
    }
    
    return merged;
  }
  
  /**
   * Merge two profiles, keeping the best stats from both
   * @param {Object} older - The older/lower priority profile
   * @param {Object} newer - The newer/higher priority profile
   * @returns {Object} Merged profile
   */
  function mergeProfileStats(older, newer) {
    const merged = JSON.parse(JSON.stringify(newer)); // Start with newer
    
    // Keep higher values for cumulative stats
    merged.totalXP = Math.max(older.totalXP || 0, newer.totalXP || 0);
    merged.lifetimeCoins = Math.max(older.lifetimeCoins || 0, newer.lifetimeCoins || 0);
    merged.rewardPoints = Math.max(older.rewardPoints || 0, newer.rewardPoints || 0);
    merged.streakDays = Math.max(older.streakDays || 0, newer.streakDays || 0);
    merged.totalPlayTimeMinutes = Math.max(older.totalPlayTimeMinutes || 0, newer.totalPlayTimeMinutes || 0);
    
    // Recalculate level based on merged XP
    if (typeof LuminaCore !== 'undefined') {
      const levelInfo = LuminaCore.calculateLevel(merged.totalXP);
      merged.level = levelInfo.level;
      merged.title = levelInfo.title;
    }
    
    // Merge achievements (union of both)
    const olderAchievements = older.achievements || [];
    const newerAchievements = newer.achievements || [];
    merged.achievements = [...new Set([...olderAchievements, ...newerAchievements])];
    
    // Merge game stats (keep best values)
    if (older.gameStats && newer.gameStats) {
      merged.gameStats = {};
      const allGameKeys = new Set([
        ...Object.keys(older.gameStats || {}),
        ...Object.keys(newer.gameStats || {})
      ]);
      
      for (const gameKey of allGameKeys) {
        const olderStats = older.gameStats[gameKey] || {};
        const newerStats = newer.gameStats[gameKey] || {};
        
        merged.gameStats[gameKey] = {
          highScore: Math.max(olderStats.highScore || 0, newerStats.highScore || 0),
          highWave: Math.max(olderStats.highWave || 0, newerStats.highWave || 0),
          gamesPlayed: Math.max(olderStats.gamesPlayed || 0, newerStats.gamesPlayed || 0),
          gamesWon: Math.max(olderStats.gamesWon || 0, newerStats.gamesWon || 0),
          wordsSpelled: Math.max(olderStats.wordsSpelled || 0, newerStats.wordsSpelled || 0),
          perfectWaves: Math.max(olderStats.perfectWaves || 0, newerStats.perfectWaves || 0),
          questionsCorrect: Math.max(olderStats.questionsCorrect || 0, newerStats.questionsCorrect || 0),
          maxCombo: Math.max(olderStats.maxCombo || 0, newerStats.maxCombo || 0),
          racesWon: Math.max(olderStats.racesWon || 0, newerStats.racesWon || 0),
          wordsTyped: Math.max(olderStats.wordsTyped || 0, newerStats.wordsTyped || 0),
          itemsCrafted: Math.max(olderStats.itemsCrafted || 0, newerStats.itemsCrafted || 0),
          // For bestTime, keep the lower (better) value if it exists
          bestTime: getBestTime(olderStats.bestTime, newerStats.bestTime),
        };
      }
    }
    
    return merged;
  }
  
  /**
   * Get the better (lower) time, handling nulls
   */
  function getBestTime(time1, time2) {
    if (!time1 && !time2) return null;
    if (!time1) return time2;
    if (!time2) return time1;
    return Math.min(time1, time2);
  }
  
  // ==================== FULL SYNC ====================
  
  /**
   * Perform a full sync - fetch from cloud, merge, save to both
   * @param {Object} localData - Current local data
   * @returns {Promise<Object>} The merged and synced data
   */
  async function fullSync(localData) {
    if (!_supabase || !_isOnline) {
      console.log('☁️ LuminaCloud: Cannot full sync - offline');
      return localData;
    }
    
    try {
      // Fetch all cloud profiles
      const cloudProfiles = await fetchAllProfiles();
      
      // Merge cloud with local
      const mergedData = mergeData(localData, cloudProfiles);
      
      // Sync merged data back to cloud
      await syncToCloud(mergedData);
      
      console.log('☁️ LuminaCloud: Full sync completed');
      return mergedData;
      
    } catch (e) {
      console.error('☁️ LuminaCloud: Full sync failed', e);
      return localData;
    }
  }
  
  // ==================== AUTO-SYNC ====================
  
  function startAutoSync() {
    if (_syncInterval) {
      clearInterval(_syncInterval);
    }
    
    _syncInterval = setInterval(async () => {
      if (_isOnline && typeof LuminaCore !== 'undefined') {
        const data = LuminaCore.getData();
        await syncToCloud(data);
      }
    }, SUPABASE_CONFIG.syncInterval);
    
    console.log('☁️ LuminaCloud: Auto-sync started (every', SUPABASE_CONFIG.syncInterval / 1000, 'seconds)');
  }
  
  function stopAutoSync() {
    if (_syncInterval) {
      clearInterval(_syncInterval);
      _syncInterval = null;
      console.log('☁️ LuminaCloud: Auto-sync stopped');
    }
  }
  
  // ==================== NETWORK HANDLERS ====================
  
  function handleOnline() {
    _isOnline = true;
    console.log('☁️ LuminaCloud: Back online');
    
    // Trigger sync when back online
    if (typeof LuminaCore !== 'undefined' && SUPABASE_CONFIG.syncOnLoad) {
      const data = LuminaCore.getData();
      syncToCloud(data);
    }
  }
  
  function handleOffline() {
    _isOnline = false;
    console.log('☁️ LuminaCloud: Went offline - using local storage');
  }
  
  // ==================== STATUS ====================
  
  function getStatus() {
    return {
      initialized: _supabase !== null,
      online: _isOnline,
      configured: isSupabaseConfigured(),
      lastSync: _lastSyncTime,
      autoSyncEnabled: _syncInterval !== null,
    };
  }
  
  function isOnline() {
    return _isOnline && _supabase !== null;
  }
  
  // ==================== PUBLIC API ====================
  
  return {
    init,
    syncToCloud,
    fetchProfile,
    fetchProfileByPIN,
    fetchAllProfiles,
    mergeData,
    fullSync,
    startAutoSync,
    stopAutoSync,
    getStatus,
    isOnline,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LuminaCloud;
}
