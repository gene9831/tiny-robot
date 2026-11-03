export type BusinessRequestState = 'idle' | 'processing' | 'completed' | 'aborted' | 'error'

export interface BusinessConversation {
  readonly conversationNo: string
  readonly subject: string
  readonly updatedAt: number
}

export interface BusinessMessage {
  readonly messageNo: string
  readonly conversationNo: string
  readonly sender: 'customer' | 'assistant'
  readonly text: string
  readonly status: 'pending' | 'finished' | 'failed' | 'aborted'
  readonly errorMessage?: string
}

export interface BusinessChatSnapshot {
  readonly conversations: readonly BusinessConversation[]
  readonly messages: readonly BusinessMessage[]
  readonly activeConversationNo: string | null
  readonly requestStates: Readonly<Record<string, BusinessRequestState>>
}
