// ===== 穿搭算法配置（集中管理全部阈值/系数，避免参数散落引擎内） =====

/**
 * 热舒适（Thermal）
 * requirements：目标皮温、代谢基准、对流/风因子、辐射增益、clo 与温度的关系
 */
export const THERMAL = {
  /** 静坐舒适中性温度 ℃ */
  neutralTempC: 22,
  /** 每 1 clo 对应的可承受温差跨度 */
  cloPerDegree: 6.5,
  /** 目标内在 clo 上限（防过度保暖） */
  maxIntrinsicClo: 2.6,
  /** 太阳辐射增益系数：每 W/m² 抬升作用温度 ℃（约 600 W/m² 晴天 → +3.5℃） */
  radiantGainCoeff: 0.006,
  /** 辐射增益上限 ℃（防失真） */
  radiantGainMaxK: 5,
  /** 风寒启动阈值 ℃ */
  windChillOnsetC: 10,
  /** 湿度负载启动阈值 ℃（仅高温侧加载） */
  humidityOnsetC: 26,
  /** 湿度负载系数：每 10%RH 高于基准的升温 */
  humidityPer10: 0.6,
  /** 温湿度基准：湿度 40% 视为中性 */
  humidityBaseline: 40,
  /** 活动基础代谢抬升：每 MET 偏移的保暖需求 clo 降幅 */
  metabolicOffsetPerMet: 4,
}

/**
 * 太阳（Solar）
 */
export const SOLAR = {
  /** 防晒需求启动的 UV 指数 */
  uvOnset: 3,
  /** 遮阳需求满值的 UV 指数 */
  uvFull: 8,
  /** 日出/日落兜底（缺数据时） */
  fallbackSunrise: '06:30',
  fallbackSunset: '18:30',
}

/**
 * 人体与偏好（Person）
 * 冷热偏好偏移（deg），对应 PreferenceConfig 与 AgeProfileConfig
 */
export const PREFERENCE_OFFSET: Record<'COLD_SENSITIVE' | 'NORMAL' | 'HEAT_SENSITIVE', number> = {
  COLD_SENSITIVE: -2.0, // 怕冷：目标温度上调 → 需更多保暖 → 偏移为负
  NORMAL: 0,
  HEAT_SENSITIVE: 1.5, // 怕热：少穿
}

/** 人群热特征：怕冷敏感档（相对成人偏移） */
export const AGE_PROFILE: Record<
  'CHILD' | 'ADULT' | 'ELDERLY',
  { coldOffsetK: number; heatOffsetK: number; sunSensitivity: number }
> = {
  CHILD: { coldOffsetK: 1.8, heatOffsetK: 0.8, sunSensitivity: 1.3 },
  ADULT: { coldOffsetK: 0, heatOffsetK: 0, sunSensitivity: 1 },
  ELDERLY: { coldOffsetK: 2.5, heatOffsetK: 0.5, sunSensitivity: 1.1 },
}

/**
 * 活动（Activity）：代谢与暴露
 */
export const ACTIVITY: Record<
  string,
  { met: number; selfWindMs: number; sunExposure: number; rainExposure: number }
> = {
  HOME: { met: 1.0, selfWindMs: 0, sunExposure: 0.2, rainExposure: 0 },
  OFFICE: { met: 1.1, selfWindMs: 0, sunExposure: 0.1, rainExposure: 0 },
  CLASS: { met: 1.2, selfWindMs: 0, sunExposure: 0.2, rainExposure: 0 },
  WALKING: { met: 2.2, selfWindMs: 0.6, sunExposure: 0.8, rainExposure: 0.8 },
  CYCLING: { met: 4.2, selfWindMs: 4.0, sunExposure: 1.0, rainExposure: 1.0 },
  RUNNING: { met: 6.5, selfWindMs: 3.0, sunExposure: 1.0, rainExposure: 0.9 },
  OUTDOOR_WORK: { met: 3.5, selfWindMs: 0.4, sunExposure: 1.0, rainExposure: 1.0 },
  OUTDOOR_LEISURE: { met: 2.4, selfWindMs: 0.6, sunExposure: 0.9, rainExposure: 0.9 },
  DRIVING: { met: 1.4, selfWindMs: 0.2, sunExposure: 0.5, rainExposure: 0.6 },
}

/**
 * 六维需求（Demand）
 */
export const DEMAND = {
  /** 保暖：需要的 clo 与中性 clo 的差值 → 0-100 */
  warmthFullCloDiff: 1.6,
  /** 防风：风速阈值 m/s */
  windOnsetMs: 4,
  windFullMs: 12,
  /** 防雨：降水概率阈值 % */
  rainChanceOnset: 30,
  rainChanceFull: 85,
  /** 雨量阈值 mm/h */
  rainMmOnset: 0.5,
  rainMmFull: 4,
  /** 透气：高温启动 ℃ */
  breathabilityOnsetC: 25,
  breathabilityFullC: 33,
  /** 可脱卸：昼夜温差启动 ℃ */
  removableOnsetDiff: 8,
  removableFullDiff: 16,
}

/**
 * 分层（Layering）
 */
export const LAYERING = {
  /** 最大槽位数：贴身上装 + 贴身下装 + 双保暖 + 防护 */
  maxLayers: 5,
  /** 第二保温槽位所需额外 clo */
  secondInsulationClo: 0.35,
  /** 层间 clo 递减系数（穿两层实际保暖 < 相加） */
  layerDiminish: 0.85,
}

/**
 * 安全（Safety）
 */
export const SAFETY = {
  /** 温度预警阈值 */
  dangerHeatC: 35,
  dangerColdC: -10,
  watchHeatC: 33,
  watchColdC: -5,
  /** 风速预警 m/s */
  dangerWindMs: 15,
  watchWindMs: 10,
  /** 强降雨 mm/h */
  dangerRainMm: 8,
  watchRainMm: 4,
}

/**
 * 评分权重（合计 1.0）
 */
export const SCORING = {
  weights: {
    warmth: 0.3,
    wind: 0.15,
    water: 0.15,
    breathability: 0.15,
    weight: 0.1,
    removable: 0.1,
    solar: 0.05,
  },
  /** 硬件等级要求（雨时防护层最低） */
  minShellForRain: 2,
  minShellForWind: 1,
}