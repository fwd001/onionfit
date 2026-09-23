<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style lang="scss">
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.32s cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>