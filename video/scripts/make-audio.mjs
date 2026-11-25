// Synthesises the Story soundtrack: an original cheerful music loop + cartoon sound effects.
// No dependencies; writes 44.1 kHz 16-bit mono WAVs to public/audio/.
import fs from 'node:fs';
import path from 'node:path';

const SR = 44100;
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'public', 'audio');
fs.mkdirSync(OUT, { recursive: true });

// deterministic noise so re-runs produce identical files
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const tri = (p) => 1 - 4 * Math.abs(Math.round(p - 0.25) - (p - 0.25));
const sq = (p) => (p % 1 < 0.5 ? 1 : -1);

function writeWav(name, buf, gain = 1) {
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const norm = peak > 0 ? (0.89 * gain) / peak : 1;
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    const v = Math.tanh(buf[i] * norm * 1.1) / Math.tanh(1.1); // soft clip
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, name), Buffer.concat([h, data]));
  console.log('wrote', name, (buf.length / SR).toFixed(2) + 's');
}

/** Add a voice into buf: osc(phase) shaped by an attack/decay envelope. */
function note(buf, t0, dur, freq, amp, { wave = tri, attack = 0.005, decay = dur, glide = 0 } = {}) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  let ph = 0;
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / SR;
    const f = freq * (1 + glide * (t / dur));
    ph += f / SR;
    const env = Math.min(1, t / attack) * Math.exp(-t / (decay / 4)) * Math.min(1, (dur - t) / 0.01);
    buf[s0 + i] += wave(ph) * amp * env;
  }
}

function lowpass(buf, cutoff) {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < buf.length; i++) { y += a * (buf[i] - y); buf[i] = y; }
  return buf;
}

// ---------------- music ----------------
function music() {
  const BPM = 112, beat = 60 / BPM, bar = beat * 4;
  const len = 44;
  const mus = new Float32Array(Math.ceil(len * SR));
  const lead = new Float32Array(mus.length);
  // I – V – vi – IV in C major
  const chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  const roots = [36, 43, 45, 41];
  // 8-bar melody (beats, midi or null), C major pentatonic, bouncy
  const mel = [
    [72, 0.5], [74, 0.5], [76, 1], [79, 0.5], [76, 0.5], [74, 1],
    [74, 0.5], [76, 0.5], [79, 1], [81, 1], [79, 1],
    [76, 0.5], [74, 0.5], [72, 1], [74, 0.5], [76, 0.5], [72, 1],
    [72, 1], [69, 1], [72, 1.5], [null, 0.5],
    [79, 0.5], [81, 0.5], [79, 0.5], [76, 0.5], [79, 1], [76, 1],
    [74, 0.5], [76, 0.5], [74, 0.5], [72, 0.5], [74, 2],
    [76, 0.5], [79, 0.5], [81, 1], [84, 1], [81, 1],
    [79, 1], [76, 0.5], [74, 0.5], [72, 2],
  ];
  const bars = Math.ceil(len / bar);
  for (let b = 0; b < bars; b++) {
    const t = b * bar, c = b % 4;
    // bass: root on 1 and 3, fifth on the "and" of 4
    for (const [off, n] of [[0, roots[c]], [2, roots[c]], [3.5, roots[c] + 7]]) {
      note(mus, t + off * beat, beat * 0.9, midi(n), 0.5, { wave: (p) => Math.sin(2 * Math.PI * p) + 0.3 * Math.sin(4 * Math.PI * p), decay: beat * 1.6 });
    }
    // chord stabs on the off-beats
    for (const off of [0.5, 1.5, 2.5, 3.5]) {
      for (const n of chords[c]) note(mus, t + off * beat, beat * 0.45, midi(n), 0.13, { decay: beat * 0.5 });
    }
    // drums: kick on 1 & 3, hat on every 8th
    for (const off of [0, 2]) {
      const s0 = Math.floor((t + off * beat) * SR);
      for (let i = 0; i < SR * 0.18 && s0 + i < mus.length; i++) {
        const tt = i / SR;
        mus[s0 + i] += Math.sin(2 * Math.PI * (50 * tt + 90 * (1 - Math.exp(-tt * 30)) / 30)) * Math.exp(-tt * 18) * 0.7;
      }
    }
    for (let k = 0; k < 8; k++) {
      const s0 = Math.floor((t + k * beat * 0.5) * SR);
      let prev = 0;
      for (let i = 0; i < SR * 0.04 && s0 + i < mus.length; i++) {
        const w = rnd(); const hp = w - prev; prev = w;
        mus[s0 + i] += hp * Math.exp(-(i / SR) * 90) * (k % 2 ? 0.07 : 0.11);
      }
    }
  }
  // melody repeats every 8 bars; leave the first 2 bars for the intro
  let tm = bar * 2;
  while (tm < len - bar) {
    for (const [n, d] of mel) {
      if (n) note(lead, tm, d * beat * 0.95, midi(n), 0.22, { wave: (p) => 0.6 * sq(p) + 0.4 * tri(p), decay: d * beat * 1.4 });
      tm += d * beat;
      if (tm >= len - bar) break;
    }
  }
  lowpass(lead, 3200);
  for (let i = 0; i < mus.length; i++) mus[i] += lead[i];
  // fades
  for (let i = 0; i < mus.length; i++) {
    const t = i / SR;
    mus[i] *= Math.min(1, t / 1) * Math.min(1, (len - t) / 2);
  }
  writeWav('music.wav', mus, 0.9);
}

// ---------------- sound effects ----------------
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));

function sfx() {
  let b;
  b = buf(0.14); note(b, 0, 0.14, 500, 1, { wave: (p) => Math.sin(2 * Math.PI * p), glide: 1.6, decay: 0.12 }); writeWav('pop.wav', b, 0.8);

  b = buf(0.12);
  for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * (180 * t - 300 * t * t)) * Math.exp(-t * 45) + rnd() * 0.15 * Math.exp(-t * 120); }
  writeWav('tap.wav', b, 0.8);

  b = buf(0.05);
  for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * 2400 * t) * 0.6 + rnd() * 0.5) * Math.exp(-t * 220); }
  writeWav('click.wav', b, 0.7);

  b = buf(0.45);
  { // band-passed noise sweep: two one-pole filters with a moving cutoff
    let lp1 = 0, lp2 = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR, p = t / 0.45;
      const fc = 300 + 3500 * Math.sin(Math.PI * p);
      const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
      const w = rnd();
      lp1 += a * (w - lp1); lp2 += (a * 0.35) * (w - lp2);
      b[i] = (lp1 - lp2) * Math.sin(Math.PI * p) ** 2;
    }
  }
  writeWav('whoosh.wav', b, 0.7);

  b = buf(0.6);
  const bell = (p) => Math.sin(2 * Math.PI * p) + 0.3 * Math.sin(2 * Math.PI * p * 2.76);
  note(b, 0, 0.3, midi(88), 0.8, { wave: bell, decay: 0.35 });
  note(b, 0.11, 0.49, midi(93), 0.8, { wave: bell, decay: 0.5 });
  writeWav('ping.wav', b, 0.7);

  b = buf(0.45);
  note(b, 0, 0.08, midi(83), 0.5, { wave: sq, decay: 0.2 });
  note(b, 0.07, 0.38, midi(88), 0.5, { wave: sq, decay: 0.35 });
  lowpass(b, 6000);
  writeWav('coin.wav', b, 0.55);

  b = buf(0.9);
  { let lp = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; lp += 0.2 * (rnd() - lp); b[i] = lp * (0.5 + 0.5 * Math.sin(2 * Math.PI * 28 * t)) * Math.sin(Math.PI * t / 0.9); } }
  writeWav('moth.wav', b, 0.5);

  b = buf(0.8);
  note(b, 0, 0.8, midi(62), 1, { wave: (p) => tri(p) * 0.7 + Math.sin(2 * Math.PI * p) * 0.3, glide: -0.25, attack: 0.08, decay: 1.2 });
  lowpass(b, 1500);
  writeWav('sigh.wav', b, 0.6);

  b = buf(1.2);
  [72, 76, 79, 84].forEach((n, i) => note(b, i * 0.09, 1.2 - i * 0.09, midi(n), 0.5, { wave: (p) => 0.5 * sq(p) + 0.5 * tri(p), decay: 0.9 }));
  lowpass(b, 5000);
  writeWav('tada.wav', b, 0.7);
}

music();
sfx();
