import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            // Server modules guard against client imports; tests may import their pure functions
            'server-only': path.resolve(__dirname, 'src/test/emptyModule.ts'),
        },
    },
    test: {
        // Trend buckets and calendar months use local time; pin the zone so tests are deterministic
        env: { TZ: 'UTC' },
    },
})
