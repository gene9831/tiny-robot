import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('GenUI stream parser separates markdown and schema-card content across chunks', async () => {
  let createGenuiStreamParser

  try {
    ;({ createGenuiStreamParser } = await import('../src/tiny-robot-chat/genui/stream-parser.ts'))
  } catch {
    // RED: the integration module does not exist before the GenUI step is implemented.
  }

  assert.equal(typeof createGenuiStreamParser, 'function')

  const parts = []
  const parser = createGenuiStreamParser({
    onMarkdown: (content) => parts.push({ type: 'text', text: content }),
    onSchemaCard: (content) => parts.push({ type: 'schema-card', content }),
  })

  parser.write('先看概览\n```sche')
  parser.write('maJson\n{"componentName":"Page"}\n```\n完成')
  parser.end()

  assert.deepEqual(parts, [
    { type: 'text', text: '先看概览\n' },
    { type: 'schema-card', content: '\n{"componentName":"Page"}' },
    { type: 'text', text: '\n完成' },
  ])
})

test('GenUI message plugin stores ordered text and schema-card parts', async () => {
  let createGenuiSchemaStreamPlugin

  try {
    ;({ createGenuiSchemaStreamPlugin } = await import('../src/tiny-robot-chat/genui/stream-plugin.ts'))
  } catch {
    // RED: the TinyRobot message plugin is introduced by the GenUI step.
  }

  assert.equal(typeof createGenuiSchemaStreamPlugin, 'function')

  const plugin = createGenuiSchemaStreamPlugin(() => true)
  const message = { role: 'assistant', content: '', state: {} }

  plugin.onTurnStart?.({})
  plugin.onCompletionChunk?.({ currentMessage: message, choice: { delta: { content: '说明\n```schemaJson\n{' } } })
  plugin.onCompletionChunk?.({
    currentMessage: message,
    choice: { delta: { content: '"componentName":"Page"}\n```\n结束' } },
  })
  plugin.onFinally?.({})

  assert.deepEqual(message.state.genuiContent, [
    { type: 'text', text: '说明\n' },
    { type: 'schema-card', content: '\n{"componentName":"Page"}' },
    { type: 'text', text: '\n结束' },
  ])
})

test('GenUI switch is rendered through the TinyRobot sender footer', async () => {
  const chatSource = await readFile(new URL('../src/TinyRobotChat.vue', import.meta.url), 'utf8')
  const composerToolsSource = await readFile(
    new URL('../src/tiny-robot-chat/components/ComposerTools.vue', import.meta.url),
    'utf8',
  )

  assert.match(chatSource, /<template\s+#sender-footer>/)
  assert.doesNotMatch(composerToolsSource, /GenUI|genui/)
})

test('GenUI request routing preserves the selected model', async () => {
  let resolveChatRequestTarget

  try {
    ;({ resolveChatRequestTarget } = await import('../src/tiny-robot-chat/genui/request-routing.ts'))
  } catch {
    // RED: dynamic GenUI request routing is introduced by this change.
  }

  assert.equal(typeof resolveChatRequestTarget, 'function')
  assert.deepEqual(
    resolveChatRequestTarget({
      modelId: 'qwen3.7-plus',
      modelUrl: 'https://dashscope.example.com/chat/completions',
      genuiEnabled: true,
      genuiUrl: 'https://chat.example.com/api/v1/ai/prompt/chat/completions',
    }),
    {
      modelId: 'qwen3.7-plus',
      url: 'https://chat.example.com/api/v1/ai/prompt/chat/completions',
    },
  )
})

test('GenUI requests never forward the selected model API key', async () => {
  const { resolveChatAuthorizationKey } = await import(
    '../src/tiny-robot-chat/genui/request-routing.ts'
  ).catch(() => ({}))

  assert.equal(typeof resolveChatAuthorizationKey, 'function')
  assert.equal(
    resolveChatAuthorizationKey({ genuiEnabled: true, modelApiKey: 'model-secret' }),
    undefined,
  )
  assert.equal(
    resolveChatAuthorizationKey({
      genuiEnabled: true,
      genuiApiKey: 'genui-secret',
      modelApiKey: 'model-secret',
    }),
    'genui-secret',
  )
  assert.equal(
    resolveChatAuthorizationKey({ genuiEnabled: false, modelApiKey: 'model-secret' }),
    'model-secret',
  )
})
