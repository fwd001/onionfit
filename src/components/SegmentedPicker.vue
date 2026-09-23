<script setup lang="ts">
// iOS 风格分段选择器（自绘：内嵌滑块 + 弹性过渡）
import { computed, onMounted, ref, watch } from 'vue'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
}

const props = withDefaults(
  defineProps<{
    options: SegmentedOption<string | number>[]
    modelValue: string | number
    /** 白色滑块或半透明 */
    variant?: 'light' | 'glass'
    /** 选项多时可横向滚动（不压缩标签），默认 false 均分 */
    scrollable?: boolean
  }>(),
  { variant: 'glass', scrollable: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const sliderStyle = ref<Record<string, string>>({ transform: 'translateX(0px)' })

function select(option: SegmentedOption<string | number>, index: number) {
  if (option.value !== props.modelValue) emit('update:modelValue', option.value)
  moveSlider(index)
}

function indexOf(value: string | number): number {
  const i = props.options.findIndex((o) => o.value === value)
  return i < 0 ? 0 : i
}

function moveSlider(index: number) {
  const el = containerRef.value
  if (!el) return
  const children = Array.from(el.children).filter((c) => c.classList.contains('seg-option'))
  const target = children[index] as HTMLElement | undefined
  if (!target || typeof index !== 'number') return
  const offset = target.offsetLeft - el.scrollLeft
  const width = target.offsetWidth
  sliderStyle.value = {
    transform: `translateX(${offset}px)`,
    width: `${width}px`,
    opacity: '1',
  }
  // 选中项尽量滚入可视区
  if (props.scrollable) {
    const elRect = el.getBoundingClientRect()
    const tRect = target.getBoundingClientRect()
    if (tRect.left < elRect.left) el.scrollLeft -= elRect.left - tRect.left
    else if (tRect.right > elRect.right) el.scrollLeft += tRect.right - elRect.right
  }
}

// 初始化与外部变化时同步滑块
watch(
  () => props.modelValue,
  (v) => moveSlider(indexOf(v)),
)

// immediate watch 在 setup 阶段执行时 DOM 未挂载（containerRef 为 null），
// 滑块定位被跳过且不再触发 → 必须在挂载后补一次定位
onMounted(() => moveSlider(indexOf(props.modelValue)))

const rootClass = computed(() => [
  'segmented',
  variantClass(props.variant),
  props.scrollable ? 'segmented-scroll' : '',
])
function variantClass(v: string): string {
  return v === 'light' ? 'segmented-light' : 'segmented-glass'
}
</script>

<template>
  <div
    ref="containerRef"
    :class="rootClass"
    role="tablist"
  >
    <div
      class="seg-slider"
      :style="sliderStyle"
    />
    <button
      v-for="(option, i) in options"
      :key="String(option.value)"
      class="seg-option"
      :class="{ selected: option.value === modelValue }"
      type="button"
      role="tab"
      :aria-selected="option.value === modelValue"
      @click="select(option, i)"
    >
      <slot
        name="option"
        :option="option"
      >
        {{ option.label }}
      </slot>
    </button>
  </div>
</template>

<style scoped lang="scss">
.segmented {
  position: relative;
  display: flex;
  border-radius: 12px;
  padding: 3px;
  gap: 2px;
}

.segmented-glass {
  background: rgba(255, 255, 255, 0.1);
}

.segmented-light {
  background: rgba(0, 0, 0, 0.06);
}

.seg-option {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 9px 6px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  transition: color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.selected {
    color: #fff;
  }
}

/* 多选项模式：内容自适应宽度 + 横向滚动，选中项自持高亮（滑块不参与） */
.segmented-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  /* 右侧淡出渐变：提示还有更多内容可滑动 */
  mask-image: linear-gradient(to right, transparent 0, #000 10px, #000 calc(100% - 22px), transparent 100%);

  &::-webkit-scrollbar {
    display: none;
  }

  .seg-option {
    flex: 0 0 auto;
    padding: 9px 14px;
  }

  .seg-slider {
    display: none;
  }

  .seg-option.selected {
    background: rgba(255, 255, 255, 0.22);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }
}

.seg-slider {
  position: absolute;
  top: 3px;
  bottom: 3px;
  /* translateX 直接使用选项 offsetLeft（含容器 padding），left 基准必须为 0 才精确对齐 */
  left: 0;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  opacity: 0;
  transition:
    transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1),
    width 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
  pointer-events: none;
}

.segmented-light .seg-option {
  color: rgba(0, 0, 0, 0.55);
  &.selected {
    color: #000;
  }
}
</style>