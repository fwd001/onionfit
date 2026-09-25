// presentation：唯一负责把算法结论翻译成人话文案层。
// 只消费结构化结果与 ReasonCode，不参与任何决策（requirements 1.2 硬约束）

import type { DayPart } from '@/core/engine/schedule'
import type {
  Accessory,
  AccessoryKind,
  DemandDim,
  DemandVector,
  UmbrellaAssessment,
  UmbrellaLeg,
  UmbrellaVerdict,
  WeatherKind,
} from '@/core/types'

/** 天气现象 → 文案 */
export function weatherDesc(kind: WeatherKind, temp: number, isDay: boolean): string {
  const time = isDay ? '白天' : '夜间'
  switch (kind) {
    case 'clear':
      return `${time}晴 · ${Math.round(temp)}°`
    case 'cloudy':
      return `${time}多云 · ${Math.round(temp)}°`
    case 'rain':
      return `${time}有雨 · ${Math.round(temp)}°`
    case 'snow':
      return `${time}降雪 · ${Math.round(temp)}°`
    case 'thunder':
      return `${time}雷雨 · ${Math.round(temp)}°`
    case 'fog':
      return `${time}有雾 · ${Math.round(temp)}°`
    default:
      return `${Math.round(temp)}°`
  }
}

/** 六维需求中文名与副标题 */
export const DEMAND_META: Record<DemandDim, { label: string; subtitle: string }> = {
  WARMTH: { label: '保暖', subtitle: '热量保持' },
  WIND: { label: '防风', subtitle: '抗风阻隔' },
  RAIN: { label: '防雨', subtitle: '防水隔湿' },
  BREATHABILITY: { label: '透气', subtitle: '排汗散热' },
  SOLAR: { label: '遮阳', subtitle: '防晒防护' },
  REMOVABLE: { label: '可脱卸', subtitle: '穿脱便利' },
}

/** 需求向量 → 高优先级摘要（今天的主要矛盾） */
export function demandSummary(v: DemandVector): { dim: DemandDim; value: number; label: string } | null {
  const entries = Object.entries(v) as [DemandDim, number][]
  entries.sort((a, b) => b[1] - a[1])
  const top = entries[0]
  if (!top || top[1] < 10) return null
  return { dim: top[0], value: top[1], label: DEMAND_META[top[0]].label }
}

/** 配饰标签（含数量/轻便描述） */
export function accessoryLabel(a: Accessory): string {
  switch (a.kind) {
    case 'SCARF':
      return '围巾可护颈'
    case 'GLOVES':
      return '记得戴手套'
    case 'SUNGLASSES':
      return '遮光墨镜'
    case 'SPARE_TEE':
      return '备一件贴身衣'
    case 'HAT':
      return '遮阳帽'
    case 'SUNSCREEN':
      return '涂防晒霜'
    case 'HAND_WARMER':
      return '暖手宝'
    case 'AIRY_VEST':
      return '轻便马甲可带'
    default:
      return a.label
  }
}

/** 带伞结论标题 */
const UMBRELLA_HEADLINE: Record<UmbrellaVerdict, string> = {
  BRING: '推荐带伞',
  RAINCOAT: '建议穿雨衣',
  SKIP: '不用带伞',
}

const LEG_PHASE_LABEL: Record<UmbrellaLeg['phase'], string> = {
  OUT: '出门',
  HOME: '回家',
  NOW: '此刻',
}

/** 结论标题：逐时数据充分且远超阈值时升级为强提醒 */
export function umbrellaHeadline(a: UmbrellaAssessment): string {
  if (a.verdict === 'BRING' && a.confidence === 'HOURLY' && a.probability >= a.threshold * 2) {
    return '务必带伞'
  }
  return UMBRELLA_HEADLINE[a.verdict]
}

/** 通勤段行首标签 */
export function umbrellaLegLabel(leg: UmbrellaLeg): string {
  return `${LEG_PHASE_LABEL[leg.phase]} ${leg.start}`
}

/** 一句话依据：指出最容易淋到的那段，以及改判雨衣的原因 */
export function umbrellaReason(a: UmbrellaAssessment): string {
  if (!a.probability) return '外出窗口内没有降雨信号'
  if (a.verdict === 'RAINCOAT') {
    return a.reasons.includes('wind-rain')
      ? `风 ${a.windMs} m/s，伞撑不住，改穿雨衣`
      : `雨强 ${a.rainMmPerHour} mm/h，伞挡不住，改穿雨衣`
  }
  const worst = a.legs.reduce((acc, l) => (l.probability > acc.probability ? l : acc), a.legs[0])
  if (a.verdict === 'SKIP') return '外出时段下雨的可能不大，不用多带一把伞'
  return `最容易淋到的是${LEG_PHASE_LABEL[worst.phase]}那段 ${worst.minutes} 分钟`
}

/** 结论可靠性说明（兜底时段 / 缺逐时预报） */
export function umbrellaCaveat(a: UmbrellaAssessment): string {
  if (a.confidence === 'DEGRADED' && a.assumed) return '未设置通勤时间，且缺逐时预报，按全天概率估算'
  if (a.confidence === 'DEGRADED') return '缺逐时预报，按全天降水概率估算'
  if (a.assumed) return '未设置通勤时间，按 07:30 / 18:00 估算'
  return ''
}

/** 建议文案生成（不参与决策，只描述）——层的口语化提示 */
export function layerAdvice(
  layers: { role: string; active: boolean; items: { name: string }[] }[],
): string {
  const worn = layers.filter((l) => l.active)
  const carried = layers.filter((l) => !l.active)
  if (!worn.length) return ''
  const names = worn.map((l) => l.items[0]?.name).filter(Boolean)
  let text = `建议${names.join(' + ')}`
  if (carried.length) {
    const carriedNames = carried.map((l) => l.items[0]?.name).filter(Boolean)
    text += `，${carriedNames.join('/')}可以带着`
  }
  return text
}

/** 时段建议（翻译 dayparts） */
export function daypartAdvice(p: DayPart): string {
  switch (p.phase) {
    case 'morning':
      return `${p.label}体感约 ${Math.round(p.avgTemp)}°，出门记得遮风`
    case 'noon':
      return `${p.label}最暖约 ${Math.round(p.avgTemp)}°，感觉热可脱中间层`
    case 'evening':
      return `${p.label}约 ${Math.round(p.avgTemp)}°，回家路上记得添衣`
    default:
      return `${p.label}约 ${Math.round(p.avgTemp)}°`
  }
}

/** 安全等级文案 */
export function safetyTitle(level: 'NORMAL' | 'WATCH' | 'DANGER'): string {
  switch (level) {
    case 'DANGER':
      return '安全提醒（重度）'
    case 'WATCH':
      return '温馨提示'
    default:
      return ''
  }
}

/** 体感表述 */
export function feelsLikeText(feelsC: number, tempC: number): string {
  const diff = feelsC - tempC
  if (Math.abs(diff) < 1) return `${Math.round(feelsC)}°（与气温相当）`
  return `${Math.round(feelsC)}° ${diff > 0 ? '（比气温闷热）' : '（比气温凉）'}`
}

// 导出类型（引用安全）
export type { AccessoryKind }