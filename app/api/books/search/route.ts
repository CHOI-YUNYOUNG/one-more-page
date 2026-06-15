import { NextRequest, NextResponse } from 'next/server'
import { aladinFetch, parseAladinResponse } from '@/lib/aladin'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

  const ttbKey = process.env.ALADIN_TTB_KEY
  const url = new URL('https://www.aladin.co.kr/ttb/api/ItemSearch.aspx')
  url.searchParams.set('TTBKey', ttbKey!)
  url.searchParams.set('Query', query)
  url.searchParams.set('QueryType', 'Keyword')
  url.searchParams.set('MaxResults', '20')
  url.searchParams.set('start', '1')
  url.searchParams.set('SearchTarget', 'Book')
  url.searchParams.set('output', 'js')
  url.searchParams.set('Version', '20131101')
  url.searchParams.set('Cover', 'Big')

  const text = await aladinFetch(url)
  return NextResponse.json(parseAladinResponse(text))
}
