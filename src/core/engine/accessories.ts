// AccessoriesEngine：配饰与携带建议（阈值触发，确定性）

import type { Accessory, AccessoryKind, DemandVector } from '../types'
import type { WeatherContext } from './weather'
import type { PersonProfile } from './person'

export function accessoriesOf(
  ctx: WeatherContext,
  demand: DemandVector,
  person: PersonProfile,
): Accessory[] {
  const list: Accessory[] = []
  const push = (kind: AccessoryKind, label: string, reason?: string) =>
    list.push({ kind, label, reasonCode: reason })

  // 伞
  if (demand.RAIN > 25 && ctx.windMaxMs < 12) {
    push('UMBRELLA', '雨伞', 'rain')
  }
  // 雨衣（大风天不适合伞）
  if (demand.RAIN > 45 && ctx.windMaxMs >= 12) {
    push('RAINCOAT', '雨衣', 'wind-rain')
  }
  // 围巾/手套（冷）
  if (ctx.dayMinC <= 4 && person.conservativeK >= 0) {
    push('SCARF', '围巾', 'cold')
  }
  if (ctx.dayMinC <= -2) {
    push('GLOVES', '手套', 'frozen')
  }
  // 墨镜/帽子/防晒（UV）
  if (demand.SOLAR > 35) {
    push('SUNGLASSES', '墨镜', 'sun')
    push('HAT', '遮阳帽', 'sun')
  }
  // 防晒霜（UV 更高）
  if (demand.SOLAR > 55) {
    push('SUNSCREEN', '防晒霜', 'sun-high')
  }
  // 备用 T 恤（闷热出汗）
  if (demand.BREATHABILITY > 55) {
    push('SPARE_TEE', '备用贴身衣', 'sweat')
  }
  // 暖手宝（严寒）
  if (ctx.dayMinC <= -5) {
    push('HAND_WARMER', '暖手宝', 'frozen')
  }
  // 轻便马甲/袖套（可脱卸）
  if (demand.REMOVABLE > 45 && demand.WARMTH > 20) {
    push('AIRY_VEST', '轻便马甲', 'removable')
  }
  return list
}