import { NextRequest } from 'next/server'
import { getClaudeClient, buildBookContext } from '@/lib/claude'
import { ChatMessage } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { title, author, description, messages, userMessage } = await req.json()
    const client = getClaudeClient()
    const bookCtx = buildBookContext(title, author, description)

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
            system: `당신은 "${title}"을 함께 읽은 독서 친구입니다. 독자와 이 책에 대해 깊이 있는 대화를 나눕니다. 공감하고, 질문하고, 다양한 관점을 제시하세요. 답변은 대화체로 자연스럽게 작성하되 반드시 완전한 문장으로 끝내세요. 무조건 독자의 의견에 동의하는 대신 주관을 가지고 토론에 임하세요. 책 배경 지식: ${bookCtx}`,
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
