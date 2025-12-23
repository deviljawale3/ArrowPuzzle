class AudioService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext() {
    if (!this.ctx) {
      // @ts-ignore - Handle webkit prefix for older browsers
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playClick() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }

  playSpin() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 2.5);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 3.0);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.0);
      
      osc.start();
      osc.stop(ctx.currentTime + 3.0);
    } catch (e) {}
  }

  playMove() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playCollision() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playWin() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      
      const playNote = (freq: number, time: number, duration: number, type: OscillatorType = 'sine') => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.12, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
          osc.start(time);
          osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      // Bright C-Major arpeggio + high C finish
      playNote(523.25, now, 0.4, 'triangle');       // C5
      playNote(659.25, now + 0.1, 0.4, 'triangle'); // E5
      playNote(783.99, now + 0.2, 0.4, 'triangle'); // G5
      playNote(1046.50, now + 0.35, 0.8, 'sine');   // C6
      
      // Secondary harmony
      playNote(261.63, now, 0.5, 'sine');           // C4 base
      playNote(329.63, now + 0.1, 0.5, 'sine');     // E4 base
    } catch (e) {}
  }
}

export const audioService = new AudioService();