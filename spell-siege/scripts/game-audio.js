    // ==================== AUDIO MANAGER ====================
    class AudioManager {
      constructor() {
        this.musicPlayers = {};
        this.currentMusic = null;
        this.musicVolume = 0.4;
        this.sfxVolume = 0.6;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.toneStarted = false;
        this.musicPreloaded = false;
        this.synths = {};
      }
      
      async initTone() {
        if (this.toneStarted) return;
        try {
          await Tone.start();
          this.toneStarted = true;
          
          // Create synths for different sounds
          this.synths.spell = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.2 }
          }).toDestination();
          
          this.synths.hit = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
          }).toDestination();
          
          this.synths.damage = new Tone.MetalSynth({
            frequency: 150,
            envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
            harmonicity: 3.1,
            modulationIndex: 16,
            resonance: 2000,
            octaves: 1.5
          }).toDestination();
          
          this.synths.combo = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 }
          }).toDestination();
          
        } catch (e) {
          console.warn('Tone.js init failed:', e);
        }
      }
      
      preloadMusic() {
        // Only preload once to avoid duplicate audio players
        if (this.musicPreloaded) return;
        this.musicPreloaded = true;
        
        Object.entries(MUSIC_TRACKS).forEach(([key, filename]) => {
          const audio = new Audio(MUSIC_BASE_URL + filename);
          audio.preload = 'auto';
          audio.loop = !['victory', 'gameover'].includes(key);
          audio.volume = this.musicVolume;
          this.musicPlayers[key] = audio;
        });
      }
      
      playMusic(track) {
        if (!this.musicEnabled) return;
        
        // Stop current music
        if (this.currentMusic && this.musicPlayers[this.currentMusic]) {
          this.musicPlayers[this.currentMusic].pause();
          this.musicPlayers[this.currentMusic].currentTime = 0;
        }
        
        // Play new track
        if (this.musicPlayers[track]) {
          this.musicPlayers[track].currentTime = 0;
          this.musicPlayers[track].volume = this.musicVolume;
          this.musicPlayers[track].play().catch(() => {});
          this.currentMusic = track;
        }
      }
      
      stopMusic() {
        if (this.currentMusic && this.musicPlayers[this.currentMusic]) {
          this.musicPlayers[this.currentMusic].pause();
          this.musicPlayers[this.currentMusic].currentTime = 0;
        }
        this.currentMusic = null;
      }
      
      pauseMusic() {
        if (this.currentMusic && this.musicPlayers[this.currentMusic]) {
          this.musicPlayers[this.currentMusic].pause();
        }
      }
      
      resumeMusic() {
        if (this.musicEnabled && this.currentMusic && this.musicPlayers[this.currentMusic]) {
          this.musicPlayers[this.currentMusic].play().catch(() => {});
        }
      }
      
      setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
          this.pauseMusic();
        } else if (this.currentMusic) {
          this.resumeMusic();
        }
      }
      
      setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
      }
      
      playSpellCast() {
        if (!this.sfxEnabled || !this.toneStarted) return;
        try {
          this.synths.spell.triggerAttackRelease('C5', '8n', undefined, this.sfxVolume);
          setTimeout(() => {
            this.synths.spell.triggerAttackRelease('E5', '16n', undefined, this.sfxVolume * 0.7);
          }, 50);
        } catch (e) {}
      }
      
      playEnemyDefeat() {
        if (!this.sfxEnabled || !this.toneStarted) return;
        try {
          this.synths.hit.triggerAttackRelease('C2', '8n', undefined, this.sfxVolume);
        } catch (e) {}
      }
      
      playCastleDamage() {
        if (!this.sfxEnabled || !this.toneStarted) return;
        try {
          this.synths.damage.triggerAttackRelease('C2', '8n', undefined, this.sfxVolume * 0.5);
        } catch (e) {}
      }
      
      playCombo(comboCount) {
        if (!this.sfxEnabled || !this.toneStarted) return;
        try {
          const notes = ['C4', 'E4', 'G4', 'C5'];
          const note = notes[Math.min(Math.floor(comboCount / 5) - 1, notes.length - 1)];
          this.synths.combo.triggerAttackRelease([note, notes[Math.min(notes.indexOf(note) + 2, 3)]], '8n', undefined, this.sfxVolume * 0.7);
        } catch (e) {}
      }
      
      playBossSpawn() {
        if (!this.sfxEnabled || !this.toneStarted) return;
        try {
          this.synths.hit.triggerAttackRelease('E1', '2n', undefined, this.sfxVolume * 0.8);
        } catch (e) {}
      }
      
      playWaveComplete() {
        if (!this.sfxEnabled || !this.toneStarted) return;
        try {
          const notes = ['C4', 'E4', 'G4', 'C5'];
          notes.forEach((note, i) => {
            setTimeout(() => {
              this.synths.combo.triggerAttackRelease(note, '8n', undefined, this.sfxVolume);
            }, i * 100);
          });
        } catch (e) {}
      }
    }
    
