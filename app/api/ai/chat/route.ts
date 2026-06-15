import { NextRequest } from 'next/server'
import { getGeminiModel, buildBookContext } from '@/lib/gemini'
import { ChatMessage } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { title, author, description, messages, userMessage } = await req.json()

  const model = getGeminiModel()
  const bookCtx = buildBookContext(title, author, description)

  const systemInstruction = `당신은 "${title}"을 함께 읽은 독서 친구입니다.
독자와 이 책에 대해 깊이 있는 대화를 나눕니다.
공감하고, 질문하고, 다양한 관점을 제시하세요.
답변은 짧고 대화체로, 150자 이내로 유지하세요.
책에 대한 배경 지식: ${bookCtx}`

  const history = (messages as ChatMessage[]).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemInstruction }] },
      { role: 'model', parts: [{ text: `안녕하세요! 저도 "${title}" 읽었어요. 함께 이야기 나눠봐요 😊` }] },
      ...history,
    ],
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const result = await chat.sendMessageStream(userMessage)
      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
