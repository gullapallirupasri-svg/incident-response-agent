import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = dirname(fileURLToPath(import.meta.url))

function standaloneRuntime() {
	return {
		name: 'signalops-standalone-runtime',
		apply: 'build',
		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: 'app.js',
				source: readFileSync(resolve(projectRoot, 'app.js')),
			})
		},
	}
}

export default defineConfig({
	plugins: [react(), standaloneRuntime()],
	server: {
		host: 'localhost',
		port: 5173,
		strictPort: true,
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:8000',
				changeOrigin: true,
			},
		},
	},
})