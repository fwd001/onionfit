// 太阳方位辅助：估算太阳高度角（简化 NOAA 正弦近似）
// 用于 -1 缺数据时估算体感与昼夜；不做精确天文学

const DEG = Math.PI / 180

/**
 * 估算太阳高度角（度）。
 * 输入：当地时间 Date、纬度。基于太阳赤纬近似 + 时角近似（以 12:00 为当地正午）。
 */
export function estimateSolarElevation(date: Date, latitude: number): number {
  const dayOfYear = dayOfYearOf(date)
  // 太阳赤纬（度）近似：δ ≈ 23.44° * sin(360/365 * (N-81))
  const declination = 23.44 * Math.sin((360 / 365) * (dayOfYear - 81) * DEG)
  // 时角：上午负、下午正，每 15° / 小时。12:00 正午时角 0。
  const hour = date.getHours() + date.getMinutes() / 60
  const hourAngle = (hour - 12) * 15
  const lat = latitude * DEG
  const dec = declination * DEG
  const ha = hourAngle * DEG
  const sinElevation =
    Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)
  return Math.asin(Math.max(-1, Math.min(1, sinElevation))) / DEG
}

function dayOfYearOf(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

/**
 * 简化的日间辐照估算（W/m²）：当太阳高度角 > 0 时按正弦衰减估算。
 * 云量 -1 时按 0.7 衰减系数估。
 */
export function estimateSolarRadiation(elevationDeg: number, cloudCoverPercent: number): number {
  if (elevationDeg <= 0) return 0
  const clearSky = 1000 * Math.max(0, Math.sin(elevationDeg * DEG))
  const cloudFactor = cloudCoverPercent < 0 ? 1 - 0.3 : 1 - 0.75 * (cloudCoverPercent / 100)
  return clearSky * Math.max(0.05, cloudFactor)
}