'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase, Highlight } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

export function HighlightForm({
  bookId,
  highlights,
  onAdded,
}: {
  bookId: string
  highlights: Highlight[]
  onAdded: () => void
}) {
  const userId = useUser()
  const [content, setContent] = useState('')
  const [note, setNote] = useState('')
  const [page, setPage] = useState('')
  const [loading, setLoading] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editPage, setEditPage] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !userId) return
    setLoading(true)

    const { error } = await supabase.from('highlights').insert({
      user_id: userId,
      book_id: bookId,
      content: content.trim(),
      note: note.trim() || null,
      page_number: page ? parseInt(page) : null,
    })

    if (error) {
      toast.error('저장에 실패했습니다.')
    } else {
      toast.success('하이라이트가 저장되었습니다.')
      setContent('')
      setNote('')
      setPage('')
      onAdded()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('highlights').delete().eq('id', id)
    toast.success('삭제되었습니다.')
    onAdded()
  }

  const startEdit = (h: Highlight) => {
    setEditingId(h.id)
    setEditContent(h.content)
    setEditNote(h.note ?? '')
    setEditPage(h.page_number ? String(h.page_number) : '')
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return
    setEditLoading(true)
    const { error } = await supabase
      .from('highlights')
      .update({
        content: editContent.trim(),
        note: editNote.trim() || null,
        page_number: editPage ? parseInt(editPage) : null,
      })
      .eq('id', id)

    if (error) {
      toast.error('수정에 실패했습니다.')
    } else {
      toast.success('수정되었습니다.')
      setEditingId(null)
      onAdded()
    }
    setEditLoading(false)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex gap-2">
          <Input
            placeholder="페이지 번호"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            type="number"
            className="w-28"
          />
        </div>
        <Textarea
          placeholder="인상 깊은 구절을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          required
        />
        <Textarea
          placeholder="나의 감상 (선택)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
        <Button type="submit" size="sm" disabled={loading || !content.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          추가하기
        </Button>
      </form>

      <div className="space-y-3">
        {highlights.map((h) => (
          <div key={h.id} className="p-4 border rounded-lg space-y-2 relative group">
            {editingId === h.id ? (
              <div className="space-y-2">
                <Input
                  placeholder="페이지 번호"
                  value={editPage}
                  onChange={(e) => setEditPage(e.target.value)}
                  type="number"
                  className="w-28 h-7 text-xs"
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <Textarea
                  placeholder="나의 감상 (선택)"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveEdit(h.id)}
                    disabled={editLoading || !editContent.trim()}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    저장
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit} disabled={editLoading}>
                    <X className="h-3 w-3 mr-1" />
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <blockquote className="text-sm italic text-foreground/80 flex-1">
                    {h.page_number && (
                      <span className="text-xs font-medium text-primary mr-2 not-italic">
                        p.{h.page_number}
                      </span>
                    )}
                    {h.content}
                  </blockquote>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => startEdit(h)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleDelete(h.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {h.note && (
                  <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                    {h.note}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
