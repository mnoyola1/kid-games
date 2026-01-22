    // ==================== SPEECH SYNTHESIS ====================
    const speakWord = (word) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }
    };
    
