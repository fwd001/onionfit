// ClothingMatchingEngine：为每个槽位从目录挑候选衣物（确定性排序）
// 简化而非枚举全部组合：每槽取评分最佳的若干件，再组合成一套（≤480 的裁剪不必要）

import type { ClothingItem, DemandVector } from '../types'
import { CATALOG } from '../catalog'
import type { LayerSlot } from './layering'

export interface MatchCandidate {
  slot: LayerSlot
  items: ClothingItem[] // 每个槽位排名靠前的候选
}

/** 匹配候选：base 槽位考虑上下装搭配 */
export function matchCandidates(demand: DemandVector, slots: LayerSlot[]): ClothingItem[][] {
  return slots.map((slot) => pickForSlot(slot, demand))
}

/** 为单槽位挑选候选衣物（确定性，最多 4 件） */
function pickForSlot(slot: LayerSlot, demand: DemandVector): ClothingItem[] {
  // 按 role + 品类分池：上装/下装/外层各自排序，保证上下装都有候选
  const pool = CATALOG.filter((it) => it.role === slot.role && it.category === slot.category)
  // 槽位属性过滤
  const filtered = pool.filter((it) => {
    if (it.insulationClo < slot.minClo) return false
    if (slot.needWater && (it.water < 0.85)) return false
    if (slot.needWind && (it.wind < 0.6)) return false
    if (slot.needSolar && (it.solar < 0.8)) return false
    return true
  })
  const rated = filtered
    .map((it) => ({ it, score: fitScore(it, slot, demand) }))
    .sort((a, b) => b.score - a.score)
  return rated.slice(0, 4).map((r) => r.it)
}

/** 拟合评分：clo 接近槽位目标最佳、重量轻、透气匹配、可脱卸加分 */
function fitScore(it: ClothingItem, slot: LayerSlot, demand: DemandVector): number {
  let score = 0
  if (slot.role === 'INSULATION') {
    // 目标 = 槽位 minClo 上浮一点，接近者得分高
    const target = slot.minClo + 0.1
    score += 30 - Math.min(30, Math.abs(it.insulationClo - target) * 40)
  } else if (slot.role === 'BASE') {
    // 贴身层按冷暖季调权重：热天透气主导（凉爽），冷天 clo 就近主导（保暖）
    const breathFactor = 0.4 + (demand.BREATHABILITY / 100) * 0.6 // 冷季 0.4，热季 1.0
    score += it.breathability * 20 * breathFactor
    // 贴身层只承担全身保暖的小份额（其余由保暖/防护层补）：
    // 上装 0.05→0.35 clo、下装 0.04→0.30 clo 随保暖需求线性
    const target =
      slot.category === 'BOTTOM'
        ? 0.04 + (demand.WARMTH / 100) * 0.26
        : 0.05 + (demand.WARMTH / 100) * 0.3
    const match = Math.max(0, 12 - Math.abs(target - it.insulationClo) * 40)
    score += match * (0.6 + demand.WARMTH / 100) // 冷季最高 1.6 倍
  } else {
    // 防护：防水/防风按需求侧重点
    if (slot.needWater) score += it.water * 30
    if (slot.needWind) score += it.wind * 25
    if (slot.needSolar) score += it.solar * 35
    score += it.breathability * 10
  }
  // 通用项
  score += (1 - it.weightGrams / 1500) * 15 // 轻量化
  if (it.removable) score += demand.REMOVABLE * 0.15 // 可脱卸需求加分
  if (it.comfortRangeC[0] <= demand.WARMTH * 0.8) score += 5 // 落在舒适区间
  return Math.round(score * 10) / 10
}