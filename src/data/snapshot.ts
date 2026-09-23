// 应用快照持久化：localStorage 单 key JSON（对应 DataStore 单 JSON 快照决策）
// 解码失败 → 默认空快照（不崩、不残留脏数据）；新字段一律默认值，旧缓存可解码

import type { AppSnapshot } from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/types'

const SNAPSHOT_KEY = 'onionfit.app_state'

export const DEFAULT_CITY = {
  id: 'shanghai',
  name: '上海',
  lat: 31.2304,
  lon: 121.4737,
  country: '中国',
  admin1: '上海市',
} satisfies AppSnapshot['city']

export function defaultSnapshot(): AppSnapshot {
  return {
    city: DEFAULT_CITY,
    weather: null,
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: '',
  }
}

export function readSnapshot(): AppSnapshot {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return defaultSnapshot()
    const parsed = JSON.parse(raw) as Partial<AppSnapshot>
    const base = defaultSnapshot()
    return {
      city: { ...base.city, ...(parsed.city ?? {}) },
      weather: parsed.weather ?? null,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      updatedAt: parsed.updatedAt ?? '',
    }
  } catch {
    return defaultSnapshot()
  }
}

export function writeSnapshot(snapshot: AppSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // 存储满/隐私模式等场景静默失败，不影响本次会话
  }
}