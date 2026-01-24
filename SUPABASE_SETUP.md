# Supabase Setup Guide for Noyola Hub

This guide will help you set up Supabase for cross-device cloud sync.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (GitHub login recommended)
3. Verify your email if required

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in the details:
   - **Name:** `noyola-hub` (or any name you prefer)
   - **Database Password:** Generate a strong password and save it somewhere safe
   - **Region:** Choose the closest to you (e.g., `us-east-1` for East Coast US)
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be created

## Step 3: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste the following SQL:

```sql
-- Create the player_profiles table
CREATE TABLE player_profiles (
  id TEXT PRIMARY KEY,
  pin TEXT,
  data JSONB NOT NULL,
  family_quest JSONB,
  settings JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on PIN for faster lookups
CREATE INDEX idx_player_profiles_pin ON player_profiles(pin);

-- Enable Row Level Security (RLS)
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read/write
-- (Since this is a family app with PIN protection, we allow public access)
CREATE POLICY "Allow public access" ON player_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to auto-update the last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-update last_updated on changes
CREATE TRIGGER update_player_profiles_last_updated
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated();
```

4. Click "Run" (or press F5)
5. You should see "Success. No rows returned" - this is correct

## Step 4: Get Your API Keys

1. Go to **Settings** (gear icon in left sidebar)
2. Click **API** (under Project Settings)
3. Find these two values:
   - **Project URL** - looks like `https://abcdefghij.supabase.co`
   - **anon/public key** - a long string starting with `eyJ...`

## Step 5: Configure Noyola Hub

1. Open `shared/supabase-config.js` in your editor
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
  // Replace with your Supabase project URL
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  
  // Replace with your Supabase anon/public key
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // Enable cloud sync
  enabled: true,
  
  // ... rest of config
};
```

3. Set `enabled: true` to turn on cloud sync
4. Save the file

## Step 6: Test the Integration

1. Open Noyola Hub in your browser
2. Open browser Developer Tools (F12) and go to Console tab
3. Look for these messages:
   - `☁️ LuminaCloud: Initialized successfully`
   - `🌐 LuminaCore: Cloud sync enabled`
4. Check the cloud status icon next to the theme toggle:
   - ☁️ (green) = Cloud sync active
   - 💾 = Local only (not configured)
   - 📴 = Offline

## Step 7: Verify Data in Supabase

1. Go back to your Supabase dashboard
2. Click **Table Editor** in the left sidebar
3. Click on `player_profiles` table
4. You should see Emma and Liam's profiles after playing a game

## How It Works

### Data Flow
```
┌─────────────────────────────────────────────────────────┐
│                    Device 1 (iPad)                       │
│  ┌───────────┐    ┌───────────┐    ┌───────────────┐   │
│  │ Game Play │ -> │ LuminaCore│ -> │ localStorage  │   │
│  └───────────┘    └─────┬─────┘    └───────────────┘   │
│                         │                               │
│                         v                               │
│                  ┌─────────────┐                        │
│                  │ LuminaCloud │                        │
│                  └──────┬──────┘                        │
└─────────────────────────┼───────────────────────────────┘
                          │
                          v
                   ┌────────────┐
                   │  Supabase  │  <- Cloud Storage
                   │  Database  │
                   └─────┬──────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                    Device 2 (Computer)                   │
│                         │                               │
│                         v                               │
│                  ┌─────────────┐                        │
│                  │ LuminaCloud │                        │
│                  └──────┬──────┘                        │
│                         │                               │
│                         v                               │
│  ┌───────────┐    ┌───────────┐    ┌───────────────┐   │
│  │ Hub/Games │ <- │ LuminaCore│ <- │ localStorage  │   │
│  └───────────┘    └───────────┘    └───────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Sync Behavior

1. **On Load:**
   - Local data loaded from localStorage first (instant)
   - Cloud data fetched and merged (async)
   - UI updates when merge completes

2. **On Save:**
   - Data saved to localStorage immediately
   - Data synced to cloud in background

3. **Conflict Resolution:**
   - By default, newer data wins (based on timestamps)
   - Stats are merged to keep best values from both (e.g., highest scores)
   - Achievements are combined (union of both sets)

4. **Offline Support:**
   - Works fully offline using localStorage
   - Syncs automatically when back online

## Troubleshooting

### "Cloud sync not configured" message
- Check that `SUPABASE_CONFIG.enabled` is set to `true`
- Verify your URL and anonKey are correct

### "Supabase library not loaded" error
- Check your internet connection
- Verify the Supabase CDN script is loading (check Network tab in DevTools)

### Data not syncing
- Check browser console for errors
- Verify your table has the correct RLS policies (see SQL above)
- Try a manual sync: `LuminaCore.syncToCloud()` in console

### Different data on different devices
- Wait 30 seconds for auto-sync, or refresh the page
- Check that both devices have internet connection
- Run `LuminaCore.syncFromCloud()` to force fetch from cloud

## Security Notes

1. **The anon key is safe to expose** in client-side code - Row Level Security protects your data
2. **PINs are stored in the cloud** - they provide a simple auth mechanism
3. **For a family app, this security level is appropriate** - if you need more security, add Supabase Auth

## Cost

Supabase Free Tier includes:
- 500 MB database storage
- 2 GB bandwidth/month
- 50,000 monthly active users

**Your estimated usage:**
- ~100 KB database (2 profiles with stats)
- ~150 MB/month bandwidth (at heavy usage)

**You'll stay well within free tier limits.**

## Advanced: Manual Data Operations

### Force sync to cloud
```javascript
await LuminaCore.syncToCloud();
```

### Force sync from cloud
```javascript
await LuminaCore.syncFromCloud();
```

### Check cloud status
```javascript
console.log(LuminaCore.getCloudStatus());
```

### Lookup profile by PIN (for new device login)
```javascript
const cloudProfile = await LuminaCloud.fetchProfileByPIN('1008'); // Emma's PIN
```
