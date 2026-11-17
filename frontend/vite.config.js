import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { MOBILE_MAX_WIDTH } from './src/config/breakpoints.js'

// Replaces the __MOBILE_MAX__ token in CSS with the shared breakpoint constant.
const sharedBreakpoints = {
  name: 'shared-breakpoints',
  enforce: 'pre',
  transform(code, id) {
    if (!id.split('?')[0].endsWith('.css')) return null
    return code.replaceAll('__MOBILE_MAX__', String(MOBILE_MAX_WIDTH))
  },
}

export default defineConfig({
  plugins: [sharedBreakpoints, react()],
  server: {
    port: 5173,
  },
})
