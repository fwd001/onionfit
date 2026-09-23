<script setup lang="ts">
// 洋葱穿搭卡片：洋葱环 + 每层层名/衣物（卡通图形+名称）/理由（未穿层淡显）
import GlassCard from '@/components/GlassCard.vue'
import GarmentIcon from '@/components/GarmentIcon.vue'
import OnionDiagram from './OnionDiagram.vue'
import { ROLE_LABEL } from '@/core/engine/layering'
import type { OutfitAssembly } from '@/core/types'

const props = defineProps<{
  outfit: OutfitAssembly
  wornCount: number
}>()

const roleColor: Record<string, string> = {
  BASE: '#8FD3FF',
  INSULATION: '#FFD28F',
  PROTECTION: '#A8E6B0',
}
</script>

<template>
  <GlassCard class="onion-card">
    <div class="onion-layout">
      <OnionDiagram
        :roles="outfit.layers.map((l) => ({ role: l.role, active: l.active }))"
        :size="150"
      />
      <div class="layers">
        <div
          v-for="layer in outfit.layers"
          :key="layer.role"
          class="layer-row"
          :class="{ inactive: !layer.active }"
        >
          <span
            class="dot"
            :style="{ background: roleColor[layer.role] }"
          />
          <div class="layer-main">
            <div class="layer-title">
              {{ ROLE_LABEL[layer.role] ?? layer.role }}
              <span
                v-if="!layer.active"
                class="carry"
              >带 · 暂不穿</span>
            </div>
            <div
              v-if="layer.items.length"
              class="layer-items"
            >
              <span
                v-for="it in layer.items"
                :key="it.id"
                class="item-chip"
              >
                <span
                  class="chip-icon"
                  :style="{ color: roleColor[layer.role] }"
                >
                  <GarmentIcon :id="it.id" />
                </span>
                <span class="chip-name">{{ it.name }}</span>
              </span>
            </div>
          </div>
        </div>
        <div
          v-if="!outfit.layers.length"
          class="empty-hint"
        >
          暂无可搭配建议
        </div>
      </div>
    </div>
    <div class="worn-tip">{{ wornCount }} 层现在正穿着</div>
  </GlassCard>
</template>

<style scoped lang="scss">
.onion-card {
  padding: 20px;
}

.onion-layout {
  display: flex;
  align-items: center;
  gap: 16px;
}

.layers {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.layer-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  transition: opacity 0.3s;

  &.inactive {
    opacity: 0.5;
  }
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.layer-main {
  min-width: 0;
}

.layer-title {
  font-size: 15px;
  font-weight: 600;
}

.carry {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
}

.layer-items {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.item-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 7px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.09);
  transition: background 0.2s ease;
}

.chip-icon {
  display: grid;
  place-items: center;
}

.chip-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
}

.empty-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.worn-tip {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
  text-align: center;
}
</style>