import type { Plugin, Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Local OpenAI-compatible transport: UI and Runtime are real; model content is deterministic demo data.
async function reply(request: IncomingMessage, response: ServerResponse) {
  let raw = ''
  for await (const chunk of request) raw += chunk
  const body = JSON.parse(raw) as { model?: string }
  response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
  const content =
    '1. **聊天体验**：完成会话切换和流式回复。\n2. **扩展管理**：打通 MCP 安装和 Skill 导入。\n3. **工具确认**：支持执行前确认与刷新后恢复。'
  for (const token of content.match(/[\s\S]{1,5}/gu) ?? []) {
    if (response.destroyed) return
    response.write(
      `data: ${JSON.stringify({ id: 'recording-reply', object: 'chat.completion.chunk', created: 0, model: body.model ?? 'general', choices: [{ index: 0, delta: { role: 'assistant', content: token }, finish_reason: null }] })}\n\n`,
    )
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!response.destroyed) {
    response.write('data: [DONE]\n\n')
    response.end()
  }
}

export function recordingModel(): Plugin {
  const middleware: Connect.NextHandleFunction = (request, response, next) => {
    if (request.url?.split('?')[0] !== '/__recording/chat/completions') return next()
    if (request.method !== 'POST') {
      response.writeHead(405).end()
      return
    }
    void reply(request, response).catch(() => {
      if (!response.headersSent) response.writeHead(400)
      response.end()
    })
  }
  return {
    name: 'recording-local-model',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
