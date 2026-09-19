import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      // matches Quasar's webpack "src" alias, used throughout src/store
      src: path.resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom'
  }
})
