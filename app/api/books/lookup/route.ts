import { NextRequest, NextResponse } from 'next/server'
import { fetchItemPage } from '@/lib/aladin'

export async function GET(req: NextRequest) {
  const isbn13 = req.nextUrl.searchParams.get('isbn13')
  if (!isbn13) return NextResponse.json({ error: 'isbn13 required' }, { status: 400 })

  try {
    const itemPage = await fetchItemPage(isbn13)
    return NextResponse.json({ itemPage })
  } catch {
    return NextResponse.json({ itemPage: null })
  }
}
