import { NextResponse } from 'next/server'
import { aladinFetch, parseAladinResponse } from '@/lib/aladin'

function buildListUrl(queryType: string, ttbKey: string) {
  const url = new URL('https://www.aladin.co.kr/ttb/api/ItemList.aspx')
  url.searchParams.set('TTBKey', ttbKey)
  url.searchParams.set('QueryType', queryType)
  url.searchParams.set('MaxResults', '10')
  url.searchParams.set('start', '1')
  url.searchParams.set('SearchTarget', 'Book')
  url.searchParams.set('output', 'js')
  url.searchParams.set('Version', '20131101')
  url.searchParams.set('Cover', 'Big')
  return url
}

const CACHE_TTL_MS = 30 * 60 * 1000 // 30분

let cachedData: { bestseller: unknown[]; recommended: unknown[] } | null = null
let cacheExpiresAt = 0

export async function GET() {
  const now = Date.now()
  if (cachedData && now < cacheExpiresAt) {
    return NextResponse.json(cachedData)
  }

  const ttbKey = process.env.ALADIN_TTB_KEY!

  const [bestsellerText, blogBestText] = await Promise.all([
    aladinFetch(buildListUrl('Bestseller', ttbKey)),
    aladinFetch(buildListUrl('BlogBest', ttbKey)),
  ])

  cachedData = {
    bestseller: parseAladinResponse(bestsellerText).item ?? [],
    recommended: parseAladinResponse(blogBestText).item ?? [],
  }
  cacheExpiresAt = now + CACHE_TTL_MS

  return NextResponse.json(cachedData)
}
