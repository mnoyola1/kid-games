/**
 * SUPABASE CONFIGURATION
 * Cloud sync for Noyola Hub cross-device data persistence
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a free Supabase account at https://supabase.com
 * 2. Create a new project
 * 3. Go to Settings > API
 * 4. Copy your Project URL and anon/public key
 * 5. Replace the values below
 * 
 * SECURITY NOTE:
 * The anon key is safe to expose in client-side code.
 * Row Level Security (RLS) protects your data.
 */

const SUPABASE_CONFIG = {
  // Noyola Hub Supabase Project
  url: 'https://hfxpanawthmegtbzhxlj.supabase.co',
  
  // Supabase anon/public key (legacy JWT format)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmeHBhbmF3dGhtZWd0YnpoeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTQ4MDYsImV4cCI6MjA4NDc5MDgwNn0.Ssal1HRpm1wGXiDE-IxIebdWRFww9Qod-rnk8YvFrd0',
  
  // Table name for player data
  tableName: 'player_profiles',
  
  // Cloud sync enabled
  enabled: true,
  
  // Sync settings
  syncOnLoad: true,
  syncOnSave: true,
  syncInterval: 30000, // Auto-sync every 30 seconds when online
  
  // Conflict resolution: 'cloud' or 'local' or 'newer'
  conflictResolution: 'newer',
};

// Check if Supabase is properly configured
function isSupabaseConfigured() {
  return SUPABASE_CONFIG.enabled && 
         SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' && 
         SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY';
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.isSupabaseConfigured = isSupabaseConfigured;
}
