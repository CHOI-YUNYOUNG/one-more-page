'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase, ChatMessage, Book } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

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
  const [conversationId, setConversationId] = useState<string | null>(null)
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
    })()
  }, [userId, book.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let aiContent = ''

    const aiMsg: ChatMessage = {
      role: 'model',
      content: '',
      created_at: new Date().toISOString(),
    }
    const withAi = [...newMessages, aiMsg]
    setMessages(withAi)

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      aiContent += decoder.decode(value)
      setMessages([...newMessages, { ...aiMsg, content: aiContent }])
    }

    const finalMessages = [...newMessages, { ...aiMsg, content: aiContent }]

    if (conversationId) {
      await supabase
        .from('ai_conversations')
        .update({ messages: finalMessages, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    } else {
      const { data } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, book_id: book.id, messages: finalMessages })
        .select()
        .single()
      if (data) setConversationId(data.id)
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
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
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-2 shrink-0 mt-1">
                  📖
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
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
    </div>
  )
}
