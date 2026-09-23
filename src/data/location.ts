// 设备定位封装：权限预检 + 一次性定位、8s 超时、按浏览器给可读指引
//
// 各浏览器已知行为（MDN / W3C Geolocation / Apple 开发者论坛核实）：
// - 仅 HTTPS（或 localhost）可用；GitHub Pages 天然满足
// - iOS Safari：permissions.query 状态不可靠（deny 时报 prompt），
//   拒绝过一次后不再弹窗、静默失败；PWA「添加到主屏」模式默认无定位权限，
//   需先在 Safari 网站设置里允许
// - Android Chrome：地址栏锁图标 → 权限 → 位置，可随时改
// - 系统级：定位服务关闭时统一走 err.code 1/2

export interface LocateResult {
  lat: number
  lon: number
}

export interface LocateError {
  /** 用户可读提示 */
  message: string
}

const LOCATE_TIMEOUT_MS = 8000

const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent)

/** 权限被拒后的按浏览器指引（重试前先去开权限） */
function permissionDeniedHint(): string {
  if (isIOS()) {
    return '定位权限被拒绝。请前往 设置 → 隐私与安全性 → 定位服务 → Safari（或对应浏览器）开启；若从主屏图标进入，请先在 Safari 中打开本站并允许定位'
  }
  return '定位权限被拒绝。请点击地址栏左侧的锁/ⓘ 图标 → 权限 → 位置 → 允许后重试'
}

/** 权限预检：iOS Safari 上状态不完全可靠，仅作提前拦截 */
async function queryPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  try {
    if (!navigator.permissions?.query) return 'unknown'
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
    return status.state === 'granted' || status.state === 'denied' ? status.state : 'prompt'
  } catch {
    return 'unknown'
  }
}

export async function locateDevice(): Promise<LocateResult> {
  const geo = navigator?.geolocation
  if (!geo || typeof geo.getCurrentPosition !== 'function') {
    throw { message: '当前浏览器不支持定位' } satisfies LocateError
  }
  // 非安全上下文（http 非 localhost）直接说明
  if (!window.isSecureContext) {
    throw { message: '定位需要 HTTPS 环境' } satisfies LocateError
  }

  // 明确 denied 时不再触发（避免静默失败）
  const perm = await queryPermission()
  if (perm === 'denied') {
    throw { message: permissionDeniedHint() } satisfies LocateError
  }

  return new Promise<LocateResult>((resolve, reject) => {
    geo.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        // 1=权限拒绝 2=位置不可得 3=超时
        if (err.code === 1) {
          reject({ message: permissionDeniedHint() } satisfies LocateError)
        } else if (err.code === 3) {
          reject({ message: '定位超时，可能在室内或未开启定位服务' } satisfies LocateError)
        } else {
          reject({ message: '定位失败，请检查系统定位服务或网络' } satisfies LocateError)
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
