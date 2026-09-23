// 天气 → 背景调色（9 组渐变 × 昼夜，对应 requirements 5.3）
// 返回 CSS 渐变字符串

import type { WeatherKind } from '@/core/types'

export interface Palette {
  /** 竖向渐变（3 段） */
  gradient: string
  /** 光晕色 */
  glow: string
}

const PALETTES: Record<WeatherKind, { day: [string, string, string]; night: [string, string, string] }> = {
  clear: {
    day: ['#2E5BFF', '#6BA3FF', '#A8D2FF'],
    night: ['#0B1B4A', '#1C2E6B', '#3E5C9E'],
  },
  cloudy: {
    day: ['#334A6E', '#5B7596', '#93A9BF'],
    night: ['#1B2537', '#2E3C52', '#4A5D75'],
  },
  rain: {
    day: ['#1F3A54', '#33566E', '#5E7E93'],
    night: ['#0E1F2E', '#1A3042', '#33506B'],
  },
  snow: {
    day: ['#4A6B8A', '#7E9BB4', '#C5D8E6'],
    night: ['#22344A', '#3A5066', '#61788C'],
  },
  thunder: {
    day: ['#26223B', '#45375C', '#6E5370'],
    night: ['#140F24', '#2A1F3D', '#4A3360'],
  },
  fog: {
    day: ['#4A4E57', '#6E737C', '#9CA1AA'],
    night: ['#23252B', '#3A3D44', '#585C64'],
  },
}

/** 兜底：晴 */
const FALLBACK = 'clear'

export function paletteFor(kind: WeatherKind, isDay: boolean): Palette {
  const entry = PALETTES[kind] ?? PALETTES[FALLBACK]
  const [c1, c2, c3] = isDay ? entry.day : entry.night
  return {
    gradient: `linear-gradient(180deg, ${c1} 0%, ${c2} 52%, ${c3} 100%)`,
    glow: c2,
  }
}