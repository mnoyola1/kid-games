# Noyola Kids Games 🎮

Educational games for Emma & Liam!

## Quick Deploy to Vercel

### Step 1: Create GitHub Repo

```bash
# Go to github.com/new and create "kids-games" repo (public)
# Clone it locally:
git clone https://github.com/mnoyola1/kids-games.git
cd kids-games
```

### Step 2: Add Files

Your folder structure should be:
```
kids-games/
├── index.html          (landing page)
├── manifest.json       (PWA support)
├── README.md           (this file)
└── spell-siege/
    └── index.html      (the game)
```

Copy the files I provided into this structure.

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Initial commit - Spell Siege game"
git push origin main
```

### Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import `mnoyola1/kids-games` from GitHub
4. Click "Deploy" (no settings needed!)
5. Done! You'll get a URL like `kids-games.vercel.app`

### Custom Domain (Optional)

In Vercel dashboard → Settings → Domains, you can add a custom domain.

---

## Music Integration

The game loads music from your `game-assets` repo:
```
https://cdn.jsdelivr.net/gh/mnoyola1/game-assets@main/spell-siege/audio/music/
```

Make sure your `game-assets` repo is public and has these files:
- `Main Menu Theme.wav`
- `Gameplay - Early Waves 1-3.wav`
- `Gameplay - Mid Waves 4-7.wav`
- `Gameplay - Final Waves.wav`
- `Boss Encounter.wav`
- `Victory Fanfare.wav`
- `Game Over.wav`

---

## Features

### Spell Siege 🏰
- Tower defense meets spelling practice
- Two difficulty modes (Emma & Liam)
- Custom word list support (paste weekly spelling words!)
- Text-to-speech pronunciation
- Upgrade system (spell power, shields, repairs)
- 10 waves with boss battles
- Epic music from Lyria 2

---

Made with ❤️ for Emma & Liam
