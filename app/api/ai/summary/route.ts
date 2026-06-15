import { NextRequest, NextResponse } from 'next/server'
import { getGeminiModel, buildBookContext } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const { title, author, description, totalPages } = await req.json()

  const model = getGeminiModel()
  const bookCtx = buildBookContext(title, author, description)

  const prompt = `당신은 독서 전문가이자 친근한 독서 멘토입니다.
아래 책에 대해 다음 두 가지를 JSON 형식으로 작성해주세요.

${bookCtx}
총 페이지: ${totalPages || '미상'}

응답 형식 (순수 JSON만, 마크다운 코드블록 없이):
{
  "summary": "책의 핵심 내용을 3~5문장으로 요약. 독자가 이 책을 읽고 싶게 만드는 매력적인 문장으로.",
  "reading_plan": {
    "daily_minutes": 독서에 권장하는 하루 분 수(숫자),
    "weeks": [
      {
        "week": 1,
        "pages": "1~100",
        "goal": "이번 주 독서 목표 한 문장",
        "tips": ["독서 팁1", "독서 팁2"]
      }
    ],
    "questions": ["읽으면서 생각해볼 질문1", "질문2", "질문3", "질문4", "질문5"]
  }
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 })

  const parsed = JSON.parse(jsonMatch[0])
  return NextResponse.json(parsed)
}
