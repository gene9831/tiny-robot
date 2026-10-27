import { createRuntime, type RuntimeProviderRegistrationV1, type RuntimeSnapshot } from '@opentiny/tiny-robot-runtime'
import { selectConversation } from '@opentiny/tiny-robot-runtime/selectors'
import { createLocalTextRegistration } from '../demos/localTextProvider'

interface ConversationDefinition {
  readonly label: string
  readonly providerId: string
  readonly modelId: string
  readonly question: string
  readonly answer: string
}

const definitions: ReadonlyArray<ConversationDefinition> = [
  {
    label: 'Conversation A',
    providerId: 'conversation-a-local',
    modelId: 'beijing-summary',
    question: '北京的气候有什么特点？',
    answer: '北京四季分明。',
  },
  {
    label: 'Conversation B',
    providerId: 'conversation-b-local',
    modelId: 'shenzhen-summary',
    question: '深圳的气候有什么特点？',
    answer: '深圳温暖湿润。',
  },
]

export interface MultipleConversationsDemoItem {
  readonly id: string
  readonly label: string
  readonly question: string
  readonly answer: string
}

export interface MultipleConversationsDemoResult {
  readonly snapshot: RuntimeSnapshot
  readonly conversations: ReadonlyArray<MultipleConversationsDemoItem>
}

export interface MultipleConversationsDemoOptions {
  readonly terminalDelayMs?: number
}

/** Creates two sequential answers that remain resident in one Runtime Snapshot. */
export async function runMultipleConversationsDemo(
  options: MultipleConversationsDemoOptions = {},
): Promise<MultipleConversationsDemoResult> {
  const registrations = new Map<string, RuntimeProviderRegistrationV1>(
    definitions.map((definition) => [
      definition.providerId,
      createLocalTextRegistration({
        providerId: definition.providerId,
        modelId: definition.modelId,
        responseText: definition.answer,
        terminalDelayMs: options.terminalDelayMs ?? 350,
      }),
    ]),
  )
  const runtime = createRuntime({ resolveProvider: (providerId) => registrations.get(providerId) })
  const conversations: MultipleConversationsDemoItem[] = []

  for (const definition of definitions) {
    const conversation = runtime.createConversation()
    await conversation.send({
      providerId: definition.providerId,
      modelId: definition.modelId,
      content: definition.question,
    })

    const run = selectConversation(runtime.getSnapshot(), conversation.id)?.turns.at(-1)?.selectedRun
    const answer = run?.outputMessages
      .find(({ role }) => role === 'assistant')
      ?.parts.filter(({ kind }) => kind === 'text')
      .map(({ content }) => content ?? '')
      .join('')
    if (answer === undefined) throw new Error(`Demo did not produce an answer for ${definition.label}`)

    conversations.push({
      id: conversation.id,
      label: definition.label,
      question: definition.question,
      answer,
    })
  }

  return { snapshot: runtime.getSnapshot(), conversations }
}
