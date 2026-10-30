#!/usr/bin/env node
/**
 * 호러 테마파크 컷(SawHorror)의 효과음과 배경음을 직접 합성해
 * public/sfx/horror-*.wav 로 쓴다.
 *
 * 외부 음원이 없으니 저작권 문제가 없고, 시드 고정이라 매번 같은 소리가 난다.
 * 소리를 언제 낼지는 컴포지션(SawHorror.tsx)이 정한다 — 여기서는 소리만 만든다.
 *
 *   node scripts/make-horror-audio.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "sfx");
const RATE = 48000;
const TAU = Math.PI * 2;

/* ── 기본 부품 ─────────────────────────────────────────────── */

const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const stereo = (sec) => {
  const n = Math.round(sec * RATE);
  return [new Float64Array(n), new Float64Array(n)];
};

/** RBJ 바이쿼드. setFreq 로 주파수를 움직일 수 있다. */
const biquad = (type, freq, q = 0.707) => {
  let b0, b1, b2, a1, a2;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const set = (f) => {
    const w = (TAU * Math.min(f, RATE * 0.45)) / RATE;
    const c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
    let B0, B1, B2;
    if (type === "lp") { B0 = (1 - c) / 2; B1 = 1 - c; B2 = (1 - c) / 2; }
    else if (type === "hp") { B0 = (1 + c) / 2; B1 = -(1 + c); B2 = (1 + c) / 2; }
    else { B0 = al; B1 = 0; B2 = -al; } // bp, 피크 이득 0dB
    const a0 = 1 + al;
    b0 = B0 / a0; b1 = B1 / a0; b2 = B2 / a0; a1 = (-2 * c) / a0; a2 = (1 - al) / a0;
  };
  set(freq);
  const run = (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
  run.setFreq = set;
  return run;
};

/** Freeverb 축약판 — 콤 4개 + 올패스 2개, 좌우 지연을 어긋나게. */
const reverb = ([L, R], { mix = 0.3, room = 0.84, damp = 0.25, tail = 1.2 } = {}) => {
  const n = L.length + Math.round(tail * RATE);
  const out = [new Float64Array(n), new Float64Array(n)];
  const k = RATE / 44100;
  const combLens = [1557, 1617, 1491, 1422];
  const apLens = [556, 341];
  for (let ch = 0; ch < 2; ch += 1) {
    const spread = ch ? 23 : 0;
    const combs = combLens.map((l) => ({ buf: new Float64Array(Math.round((l + spread) * k)), i: 0, f: 0 }));
    const aps = apLens.map((l) => ({ buf: new Float64Array(Math.round((l + spread) * k)), i: 0 }));
    const src = ch ? R : L;
    for (let i = 0; i < n; i += 1) {
      const x = i < src.length ? (L[i] + R[i]) * 0.5 : 0;
      let wet = 0;
      for (const c of combs) {
        const y = c.buf[c.i];
        c.f = y * (1 - damp) + c.f * damp;
        c.buf[c.i] = x + c.f * room;
        c.i = (c.i + 1) % c.buf.length;
        wet += y;
      }
      wet *= 0.25;
      for (const a of aps) {
        const b = a.buf[a.i];
        const y = -wet + b;
        a.buf[a.i] = wet + b * 0.5;
        a.i = (a.i + 1) % a.buf.length;
        wet = y;
      }
      const dry = i < src.length ? src[i] : 0;
      out[ch][i] = dry * (1 - mix) + wet * mix;
    }
  }
  return out;
};

const mixInto = ([L, R], [l, r], at = 0, gain = 1) => {
  const o = Math.round(at * RATE);
  for (let i = 0; i < l.length && o + i < L.length; i += 1) {
    L[o + i] += l[i] * gain;
    R[o + i] += r[i] * gain;
  }
};

/** 정규화 + 꼬리 페이드 */
const finish = ([L, R], peakTo = 0.8, fadeSec = 0.04) => {
  let peak = 1e-9;
  for (let i = 0; i < L.length; i += 1) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peakTo / peak;
  const fade = Math.round(fadeSec * RATE);
  for (let i = 0; i < L.length; i += 1) {
    const t = i > L.length - fade ? (L.length - i) / fade : 1;
    L[i] *= g * t;
    R[i] *= g * t;
  }
  return [L, R];
};

const toWav = ([L, R]) => {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22); buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  const s = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
  for (let i = 0; i < n; i += 1) {
    buf.writeInt16LE(s(L[i]), 44 + i * 4);
    buf.writeInt16LE(s(R[i]), 46 + i * 4);
  }
  return buf;
};

/* ── 소리들 ───────────────────────────────────────────────── */

/** 톱질 한 번. push 는 밝게 올라가고, pull 은 어둡게 내려간다. */
const sawStroke = (push, seed) => {
  const rand = rng(seed);
  const dur = 0.34;
  const out = stereo(dur);
  const n = out[0].length;
  const bandL = biquad("bp", 2800, 1.3), bandR = biquad("bp", 2800, 1.3);
  const body = biquad("bp", 520, 3);
  const hiss = biquad("hp", 7000, 0.7);
  const tooth = push ? 112 : 96;
  let phase = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE, u = t / dur;
    if (i % 32 === 0) {
      const fc = push ? 2500 + 1000 * u : 3300 - 900 * u;
      bandL.setFreq(fc); bandR.setFreq(fc * 1.04);
    }
    // 톱니가 걸렸다 풀리는 떨림 — 하강 톱니파로 진폭을 깎는다
    phase += (tooth * (1 + (rand() - 0.5) * 0.08)) / RATE;
    const chatter = 1 - 0.72 * (phase % 1);
    const env = Math.min(1, t / 0.025) * Math.min(1, (dur - t) / 0.09) * Math.pow(Math.sin(Math.PI * u), 0.5);
    const nz = rand() * 2 - 1, nz2 = rand() * 2 - 1;
    const b = body(nz) * 0.5;
    const h = hiss(nz2) * 0.12;
    out[0][i] = env * (bandL(nz) * chatter + b + h);
    out[1][i] = env * (bandR(nz2) * chatter + b + h * 0.8);
  }
  return finish(out);
};

/** 피 튀는 소리 — 둔탁한 퍽 + 젖은 노이즈 + 방울 몇 개 */
const splat = () => {
  const rand = rng(77);
  const out = stereo(0.6);
  const n = out[0].length;
  const wetLp = biquad("lp", 1800), wetBp = biquad("bp", 700, 0.9);
  let ph = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE;
    ph += (45 + 45 * Math.exp(-t / 0.05)) / RATE;
    const thump = Math.sin(TAU * ph) * Math.exp(-t / 0.08);
    const wet = (wetLp(rand() * 2 - 1) + wetBp(rand() * 2 - 1)) * Math.min(1, t / 0.002) * Math.exp(-t / 0.06);
    out[0][i] = thump * 0.9 + wet;
    out[1][i] = thump * 0.9 + wet * 0.9;
  }
  for (let k = 0; k < 7; k += 1) {
    const at = 0.04 + rand() * 0.26;
    const bp = biquad("bp", 1400 + rand() * 1800, 4);
    const pan = rand();
    const len = Math.round(0.05 * RATE), o = Math.round(at * RATE);
    for (let i = 0; i < len && o + i < n; i += 1) {
      const v = bp(rand() * 2 - 1) * Math.exp(-(i / RATE) / 0.012) * 0.7;
      out[0][o + i] += v * (1 - pan);
      out[1][o + i] += v * pan;
    }
  }
  return finish(reverb(out, { mix: 0.14, room: 0.7, tail: 0.4 }));
};

/** 컷 전환 붐 — 서브 + 노이즈 + 쇳소리 */
const boom = () => {
  const rand = rng(91);
  const out = stereo(1.4);
  const n = out[0].length;
  const lp = biquad("lp", 900);
  const clang = [[180, 0.5, 0.5], [431, 0.35, 0.35], [677, 0.25, 0.25], [1043, 0.16, 0.18], [1490, 0.1, 0.14]];
  let ph = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE;
    ph += (34 + 24 * Math.exp(-t / 0.25)) / RATE;
    let v = Math.sin(TAU * ph) * Math.exp(-t / 0.55) * 1.1;
    v += lp(rand() * 2 - 1) * Math.exp(-t / 0.12) * 0.8;
    let m = 0;
    for (const [f, a, tau] of clang) m += a * Math.sin(TAU * f * t) * Math.exp(-t / tau);
    out[0][i] = v + m * 0.45;
    out[1][i] = v + m * 0.4;
  }
  return finish(reverb(out, { mix: 0.32, room: 0.88, tail: 1.2 }));
};

/** 네온 지지직 — 끊기는 웅웅 + 튀는 잡음 */
const zap = (seed) => {
  const rand = rng(seed);
  const out = stereo(0.3);
  const n = out[0].length;
  const hp = biquad("hp", 3000);
  let gate = 1, next = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE;
    if (i >= next) { gate = rand() < 0.6 ? 1 : 0; next = i + Math.round((0.012 + rand() * 0.03) * RATE); }
    let hum = 0;
    for (let h = 1; h <= 9; h += 2) hum += Math.sin(TAU * 120 * h * t) / h;
    const crack = rand() < 0.015 ? hp(rand() * 2 - 1) * 4 : hp(0);
    const env = Math.min(1, (0.3 - t) / 0.05);
    out[0][i] = (hum * 0.5 * gate + crack) * env;
    out[1][i] = (hum * 0.5 * gate + crack * 0.8) * env;
  }
  return finish(out);
};

/** 네온 웅웅거림 — 켜져 있는 동안 아래에 깔린다 */
const buzz = () => {
  const rand = rng(5);
  const out = stereo(3.4);
  const n = out[0].length;
  const lp = biquad("lp", 1200);
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE;
    let hum = 0;
    for (let h = 1; h <= 11; h += 2) hum += Math.sin(TAU * 120 * h * t) / (h * h * 0.6);
    hum += 0.3 * Math.sin(TAU * 240 * t);
    const wob = 0.85 + 0.15 * Math.sin(TAU * 0.6 * t);
    const v = lp(hum) * wob + (rand() < 0.002 ? (rand() - 0.5) * 0.6 : 0);
    out[0][i] = v;
    out[1][i] = v * 0.95;
  }
  return finish(out, 0.8, 0.15);
};

/** 긴장 상승음 — 필터가 열리며 차오르다 툭 끊긴다 */
const riser = () => {
  const rand = rng(13);
  const dur = 0.85;
  const out = stereo(dur);
  const n = out[0].length;
  const fL = biquad("lp", 300, 2), fR = biquad("lp", 300, 2);
  let ph = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE, u = t / dur;
    if (i % 32 === 0) { const fc = 300 * Math.pow(22, u); fL.setFreq(fc); fR.setFreq(fc * 1.05); }
    ph += (190 * Math.pow(4, u)) / RATE;
    const env = Math.pow(u, 2.2);
    const whine = Math.sin(TAU * ph) * 0.25;
    out[0][i] = env * (fL(rand() * 2 - 1) + whine);
    out[1][i] = env * (fR(rand() * 2 - 1) + whine);
  }
  return finish(out, 0.8, 0.005);
};

/** 호러 스팅어 — 단2도로 부딪히는 현 뭉치 + 서브 */
const stinger = () => {
  const out = stereo(1.6);
  const n = out[0].length;
  const notes = [220.0, 233.08, 329.63, 349.23, 440.0, 466.16];
  const fL = biquad("lp", 5000, 0.9), fR = biquad("lp", 5000, 0.9);
  const phs = notes.map(() => [0, 0]);
  let sub = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE;
    if (i % 32 === 0) { const fc = 1100 + 4000 * Math.exp(-t / 0.18); fL.setFreq(fc); fR.setFreq(fc); }
    let l = 0, r = 0;
    notes.forEach((f, k) => {
      phs[k][0] = (phs[k][0] + (f * 0.998) / RATE) % 1;
      phs[k][1] = (phs[k][1] + (f * 1.003) / RATE) % 1;
      l += 2 * phs[k][0] - 1;
      r += 2 * phs[k][1] - 1;
    });
    const env = Math.min(1, t / 0.006) * Math.exp(-t / 0.7);
    sub += (40 + 30 * Math.exp(-t / 0.1)) / RATE;
    const s = Math.sin(TAU * sub) * Math.exp(-t / 0.5);
    out[0][i] = fL(l / notes.length) * env + s * 0.7;
    out[1][i] = fR(r / notes.length) * env + s * 0.7;
  }
  return finish(reverb(out, { mix: 0.3, room: 0.86, tail: 1.0 }));
};

/**
 * 배경음 5초 — 불협 드론 위로 오르골.
 * 마지막 음들은 태엽이 풀리듯 느려지고 음이 처진다. 4초 스팅어 직전에 멈춘다.
 */
const bgm = () => {
  const out = stereo(5.0);
  const n = out[0].length;
  const lp = biquad("lp", 420, 0.8);
  for (let i = 0; i < n; i += 1) {
    const t = i / RATE;
    // A1 과 Bb1 — 반음으로 부딪혀 계속 울렁거린다.
    // 휴대폰 스피커는 100Hz 아래가 거의 안 나와서 A3/Bb3 로도 같은 불협을 얹는다.
    const d = Math.sin(TAU * 55 * t) + Math.sin(TAU * 58.27 * t) + 0.4 * Math.sin(TAU * 110 * t);
    const hi = Math.sin(TAU * 220 * t) + Math.sin(TAU * 233.08 * t);
    const env = Math.min(1, t / 0.6) * (0.75 + 0.25 * Math.sin(TAU * 0.4 * t));
    // 드론은 바닥에 깔고, 주인공은 오르골
    const v = (lp(d) * 0.22 + hi * 0.05) * env;
    out[0][i] += v;
    out[1][i] += v;
  }

  const box = stereo(5.0);
  const A5 = 880, C6 = 1046.5, E6 = 1318.51, Ds6 = 1244.51, B5 = 987.77, Gs5 = 830.61;
  const melody = [
    [0.15, A5], [0.51, C6], [0.87, E6], [1.23, Ds6], [1.59, E6], [1.95, B5],
    [2.31, C6], [2.67, A5], [3.05, Gs5 * 0.985], [3.5, A5 * 0.965],
  ];
  const partials = [[1, 1, 1], [2, 0.35, 0.5], [3.9, 0.1, 0.25], [5.4, 0.05, 0.15]];
  melody.forEach(([at, f], k) => {
    const o = Math.round(at * RATE);
    const len = Math.round(1.1 * RATE);
    const pan = 0.5 + (k % 2 ? 0.15 : -0.15);
    for (let i = 0; i < len && o + i < n; i += 1) {
      const t = i / RATE;
      let v = 0;
      for (const [m, a, dk] of partials) v += a * Math.sin(TAU * f * m * t) * Math.exp(-t / (0.55 * dk));
      v *= Math.min(1, t / 0.002) * 0.28;
      box[0][o + i] += v * (1 - pan);
      box[1][o + i] += v * pan;
    }
  });
  const wet = reverb(box, { mix: 0.42, room: 0.86, tail: 0 });
  mixInto(out, wet);
  return finish(out, 0.8, 0.3);
};

/* ── 쓰기 ─────────────────────────────────────────────────── */

const SOUNDS = {
  "horror-saw-push": () => sawStroke(true, 201),
  "horror-saw-pull": () => sawStroke(false, 202),
  "horror-splat": splat,
  "horror-boom": boom,
  "horror-zap-a": () => zap(301),
  "horror-zap-b": () => zap(302),
  "horror-buzz": buzz,
  "horror-riser": riser,
  "horror-stinger": stinger,
  "horror-bgm": bgm,
};

await mkdir(OUT, { recursive: true });
for (const [name, make] of Object.entries(SOUNDS)) {
  await writeFile(join(OUT, `${name}.wav`), toWav(make()));
}
console.log(`호러 사운드 ${Object.keys(SOUNDS).length}개 생성 → public/sfx/horror-*.wav`);
