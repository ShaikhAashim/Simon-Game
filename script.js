class SimonSaysGame {
    constructor() {
        this.gameSequence = [];
        this.playerSequence = [];
        this.level = 0;
        this.isPlaying = false;
        this.isShowingSequence = false;
        this.currentScore = 0;
        this.highScore = this.getHighScore();
        
        this.colors = ['red', 'green', 'blue', 'yellow'];
        this.sounds = this.createSounds();
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    createSounds() {
        // Create audio context for better browser compatibility
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const createBeep = (frequency, type = 'sine') => {
            return () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = type;
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            };
        };
        
        return {
            red: createBeep(330),
            green: createBeep(262),
            blue: createBeep(220),
            yellow: createBeep(196),
            error: createBeep(150, 'sawtooth'),
            success: createBeep(523)
        };
    }
    
    initializeElements() {
        this.startBtn = document.getElementById('start-btn');
        this.gameStatus = document.getElementById('game-status');
        this.currentScoreElement = document.getElementById('current-score');
        this.highScoreElement = document.getElementById('high-score');
        this.colorButtons = document.querySelectorAll('.color-button');
        this.body = document.body;
    }
    
    bindEvents() {
        // Start button click
        this.startBtn.addEventListener('click', () => this.startGame());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isPlaying) {
                this.startGame();
            }
        });
        
        // Color button clicks
        this.colorButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (!this.isPlaying || this.isShowingSequence) return;
                this.handleColorClick(button.dataset.color);
            });
        });
        
        // Touch events for mobile
        this.colorButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.isPlaying || this.isShowingSequence) return;
                this.handleColorClick(button.dataset.color);
            });
        });
    }
    
    startGame() {
        this.resetGame();
        this.isPlaying = true;
        this.level = 0;
        this.currentScore = 0;
        this.gameSequence = [];
        this.playerSequence = [];
        
        this.startBtn.textContent = 'Playing...';
        this.startBtn.disabled = true;
        this.startBtn.classList.remove('btn-success');
        this.startBtn.classList.add('btn-warning');
        
        this.updateDisplay();
        this.nextLevel();
    }
    
    resetGame() {
        this.body.className = '';
        this.gameStatus.textContent = 'Get Ready...';
        this.enableColorButtons();
    }
    
    nextLevel() {
        this.level++;
        this.playerSequence = [];
        
        // Add new color to sequence
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.gameSequence.push(randomColor);
        
        this.updateDisplay();
        this.gameStatus.textContent = `Level ${this.level} - Watch the sequence!`;
        
        setTimeout(() => {
            this.showSequence();
        }, 1000);
    }
    
    async showSequence() {
        this.isShowingSequence = true;
        this.disableColorButtons();
        
        for (let i = 0; i < this.gameSequence.length; i++) {
            await this.delay(600);
            await this.flashColor(this.gameSequence[i]);
        }
        
        this.isShowingSequence = false;
        this.enableColorButtons();
        this.gameStatus.textContent = `Your turn! Click the sequence (${this.gameSequence.length} colors)`;
    }
    
    async flashColor(color) {
        const button = document.getElementById(color);
        
        // Play sound
        try {
            this.sounds[color]();
        } catch (error) {
            console.log('Audio not supported');
        }
        
        // Flash visual
        button.classList.add('active');
        
        await this.delay(400);
        
        button.classList.remove('active');
    }
    
    handleColorClick(color) {
        this.playerSequence.push(color);
        
        // Flash the clicked color
        this.flashColor(color);
        
        // Check if the click is correct
        const currentIndex = this.playerSequence.length - 1;
        
        if (this.playerSequence[currentIndex] !== this.gameSequence[currentIndex]) {
            this.gameOver();
            return;
        }
        
        // Check if sequence is complete
        if (this.playerSequence.length === this.gameSequence.length) {
            this.levelComplete();
        }
    }
    
    levelComplete() {
        this.currentScore = this.level;
        this.updateHighScore();
        
        // Flash success background
        this.body.classList.add('level-complete');
        setTimeout(() => {
            this.body.classList.remove('level-complete');
        }, 800);
        
        this.gameStatus.textContent = `Level ${this.level} Complete! Next level in 2 seconds...`;
        
        try {
            this.sounds.success();
        } catch (error) {
            console.log('Audio not supported');
        }
        
        setTimeout(() => {
            this.nextLevel();
        }, 2000);
    }
    
    gameOver() {
        this.isPlaying = false;
        this.updateHighScore();
        
        // Play error sound
        try {
            this.sounds.error();
        } catch (error) {
            console.log('Audio not supported');
        }
        
        // Flash error background
        this.body.classList.add('game-over');
        setTimeout(() => {
            this.body.classList.remove('game-over');
        }, 2000);
        
        this.gameStatus.textContent = `Game Over! Final Score: ${this.currentScore}`;
        
        // Reset start button
        this.startBtn.textContent = 'Start Game';
        this.startBtn.disabled = false;
        this.startBtn.classList.remove('btn-warning');
        this.startBtn.classList.add('btn-success');
        
        this.disableColorButtons();
        this.updateDisplay();
        
        // Show final score for longer
        setTimeout(() => {
            this.gameStatus.textContent = 'Press Start to Play Again!';
        }, 3000);
    }
    
    updateHighScore() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
            
            // Pulse animation for new high score
            this.highScoreElement.classList.add('pulse');
            setTimeout(() => {
                this.highScoreElement.classList.remove('pulse');
            }, 600);
        }
    }
    
    updateDisplay() {
        this.currentScoreElement.textContent = this.currentScore;
        this.highScoreElement.textContent = this.highScore;
    }
    
    enableColorButtons() {
        this.colorButtons.forEach(button => {
            button.classList.remove('disabled');
        });
    }
    
    disableColorButtons() {
        this.colorButtons.forEach(button => {
            button.classList.add('disabled');
        });
    }
    
    getHighScore() {
        return parseInt(localStorage.getItem('simonSaysHighScore') || '0');
    }
    
    saveHighScore() {
        localStorage.setItem('simonSaysHighScore', this.highScore.toString());
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new SimonSaysGame();
    
    // Handle audio context for mobile browsers
    document.addEventListener('touchstart', function() {
        // This will enable audio on mobile devices
    }, { once: true });
});

// Handle visibility change (when user switches tabs)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any ongoing sequences when tab becomes hidden
        console.log('Game paused - tab not visible');
    }
});

// Prevent zoom on mobile double-tap
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);