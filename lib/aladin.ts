export async function aladinFetch(url: URL): Promise<string> {
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Aladin API error: ${res.status}`)
  return res.text()
}

export function parseAladinResponse(raw: string) {
  const cleaned = raw.replace(/^[^{]*/, '').replace(/[^}]*$/, '')
  return JSON.parse(cleaned)
}

export type AladinBook = {
  isbn: string
  isbn13: string
  title: string
  author: string
  publisher: string
  cover: string
  description: string
  categoryName: string
  pubDate: string
  link: string
}

export type AladinSearchResponse = {
  item: AladinBook[]
  totalResults: number
}

// ItemSearch.aspx(목록 검색)는 페이지 수를 내려주지 않는다.
// ItemLookUp.aspx(단건 조회) + OptResult=subInfo 로 조회해야 subInfo.itemPage를 얻을 수 있다.
export async function fetchItemPage(isbn13: string): Promise<number | null> {
  const ttbKey = process.env.ALADIN_TTB_KEY
  const url = new URL('https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx')
  url.searchParams.set('TTBKey', ttbKey!)
  url.searchParams.set('ItemId', isbn13)
  url.searchParams.set('ItemIdType', 'ISBN13')
  url.searchParams.set('output', 'js')
  url.searchParams.set('Version', '20131101')
  url.searchParams.set('OptResult', 'subInfo')

  const text = await aladinFetch(url)
  const data = parseAladinResponse(text)
  const page = data?.item?.[0]?.subInfo?.itemPage
  return typeof page === 'number' && page > 0 ? page : null
}
