// 触觉反馈（@vueuse useVibrate；iOS 无 vibrate，自动忽略）

import { useVibrate } from '@vueuse/core'

export function useHaptics() {
  const { vibrate } = useVibrate({ pattern: [10] })
  const tap = () => vibrate()
  return { tap }
}