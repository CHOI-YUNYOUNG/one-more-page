import { NextRequest, NextResponse } from 'next/server'
import https from 'node:https'

function httpsGet(url: URL): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(
      { hostname: url.hostname, path: url.pathname + url.search, rejectUnauthorized: false },
      (res) => {
        let body = ''
        res.on('data', (chunk: Buffer) => (body += chunk.toString()))
        res.on('end', () => resolve(body))
        res.on('error', reject)
      }
    ).on('error', reject)
  })
}

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

  const text = await httpsGet(url)

  const cleaned = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '')
  const data = JSON.parse(cleaned)

  return NextResponse.json(data)
}
