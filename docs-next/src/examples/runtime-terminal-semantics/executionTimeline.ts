import type { RuntimeRunStatus, RuntimeStepStatus } from '@opentiny/tiny-robot-runtime'

export type ExecutionStageKind =
  | 'run-created'
  | 'model-running'
  | 'run-completed'
  | 'run-failed'
  | 'run-aborted'
  | 'run-interrupted'
  | 'waiting-for-tool'

export interface ExecutionStageInput {
  readonly runStatus: RuntimeRunStatus
  readonly stepStatus?: RuntimeStepStatus
  readonly termination?: 'stop' | 'max_output_tokens' | 'content_filter' | 'tool_calls'
  readonly errorCode?: string
}

export interface ExecutionStage {
  readonly key: string
  readonly kind: ExecutionStageKind
  readonly title: string
  readonly detail: string
}

function stage(kind: ExecutionStageKind, title: string, detail: string): ExecutionStage {
  return { key: `${kind}:${detail}`, kind, title, detail }
}

/** Converts public Run and Step facts into one reader-facing execution stage. */
export function createExecutionStage(input: ExecutionStageInput): ExecutionStage {
  if (input.runStatus === 'pending') {
    return stage('run-created', '创建回答任务', 'Run pending · Model Step 尚未开始')
  }

  if (input.runStatus === 'active' && input.stepStatus === 'completed' && input.termination === 'tool_calls') {
    return stage('waiting-for-tool', '模型请求调用工具', 'Model Step completed · Run active，等待工具流程')
  }

  if (input.runStatus === 'active') {
    return stage('model-running', '正在调用模型', `Run active · Model Step ${input.stepStatus ?? '尚未开始'}`)
  }

  if (input.runStatus === 'completed') {
    const reason = input.termination ?? '未提供'
    return stage('run-completed', '模型结束，回答完成', `Run completed · termination ${reason}`)
  }

  if (input.runStatus === 'failed') {
    return stage('run-failed', 'Provider 返回失败', `Run failed · error ${input.errorCode ?? 'provider_error'}`)
  }

  if (input.runStatus === 'aborted') {
    return stage('run-aborted', '用户停止了回答', `Run aborted · error ${input.errorCode ?? 'caller_aborted'}`)
  }

  return stage('run-interrupted', '模型流程意外中断', 'Run interrupted · 当前结果不能视为成功')
}

export interface ExecutionTimelinePlayer {
  enqueue(stage: ExecutionStage): void
  whenIdle(): Promise<void>
  dispose(): void
}

/** Replays observed stages in order while keeping each transition readable. */
export function createExecutionTimelinePlayer(options: {
  readonly intervalMs: number
  readonly present: (stage: ExecutionStage) => void
}): ExecutionTimelinePlayer {
  let tail = Promise.resolve()
  let hasPresented = false
  let disposed = false
  let lastKey: string | undefined

  const pause = () => new Promise<void>((resolve) => setTimeout(resolve, options.intervalMs))

  return {
    enqueue(nextStage) {
      if (disposed || nextStage.key === lastKey) return
      lastKey = nextStage.key
      tail = tail.then(async () => {
        if (hasPresented) await pause()
        if (disposed) return
        options.present(nextStage)
        hasPresented = true
      })
    },
    whenIdle: () => tail,
    dispose() {
      disposed = true
    },
  }
}
