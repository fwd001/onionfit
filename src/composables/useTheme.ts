// 主题工具：深色模式跟随系统（用 @vueuse useDark/usePreferredDark）

import { useDark } from '@vueuse/core'

export function useTheme() {
  const isDark = useDark()
  return { isDark }
}