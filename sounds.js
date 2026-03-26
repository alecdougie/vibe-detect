// Retro 80's command center sound effects using Web Audio API
// All sounds generated procedurally — no audio files needed

const SoundEngine = (() => {
  let ctx = null;
  let muted = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function isMuted() {
    return muted;
  }

  function setMuted(val) {
    muted = val;
  }

  // ── Utility: play a tone with envelope ────────────────
  function playTone(freq, type, duration, volume = 0.15, delay = 0) {
    if (muted) return;
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ac.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ac.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration);
  }

  // ── Utility: noise burst ──────────────────────────────
  function playNoise(duration, volume = 0.05, delay = 0) {
    if (muted) return;
    const ac = getCtx();
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ac.createBufferSource();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();

    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    gain.gain.setValueAtTime(0, ac.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ac.currentTime + delay + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    source.start(ac.currentTime + delay);
    source.stop(ac.currentTime + delay + duration);
  }

  // ── 1. SCANNING: radar sweep / data acquisition ───────
  // Low hum + ascending blips that repeat
  function scanning() {
    if (muted) return;

    // Base hum
    playTone(80, "sawtooth", 0.6, 0.03);

    // Ascending blip sequence
    const notes = [440, 520, 600, 700, 800, 920];
    notes.forEach((freq, i) => {
      playTone(freq, "square", 0.06, 0.04, i * 0.08);
    });

    // Static burst at end
    playNoise(0.15, 0.02, 0.5);
  }

  // ── 2. RESULTS: data decoded / transmission received ──
  // Descending confirmation tone + satisfying lock-on
  function results() {
    if (muted) return;

    // Three-tone confirmation chime (high to resolved)
    playTone(880, "square", 0.12, 0.05, 0);
    playTone(660, "square", 0.12, 0.05, 0.13);
    playTone(990, "square", 0.25, 0.06, 0.26);

    // Underlying resonance
    playTone(220, "triangle", 0.5, 0.03, 0.26);

    // Data lock noise
    playNoise(0.08, 0.015, 0.15);
  }

  // ── 3. BUTTON CLICK: tactile keypress ─────────────────
  // Short percussive blip like pressing a console button
  function click() {
    if (muted) return;

    playTone(600, "square", 0.04, 0.1);
    playTone(800, "square", 0.03, 0.06, 0.02);
    playNoise(0.03, 0.03);
  }

  // ── 4. ALERT: vibe code detected warning ──────────────
  // Descending dissonant tones — something's wrong
  function alert() {
    if (muted) return;

    // Two harsh descending tones
    playTone(880, "sawtooth", 0.15, 0.06, 0);
    playTone(440, "sawtooth", 0.2, 0.07, 0.15);

    // Dissonant low buzz
    playTone(185, "square", 0.3, 0.04, 0.35);

    // Static crackle
    playNoise(0.12, 0.03, 0.2);
  }

  // ── 5. DEEP SCAN COMPLETE: triumphant multi-tone ────────
  // Extended confirmation — multi-page analysis finished
  function deepComplete() {
    if (muted) return;

    // Rising triumphant sequence
    playTone(440, "square", 0.1, 0.04, 0);
    playTone(550, "square", 0.1, 0.04, 0.1);
    playTone(660, "square", 0.1, 0.05, 0.2);
    playTone(880, "square", 0.3, 0.06, 0.3);

    // Resonance chord
    playTone(220, "triangle", 0.6, 0.03, 0.3);
    playTone(330, "triangle", 0.5, 0.02, 0.35);

    // Data lock
    playNoise(0.1, 0.02, 0.4);
  }

  return { scanning, results, click, alert, deepComplete, isMuted, setMuted };
})();
