// PersonProfileEngine：人群 + 体质 → 舒适温度偏移
// 决定"中立温度"基准：怕冷的人目标温度更高 → 需要更多保暖

import { AGE_PROFILE, PREFERENCE_OFFSET } from '../config'
import type { UserSettings } from '../types'

/**
 * 解算后的个体热特征（对应 requirements PersonProfile）
 */
export interface PersonProfile {
  /** 该个体在安静不动时的中性温度 ℃ */
  neutralTempC: number
  /** 总舒适偏移（人群 + 体质） */
  comfortOffsetK: number
  /** 太阳敏感度（怕晒人群放大遮阳需求） */
  sunSensitivity: number
  /** 老人/儿童对温度变化更敏感 → 听力上更保守 */
  conservativeK: number
}

const TARGET_NEUTRAL = 22 // config.THERMAL.neutralTempC 的别名，避免循环依赖

export function resolvePerson(settings: UserSettings): PersonProfile {
  const pref = PREFERENCE_OFFSET[settings.sensitivity]
  const age = AGE_PROFILE[settings.profile]

  // 怕冷：中性温度更高（觉得更冷）→ 同温下需要更多保暖；怕热相反
  const preferenceK = pref
  const totalOffset = preferenceK + age.coldOffsetK // 怕冷偏好与人群偏移同向叠加
  return {
    neutralTempC: TARGET_NEUTRAL + totalOffset,
    comfortOffsetK: totalOffset,
    sunSensitivity: age.sunSensitivity,
    conservativeK: settings.profile === 'ADULT' ? 0 : 0.8,
  }
}