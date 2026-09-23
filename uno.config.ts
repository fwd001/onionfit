import { defineConfig, presetUno, presetAttributify, presetIcons, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({ scale: 1.2, warn: true }),
  ],
  transformers: [transformerDirectives()],
  theme: {
    colors: {
      base: '#12142E',
    },
  },
  shortcuts: {
    'glass-card':
      'rounded-[28px] border border-white/24 bg-white/14 backdrop-blur-[20px] p-5 text-white',
  },
})