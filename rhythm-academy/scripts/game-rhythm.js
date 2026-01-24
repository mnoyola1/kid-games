// ==================== RHYTHM ENGINE ====================
class RhythmEngine {
  constructor(difficulty, song, onNoteHit, onNoteMiss) {
    this.difficulty = difficulty;
    this.song = song;
    this.onNoteHit = onNoteHit;
    this.onNoteMiss = onNoteMiss;
    
    this.config = DIFFICULTY_LEVELS[difficulty];
    this.notes = [];
    this.activeNotes = [];
    this.startTime = null;
    this.currentTime = 0;
    this.isPlaying = false;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectHits = 0;
    this.goodHits = 0;
    this.misses = 0;
    
    // Generate note pattern
    this.generateNotePattern();
  }
  
  generateNotePattern() {
    // Generate notes based on song duration and BPM
    const bpm = this.song.bpm;
    const beatInterval = 60 / bpm; // seconds per beat
    const totalBeats = Math.floor(this.song.duration / beatInterval);
    const lanes = this.config.lanes;
    
    this.notes = [];
    
    // Generate notes at regular intervals with some randomness
    for (let i = 0; i < totalBeats; i++) {
      if (Math.random() > 0.3) { // 70% chance of note
        const lane = Math.floor(Math.random() * lanes);
        const time = i * beatInterval;
        
        // Determine question type
        let questionType = null;
        if (Math.random() > 0.5) {
          questionType = randomFrom(this.config.questionTypes);
        }
        
        this.notes.push({
          id: Date.now() + i,
          lane,
          time,
          questionType,
          question: null,
          hit: false,
          missed: false
        });
      }
    }
    
    // Sort by time
    this.notes.sort((a, b) => a.time - b.time);
  }
  
  start() {
    this.startTime = Date.now();
    this.isPlaying = true;
    this.currentTime = 0;
  }
  
  stop() {
    this.isPlaying = false;
  }
  
  update(deltaTime) {
    if (!this.isPlaying) return;
    
    this.currentTime += deltaTime;
    
    // Spawn new notes
    this.notes.forEach(note => {
      if (!note.hit && !note.missed && !this.activeNotes.find(n => n.id === note.id)) {
        const timeUntilHit = this.getTimeUntilHit(note.time);
        if (timeUntilHit <= 5 && timeUntilHit >= 0) {
          // Generate question if needed
          if (note.questionType) {
            note.question = generateQuestion(note.questionType, this.difficulty);
          }
          this.activeNotes.push({ ...note });
        }
      }
    });
    
    // Update active notes position
    this.activeNotes.forEach(note => {
      const timeUntilHit = this.getTimeUntilHit(note.time);
      note.y = this.calculateNoteY(timeUntilHit);
      
      // Check if note passed hit zone (missed)
      if (timeUntilHit < -this.config.goodWindow / 1000 && !note.hit && !note.missed) {
        this.missNote(note);
      }
    });
  }
  
  getTimeUntilHit(noteTime) {
    return noteTime - this.currentTime;
  }
  
  calculateNoteY(timeUntilHit) {
    // Hit zone is at bottom (100px from bottom)
    // Notes fall from top
    const hitZoneY = window.innerHeight - 100;
    const distanceToHit = timeUntilHit * this.config.noteSpeed;
    return hitZoneY - distanceToHit;
  }
  
  hitNote(lane, answer = null) {
    // Find closest note in this lane
    let closestNote = null;
    let closestDistance = Infinity;
    
    this.activeNotes.forEach(note => {
      if (note.lane === lane && !note.hit && !note.missed) {
        const timeUntilHit = this.getTimeUntilHit(note.time);
        const distance = Math.abs(timeUntilHit * 1000); // Convert to milliseconds
        
        if (distance < closestDistance && distance <= this.config.goodWindow) {
          closestDistance = distance;
          closestNote = note;
        }
      }
    });
    
    if (!closestNote) {
      return { hit: false, reason: 'no_note' };
    }
    
    // Check if question needs to be answered
    if (closestNote.question) {
      if (!answer) {
        return { hit: false, reason: 'needs_answer', note: closestNote };
      }
      
      // Check answer
      const correct = answer.toLowerCase() === closestNote.question.answer.toLowerCase();
      if (!correct) {
        this.missNote(closestNote);
        return { hit: false, reason: 'wrong_answer', note: closestNote };
      }
    }
    
    // Determine hit quality
    let hitType = 'miss';
    if (closestDistance <= this.config.perfectWindow) {
      hitType = 'perfect';
      this.perfectHits++;
      this.score += 100 * (this.combo + 1);
    } else if (closestDistance <= this.config.goodWindow) {
      hitType = 'good';
      this.goodHits++;
      this.score += 50 * (this.combo + 1);
    }
    
    if (hitType !== 'miss') {
      closestNote.hit = true;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      
      // Remove from active notes
      this.activeNotes = this.activeNotes.filter(n => n.id !== closestNote.id);
      
      // Mark in original notes array
      const originalNote = this.notes.find(n => n.id === closestNote.id);
      if (originalNote) originalNote.hit = true;
      
      if (this.onNoteHit) {
        this.onNoteHit(closestNote, hitType, lane);
      }
      
      return { hit: true, type: hitType, note: closestNote, score: this.score };
    }
    
    return { hit: false, reason: 'timing' };
  }
  
  missNote(note) {
    note.missed = true;
    this.combo = 0;
    this.misses++;
    
    // Remove from active notes
    this.activeNotes = this.activeNotes.filter(n => n.id !== note.id);
    
    // Mark in original notes array
    const originalNote = this.notes.find(n => n.id === note.id);
    if (originalNote) originalNote.missed = true;
    
    if (this.onNoteMiss) {
      this.onNoteMiss(note);
    }
  }
  
  getActiveNotes() {
    return this.activeNotes.filter(n => !n.hit && !n.missed);
  }
  
  getStats() {
    const totalNotes = this.notes.length;
    const hitNotes = this.perfectHits + this.goodHits;
    const accuracy = totalNotes > 0 ? (hitNotes / totalNotes) * 100 : 0;
    
    // Calculate stars (1-3)
    let stars = 1;
    if (accuracy >= 90 && this.perfectHits >= totalNotes * 0.7) stars = 3;
    else if (accuracy >= 70) stars = 2;
    
    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      perfectHits: this.perfectHits,
      goodHits: this.goodHits,
      misses: this.misses,
      accuracy: Math.round(accuracy),
      stars
    };
  }
  
  isComplete() {
    return this.currentTime >= this.song.duration;
  }
}
