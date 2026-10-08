#!/usr/bin/env node
/**
 * 별빛 효과음을 직접 합성해 public/sfx/ 에 WAV로 쓴다.
 *
 * 외부 음원을 쓰지 않으니 저작권 문제가 없고, 시드를 고정해서 매번 같은 소리가
 * 나온다. 유리종처럼 맑은 배음에 아주 짧은 고음 반짝임을 얹었다.
 *
 * 순서대로 음이 펜타토닉으로 한 칸씩 올라간다 — 항목이 하나씩 쌓일수록
 * 기대감이 같이 올라가게. 제목은 낮은 2화음으로 시작을 연다.
 *
 *   node scripts/make-sfx.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "sfx");

const RATE = 48000;
/** 좌우 어긋남. 모노에서 맥놀이가 안 들릴 만큼만. */
const DETUNE = 1.0005;

/** 0 = 제목, 1~7 = STEP1, 2, 3, 1~2일차, 7~14일차, 1개월차, 3~6개월차 */
const NOTES = [
  { freqs: [523.25, 783.99], dur: 1.4, tau: 0.6, gain: 0.8 }, // C5 + G5
  { freqs: [783.99], dur: 0.9, tau: 0.36 }, // G5
  { freqs: [880.0], dur: 0.9, tau: 0.36 }, // A5
  { freqs: [1046.5], dur: 0.9, tau: 0.34 }, // C6
  { freqs: [1174.66], dur: 0.9, tau: 0.34 }, // D6
  { freqs: [1318.51], dur: 0.9, tau: 0.32 }, // E6
  { freqs: [1567.98], dur: 0.9, tau: 0.3 }, // G6
  { freqs: [1760.0], dur: 1.1, tau: 0.42 }, // A6 — 마지막은 조금 길게 남긴다
];

/** 배음 [배수, 세기, 감쇠 배율]. 높은 배음일수록 빨리 사라져야 종소리가 된다. */
const PARTIALS = [
  [1.0, 1.0, 1.0],
  [2.0, 0.22, 0.6],
  [3.01, 0.07, 0.4],
  [4.2, 0.03, 0.25],
];

/** 시드 고정 난수 (mulberry32) */
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const synth = (note, seed) => {
  const rand = rng(seed);
  const n = Math.round(note.dur * RATE);
  const L = new Float64Array(n);
  const R = new Float64Array(n);
  const attack = 0.004 * RATE;

  // 본음 — 오른쪽 채널을 아주 살짝 어긋나게 해서 폭을 만든다.
  // 너무 어긋나면 휴대폰 스피커처럼 모노로 합칠 때 맥놀이가 생겨 여운이
  // 출렁인다(0.18%에서 A6 기준 초당 3회). 여운 동안 한 번도 안 돌 만큼만.
  for (const f0 of note.freqs) {
    for (const [mul, amp, decay] of PARTIALS) {
      const tau = note.tau * decay;
      for (let i = 0; i < n; i += 1) {
        const t = i / RATE;
        const env = (i < attack ? i / attack : 1) * Math.exp(-t / tau);
        L[i] += amp * env * Math.sin(2 * Math.PI * f0 * mul * t);
        R[i] += amp * env * Math.sin(2 * Math.PI * f0 * mul * DETUNE * t);
      }
    }
  }

  // 반짝임 — 앞부분 120ms 안에 아주 짧은 고음 몇 개
  for (let k = 0; k < 6; k += 1) {
    const start = Math.round(rand() * 0.12 * RATE);
    const f = 5200 + rand() * 3200;
    const pan = rand();
    const amp = 0.035 + rand() * 0.025;
    const len = Math.round(0.09 * RATE);
    for (let i = 0; i < len && start + i < n; i += 1) {
      const t = i / RATE;
      const v = amp * Math.exp(-t / 0.018) * Math.sin(2 * Math.PI * f * t);
      L[start + i] += v * (1 - pan);
      R[start + i] += v * pan;
    }
  }

  // 정규화 후 꼬리를 30ms 페이드 — 끝에서 툭 끊기는 소리를 막는다.
  let peak = 0;
  for (let i = 0; i < n; i += 1) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = (0.5 * (note.gain ?? 1)) / peak;
  const fade = Math.round(0.03 * RATE);
  for (let i = 0; i < n; i += 1) {
    const tail = i > n - fade ? (n - i) / fade : 1;
    L[i] *= g * tail;
    R[i] *= g * tail;
  }
  return [L, R];
};

const toWav = ([L, R]) => {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // 스테레오
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i += 1) {
    const s = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
    buf.writeInt16LE(s(L[i]), 44 + i * 4);
    buf.writeInt16LE(s(R[i]), 46 + i * 4);
  }
  return buf;
};

await mkdir(OUT, { recursive: true });
for (const [i, note] of NOTES.entries()) {
  const file = join(OUT, `star-${i}.wav`);
  await writeFile(file, toWav(synth(note, 1000 + i)));
}
console.log(`효과음 ${NOTES.length}개 생성 → public/sfx/star-0..${NOTES.length - 1}.wav`);
