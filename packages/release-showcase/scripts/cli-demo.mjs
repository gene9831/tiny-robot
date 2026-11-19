import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../.recording/', import.meta.url))
const cli = fileURLToPath(new URL('../../cli/bin/cli.js', import.meta.url))
const action = process.argv[2]
if (action !== 'preview' && action !== 'create') {
  console.error('Usage: cli-demo.mjs preview|create')
  process.exit(1)
}
mkdirSync(root, { recursive: true })

let cwd = root
let args
if (action === 'preview') {
  cwd = join(root, 'vue-host')
  mkdirSync(join(cwd, 'src'), { recursive: true })
  const fixtures = {
    'package.json': `${JSON.stringify({ name: 'recording-vue-host', private: true, type: 'module', dependencies: { vue: '^3.3.11' } }, null, 2)}\n`,
    'src/App.vue': '<template><main>我的 Vue 应用</main></template>\n',
    'src/main.ts': "import { createApp } from 'vue'\nimport App from './App.vue'\ncreateApp(App).mount('#app')\n",
  }
  for (const [name, content] of Object.entries(fixtures)) {
    const target = join(cwd, name)
    // Repeated preview must leave any existing host content intact.
    if (!existsSync(target)) writeFileSync(target, content)
  }
  args = ['add', 'chat', '--dry-run', '--runtime-version', '1.0.0-rc.8']
} else {
  let index = 1
  while (existsSync(join(root, `my-chat-${index}`))) index++
  args = ['create', `my-chat-${index}`, '--runtime-version', '1.0.0-rc.8']
}

console.log(`tiny-robot-cli ${args.join(' ')}\n`)
const hostPackage = action === 'preview' ? readFileSync(join(cwd, 'package.json'), 'utf8') : null
const result = spawnSync(process.execPath, [cli, ...args], { cwd, stdio: 'inherit' })
if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}
if (hostPackage !== null && readFileSync(join(cwd, 'package.json'), 'utf8') !== hostPackage) {
  console.error('Preview changed the host package unexpectedly.')
  process.exit(1)
}
process.exit(result.status ?? 1)
