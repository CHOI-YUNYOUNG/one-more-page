import { NextRequest } from 'next/server'
import { getClaudeClient, buildBookContext, buildChatSystemPrompt } from '@/lib/claude'
import { ChatMessage } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { title, author, description, messages, userMessage } = await req.json()
    const client = getClaudeClient()
    const bookCtx = buildBookContext(title, author, description)
    const systemPrompt = buildChatSystemPrompt(title, bookCtx)

    const recentMessages = (messages as ChatMessage[]).slice(-10)
    const history = recentMessages.map((m) => ({
      role: m.role === 'model' ? 'assistant' : 'user' as 'user' | 'assistant',
      content: m.content,
    }))

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
              ...history,
              { role: 'user', content: userMessage },
            ],
            stream: true,
          })

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'AI 오류'
          controller.enqueue(encoder.encode(`[오류: ${msg}]`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[chat] error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : '채팅 실패' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
