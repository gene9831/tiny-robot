import { pipeline } from 'node:stream/promises'
import type { Connect, Plugin } from 'vite'

const defaultBaseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const maxRequestBytes = 8 * 1024 * 1024

function completionUrl(baseUrl: string) {
  const url = new URL(baseUrl.trim() || defaultBaseUrl)
  const officialHost =
    /^dashscope(?:-intl|-us)?\.aliyuncs\.com$/.test(url.hostname) || url.hostname.endsWith('.maas.aliyuncs.com')
  if (
    url.protocol !== 'https:' ||
    !officialHost ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  ) {
    throw new Error('DASHSCOPE_BASE_URL 必须是百炼的 HTTPS 兼容接口地址。')
  }
  return url.href.replace(/\/$/, '') + '/chat/completions'
}

export function bailianRecording(apiKey: string, baseUrl: string): Plugin {
  const upstreamUrl = apiKey ? completionUrl(baseUrl) : ''
  const middleware: Connect.NextHandleFunction = async (request, response, next) => {
    if (request.url?.split('?')[0] !== '/__recording/bailian/chat/completions') return next()
    if (request.method !== 'POST') {
      response.writeHead(405).end()
      return
    }
    const origin = request.headers.origin
    if (origin && origin !== `http://${request.headers.host}`) {
      response.writeHead(403).end()
      return
    }
    if (!request.headers['content-type']?.startsWith('application/json')) {
      response.writeHead(415).end()
      return
    }
    if (!apiKey) {
      response.writeHead(503).end('请在录制项目的 .env.local 中填写 DASHSCOPE_API_KEY 并重启。')
      return
    }

    const abort = new AbortController()
    response.on('close', () => abort.abort())
    try {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of request) {
        size += chunk.length
        if (size > maxRequestBytes) {
          response.writeHead(413).end('录制请求过大。')
          return
        }
        chunks.push(chunk)
      }
      const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: Buffer.concat(chunks).toString('utf8'),
        redirect: 'error',
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(90_000)]),
      })
      if (!upstream.ok || !upstream.body) {
        await upstream.body?.cancel()
        response.writeHead(upstream.ok ? 502 : upstream.status).end('百炼未接受请求，请检查 Key、服务地址和模型权限。')
        return
      }
      response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
      await pipeline(upstream.body, response)
    } catch {
      if (!response.headersSent && !response.destroyed) response.writeHead(502).end('无法完成百炼请求。')
    }
  }
  return {
    name: 'recording-bailian',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
