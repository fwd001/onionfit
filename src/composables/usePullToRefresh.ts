// 下拉刷新：原生触摸事件实现（移动端可靠版）
//
// 为什么不用 @vueuse/gesture 的 useDrag：其基于 Pointer Events，
// 移动端浏览器把触摸判定为滚动手势后会发出 pointercancel 并接管，
// 下拉位移收不到 → 界面无反应。原生 touchmove + passive:false
// 在页面已到顶时 preventDefault 接管下拉，是 PWA 下拉刷新的标准做法。
import { onMounted, onUnmounted, reactive, type Ref } from 'vue'

export interface PullToRefresh {
  /** 下拉距离（px） */
  distance: number
  /** 是否达到触发阈值（松手即刷新） */
  ready: boolean
  /** 是否正在刷新 */
  refreshing: boolean
}

const THRESHOLD = 70
const MAX_PULL = 110
const DAMPING = 0.5

export function usePullToRefresh(
  target: Ref<HTMLElement | null>,
  onRefresh: () => Promise<void>,
) {
  const state = reactive<PullToRefresh>({ distance: 0, ready: false, refreshing: false })

  let startY = 0
  let pulling = false
  let el: HTMLElement | null = null

  function onTouchStart(e: TouchEvent) {
    if (state.refreshing) return
    // 仅页面已在顶部时允许下拉手势（其余交给原生滚动）
    if (window.scrollY > 2) return
    startY = e.touches[0].clientY
    pulling = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!pulling || state.refreshing) return
    const dy = e.touches[0].clientY - startY
    if (dy <= 0) {
      state.distance = 0
      state.ready = false
      return
    }
    // 明确向下拉且页面在顶部 → 接管手势（阻止浏览器滚动/刷新行为）
    if (dy > 8 && window.scrollY <= 0) e.preventDefault()
    state.distance = Math.min(dy * DAMPING, MAX_PULL)
    state.ready = state.distance >= THRESHOLD
  }

  function onTouchEnd() {
    if (!pulling) return
    pulling = false
    if (state.ready && !state.refreshing) {
      state.refreshing = true
      void onRefresh().finally(() => {
        state.refreshing = false
        state.distance = 0
        state.ready = false
      })
    } else {
      state.distance = 0
      state.ready = false
    }
  }

  // mounted 后 ref 已填充，绑定触摸监听并随组件卸载解绑
  onMounted(() => {
    el = target.value
    if (!el) return
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    if (!el) return
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('touchcancel', onTouchEnd)
  })

  return state
}
