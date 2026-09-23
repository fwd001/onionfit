// 设备定位封装：一次性定位、8s 超时、权限拒绝的可读提示

export interface LocateResult {
  lat: number
  lon: number
}

export interface LocateError {
  /** 用户可读提示 */
  message: string
}

const LOCATE_TIMEOUT_MS = 8000

export function locateDevice(): Promise<LocateResult> {
  return new Promise((resolve, reject) => {
    const geo = navigator?.geolocation
    if (!geo || typeof geo.getCurrentPosition !== 'function') {
      reject({ message: '当前浏览器不支持定位' } satisfies LocateError)
      return
    }
    geo.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        if (err.code === 1) {
          reject({ message: '未授予定位权限，可前往设置开启' } satisfies LocateError)
        } else if (err.code === 3) {
          reject({ message: '定位超时，可能在室内' } satisfies LocateError)
        } else {
          reject({ message: '定位失败，请检查网络或信号' } satisfies LocateError)
        }
      },
      {
        enableHighAccuracy: false,
        timeout: LOCATE_TIMEOUT_MS,
        maximumAge: 10 * 60 * 1000, // 10 分钟内旧定位直接用
      },
    )
  })
}