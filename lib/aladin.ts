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
