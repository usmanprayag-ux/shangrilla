class KitchenAudioService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = false;

  public enable(): boolean {
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtxClass();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.soundEnabled = true;
      this.playTestChime();
      return true;
    } catch (e) {
      console.warn('AudioContext not allowed yet:', e);
      return false;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled && !!this.ctx;
  }

  /**
   * Plays a pleasant dual-tone brass bell alert for incoming kitchen orders.
   * Uses harmonic frequencies (880Hz A5 + 1320Hz E6) with gentle exponential decay.
   */
  public playOrderBell(): void {
    if (!this.soundEnabled || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Primary bell tone
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(860, now + 0.8);

      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 1.2);

      // High harmonic shimmer chime (after 120ms)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1310, now + 1.4);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(now + 0.12);
      osc2.stop(now + 1.5);
    } catch (err) {
      console.error('Failed to synthesize order bell chime:', err);
    }
  }

  public playTestChime(): void {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }
}

export const kitchenAudio = new KitchenAudioService();
