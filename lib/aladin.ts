import https from 'node:https'

export function aladinFetch(url: URL): Promise<string> {
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
  itemPage: number
  link: string
}

export type AladinSearchResponse = {
  item: AladinBook[]
  totalResults: number
}
