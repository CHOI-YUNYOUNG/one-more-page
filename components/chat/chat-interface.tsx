'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase, ChatMessage, Book } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { Send, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function ChatInterface({
  book,
  userBookId,
}: {
  book: Book
  userBookId: string
}) {
  const userId = useUser()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', book.id)
        .single()

      if (data) {
        setMessages(data.messages)
        setConversationId(data.id)
      }
      setInitialLoading(false)
    })()
  }, [userId, book.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveMessages = async (msgs: ChatMessage[], convId: string | null) => {
    if (convId) {
      await supabase
        .from('ai_conversations')
        .update({ messages: msgs, updated_at: new Date().toISOString() })
        .eq('id', convId)
    } else {
      const { data } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, book_id: book.id, messages: msgs })
        .select()
        .single()
      if (data) setConversationId(data.id)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || !userId) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          description: book.description,
          messages,
          userMessage: userMsg.content,
        }),
      })

      if (!res.ok || !res.body) {
        toast.error('AI 응답에 실패했습니다.')
        setLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiContent = ''

      const aiMsg: ChatMessage = {
        role: 'model',
        content: '',
        created_at: new Date().toISOString(),
      }
      setMessages([...newMessages, aiMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        aiContent += decoder.decode(value)
        setMessages([...newMessages, { ...aiMsg, content: aiContent }])
      }

      const finalMessages = [...newMessages, { ...aiMsg, content: aiContent }]
      setMessages(finalMessages)
      await saveMessages(finalMessages, conversationId)
    } catch (err) {
      toast.error('오류가 발생했습니다.')
      console.error('[chat] client error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteMessage = async (index: number) => {
    const updated = messages.filter((_, i) => i !== index)
    setMessages(updated)
    setDeleteIndex(null)
    await saveMessages(updated, conversationId)
  }

  const clearAll = async () => {
    setMessages([])
    setShowClearDialog(false)
    if (conversationId) {
      await supabase
        .from('ai_conversations')
        .update({ messages: [], updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    }
    toast.success('대화가 초기화되었습니다.')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex-1 space-y-4 pr-4 pt-2">
          {/* AI 메시지 스켈레톤 */}
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0 mt-1" />
            <div className="space-y-2 max-w-[60%]">
              <div className="h-4 bg-muted animate-pulse rounded-2xl rounded-tl-sm w-48" />
              <div className="h-4 bg-muted animate-pulse rounded w-36" />
              <div className="h-3 bg-muted animate-pulse rounded w-16" />
            </div>
          </div>
          {/* 사용자 메시지 스켈레톤 */}
          <div className="flex justify-end">
            <div className="space-y-2 max-w-[60%]">
              <div className="h-4 bg-muted animate-pulse rounded-2xl rounded-tr-sm w-40" />
              <div className="h-3 bg-muted animate-pulse rounded w-12 ml-auto" />
            </div>
          </div>
          {/* AI 메시지 스켈레톤 */}
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0 mt-1" />
            <div className="space-y-2 max-w-[70%]">
              <div className="h-4 bg-muted animate-pulse rounded-2xl rounded-tl-sm w-56" />
              <div className="h-4 bg-muted animate-pulse rounded w-44" />
              <div className="h-4 bg-muted animate-pulse rounded w-32" />
              <div className="h-3 bg-muted animate-pulse rounded w-16" />
            </div>
          </div>
        </div>
        <div className="border-t pt-4 flex gap-2">
          <div className="flex-1 h-16 bg-muted animate-pulse rounded-md" />
          <div className="w-10 h-16 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {messages.length > 0 && (
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="sm" onClick={() => setShowClearDialog(true)} className="text-xs text-muted-foreground h-7">
            <Trash2 className="h-3 w-3 mr-1" />
            대화 초기화
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 pr-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12 space-y-2">
            <p className="text-4xl">💬</p>
            <p className="text-sm">AI 독서 친구와 대화를 시작해보세요!</p>
            <p className="text-xs">책에 대한 생각, 감상, 궁금한 점을 자유롭게 이야기하세요.</p>
          </div>
        )}
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex group', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-2 shrink-0 mt-1">
                  📖
                </div>
              )}
              <div className="relative max-w-[80%]">
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteIndex(i)}
                  className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.content === '' && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
                📖
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t pt-4 flex gap-2">
        <Textarea
          placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="resize-none"
          disabled={loading}
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          size="icon"
          className="h-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* 개별 메시지 삭제 확인 */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메시지를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>이 메시지가 대화 기록에서 삭제됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteIndex !== null && deleteMessage(deleteIndex)}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 전체 초기화 확인 */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대화를 초기화할까요?</AlertDialogTitle>
            <AlertDialogDescription>모든 대화 내용이 삭제되며 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={clearAll}>초기화</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
