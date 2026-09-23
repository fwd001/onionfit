// LayeringEngine：由需求向量决定"层结构与槽位"
// BASE 必有；保暖需求决定 1-2 个 INSULATION；雨/风/晒决定 PROTECTION

import { LAYERING } from '../config'
import type { DemandVector, LayerRole } from '../types'

export interface LayerSlot {
  role: LayerRole
  /** 槽位品类：上装/下装/外层（候选分池，保证上下装各有推荐） */
  category: 'TOP' | 'BOTTOM' | 'OUTER'
  /** 该槽位的目标 clo 下限（匹配引擎用来过滤） */
  minClo: number
  /** 是否要求防水壳（rain） */
  needWater: boolean
  /** 是否要求防风（wind） */
  needWind: boolean
  /** 是否要求遮阳 */
  needSolar: boolean
  /** 槽位产生原因 code（透出给文案） */
  reasonCodes: string[]
}

/**
 * 槽位决策（上下装分池，推荐永远含上衣+下装）：
 * - BASE × 2：上装 + 下装（必有）
 * - WARMTH > 12  → +1 INSULATION（上装）
 * - WARMTH > 45  → +1 INSULATION（第二件上装保暖）
 * - RAIN/WIND > 32 → +PROTECTION（防水/防风壳）
 * - SOLAR > 40 且无壳 → 遮阳外层（防晒衣）
 */
export function planLayerSlots(demand: DemandVector): LayerSlot[] {
  const slots: LayerSlot[] = [
    { role: 'BASE', category: 'TOP', minClo: 0.03, needWater: false, needWind: false, needSolar: false, reasonCodes: [] },
    { role: 'BASE', category: 'BOTTOM', minClo: 0.03, needWater: false, needWind: false, needSolar: false, reasonCodes: [] },
  ]

  const warmth = demand.WARMTH
  if (warmth > 12) {
    slots.push({
      role: 'INSULATION',
      category: 'TOP',
      minClo: middleLayerMin(warmth),
      needWater: false,
      needWind: false,
      needSolar: false,
      reasonCodes: [warmth > 45 ? 'NEED_TWO_LAYERS' : 'NEED_INSULATION'],
    })
  }
  if (warmth > 45) {
    slots.push({
      role: 'INSULATION',
      category: 'TOP',
      minClo: 0.28,
      needWater: false,
      needWind: false,
      needSolar: false,
      reasonCodes: ['NEED_SECOND_INSULATION'],
    })
  }

  // 防护层：雨/风
  const needShell = demand.RAIN > 32 || demand.WIND > 32
  if (needShell) {
    slots.push({
      role: 'PROTECTION',
      category: 'OUTER',
      minClo: 0,
      needWater: demand.RAIN > 32,
      needWind: true,
      needSolar: false,
      reasonCodes: [
        demand.RAIN > demand.WIND ? 'NEED_RAIN_SHELL' : 'NEED_WIND_SHELL',
      ],
    })
  }

  // 遮阳外层：暖热且有 UV 时（不影响寒冷层数判断）
  if (!needShell && demand.SOLAR > 40 && demand.WARMTH < 50) {
    slots.push({
      role: 'PROTECTION',
      category: 'OUTER',
      minClo: 0,
      needWater: false,
      needWind: false,
      needSolar: true,
      reasonCodes: ['NEED_SUN_SHELL'],
    })
  }

  // 截断到最大层数（上装+下装+双保暖+防护 = 5）
  return slots.slice(0, LAYERING.maxLayers)
}

function middleLayerMin(warmth: number): number {
  // 保暖需求越高，中层目标 clo 越高
  if (warmth <= 30) return 0.25
  if (warmth <= 55) return 0.42
  if (warmth <= 80) return 0.6
  return 0.8
}

/** 层的展示标签（presentation 也会用） */
export const ROLE_LABEL: Record<LayerRole, string> = {
  BASE: '贴身层',
  INSULATION: '保暖层',
  PROTECTION: '防护层',
}

/** 检查需求是否主要由雨/风驱动（决定文案口径） */
export function isShellDriven(demand: DemandVector): boolean {
  return demand.RAIN > 32 || demand.WIND > 32
}