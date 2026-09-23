// 下拉刷新：用 @vueuse/gesture 的 useDrag 感知下拉手势
import { reactive, type Ref } from 'vue'
import { useDrag } from '@vueuse/gesture'

export interface PullToRefresh {
  /** 下拉距离（px） */
  distance: number
  /** 是否达到触发阈值（弹回刷新） */
  ready: boolean
  /** 是否正在刷新 */
  refreshing: boolean
}

const THRESHOLD = 70

export function usePullToRefresh(
  target: Ref<HTMLElement | null>,
  onRefresh: () => Promise<void>,
) {
  const state = reactive<PullToRefresh>({ distance: 0, ready: false, refreshing: false })

  useDrag(
    (gesture) => {
      const my = gesture.movement[1]
      if (window.scrollY > 2) {
        state.distance = 0
        return
      }
      state.distance = gesture.active ? Math.max(0, Math.min(my * 0.5, 110)) : 0
      state.ready = state.distance >= THRESHOLD
      if (!gesture.active && state.distance > 0) {
        if (state.ready) {
          state.refreshing = true
          void onRefresh().finally(() => {
            state.refreshing = false
            state.distance = 0
            state.ready = false
          })
        } else {
          state.distance = 0
        }
      }
    },
    {
      domTarget: target,
      axis: 'y',
      threshold: 6,
      preventWindowScrollY: false,
    },
  )

  return state
}