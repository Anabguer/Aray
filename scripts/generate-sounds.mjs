/**
 * Genera WAVs cortos (mono 22.05 kHz) para feedback de juego.
 * Sin dependencias externas — tonos sintetizados y ligeros.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../public/sounds')
const SAMPLE_RATE = 22050

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE((s * 32767) | 0, 44 + i * 2)
  }
  fs.writeFileSync(filePath, buffer)
}

function envelope(t, dur, attack = 0.01, release = 0.06) {
  if (t < attack) return t / attack
  if (t > dur - release) return Math.max(0, (dur - t) / release)
  return 1
}

function tone(freq, dur, { type = 'sine', gain = 0.35, attack, release } = {}) {
  const n = Math.floor(SAMPLE_RATE * dur)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE
    const phase = 2 * Math.PI * freq * t
    let v = 0
    if (type === 'sine') v = Math.sin(phase)
    else if (type === 'triangle') {
      const p = (t * freq) % 1
      v = 1 - 4 * Math.abs(p - 0.5)
    } else if (type === 'square') v = Math.sin(phase) > 0 ? 0.55 : -0.55
    out[i] = v * gain * envelope(t, dur, attack, release)
  }
  return out
}

function slide(f0, f1, dur, { gain = 0.32 } = {}) {
  const n = Math.floor(SAMPLE_RATE * dur)
  const out = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE
    const f = f0 + (f1 - f0) * (t / dur)
    phase += (2 * Math.PI * f) / SAMPLE_RATE
    out[i] = Math.sin(phase) * gain * envelope(t, dur, 0.008, 0.08)
  }
  return out
}

function concat(...parts) {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Float32Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function silence(sec) {
  return new Float32Array(Math.floor(SAMPLE_RATE * sec))
}

function mix(parts) {
  const len = Math.max(...parts.map((p) => p.length))
  const out = new Float32Array(len)
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) out[i] += p[i]
  }
  let peak = 0
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]))
  if (peak > 0.95) {
    const s = 0.95 / peak
    for (let i = 0; i < len; i++) out[i] *= s
  }
  return out
}

fs.mkdirSync(outDir, { recursive: true })

const sounds = {
  'ui-click': tone(880, 0.045, { type: 'sine', gain: 0.22, attack: 0.003, release: 0.03 }),
  'activity-open': concat(
    tone(392, 0.09, { gain: 0.22 }),
    silence(0.02),
    tone(523, 0.12, { gain: 0.26 }),
  ),
  'answer-correct': concat(
    tone(660, 0.08, { gain: 0.28 }),
    silence(0.015),
    tone(880, 0.1, { gain: 0.3 }),
  ),
  'answer-wrong': tone(240, 0.11, { type: 'triangle', gain: 0.14, attack: 0.01, release: 0.07 }),
  'points-earned': slide(880, 1175, 0.16, { gain: 0.28 }),
  'activity-complete': mix([
    tone(523, 0.18, { gain: 0.22 }),
    concat(silence(0.06), tone(659, 0.18, { gain: 0.24 })),
    concat(silence(0.12), tone(784, 0.22, { gain: 0.26 })),
  ]),
  'perfect-complete': mix([
    tone(523, 0.2, { gain: 0.2 }),
    concat(silence(0.05), tone(659, 0.2, { gain: 0.22 })),
    concat(silence(0.1), tone(784, 0.22, { gain: 0.24 })),
    concat(silence(0.16), tone(1046, 0.28, { gain: 0.28 })),
  ]),
}

for (const [name, samples] of Object.entries(sounds)) {
  const file = path.join(outDir, `${name}.wav`)
  writeWav(file, samples)
  const kb = (fs.statSync(file).size / 1024).toFixed(1)
  console.log(`${name}.wav  ${kb} KB`)
}

console.log(`OK → ${outDir}`)
