import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Trash2, Smile } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { isToday, isYesterday, format, isSameDay } from 'date-fns'
import { useConversationsQuery, useMessagesQuery, useDeleteMessage } from '@/queries/messages.queries'
import { useMessageSocket } from '@/hooks/useMessageSocket'
import { useAuthStore } from '@/store/auth.store'
import { useMessageStore } from '@/store/message.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

// ── Date separator label ─────────────────────────────────────────────────────
function dateSeparatorLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] font-medium text-text-muted shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ── Single message bubble ────────────────────────────────────────────────────
interface BubbleProps {
  msg: Message
  isOwn: boolean
  isGrouped: boolean   // consecutive msg from same sender (smaller gap, no avatar re-show)
  isLast: boolean      // last in a consecutive group → show avatar
  onDelete?: () => void
}

function MessageBubble({ msg, isOwn, isGrouped, isLast, onDelete }: BubbleProps) {
  const time = format(new Date(msg.created_at), 'h:mm a')

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'flex gap-2 items-end',
        isOwn ? 'flex-row-reverse' : '',
        isGrouped ? 'mt-0.5' : 'mt-3'
      )}
    >
      {/* Avatar placeholder – keeps alignment consistent */}
      <div className="w-8 shrink-0">
        {!isOwn && isLast && (
          <UserAvatar user={msg.sender} size="sm" />
        )}
      </div>

      <div className={cn('group flex flex-col gap-0.5 max-w-[72%]', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed select-text',
            isOwn
              ? 'text-white rounded-br-sm'
              : 'bg-bg-secondary text-text-primary rounded-bl-sm',
            msg.is_deleted && 'opacity-50 italic',
          )}
          style={isOwn && !msg.is_deleted ? {
            background: 'linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent) / 0.8))',
          } : {}}
        >
          {msg.is_deleted ? (
            <span className="text-xs">Message deleted</span>
          ) : (
            msg.content
          )}
        </div>

        {/* Timestamp + delete (show on group-hover) */}
        <div className={cn(
          'flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          isOwn ? 'flex-row-reverse' : ''
        )}>
          <span className="text-[10px] text-text-muted">{time}</span>
          {isOwn && !msg.is_deleted && onDelete && (
            <button
              onClick={onDelete}
              className="text-text-muted hover:text-danger transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const convId = Number(conversationId)
  const currentUser = useAuthStore((s) => s.user)
  const { clearConversationUnread } = useMessageStore()

  const { data: convData } = useConversationsQuery()
  const conversation = convData?.results.find((c) => c.id === convId)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessagesQuery(convId)
  const { mutate: deleteMessage } = useDeleteMessage()
  const { sendMessage } = useMessageSocket(convId)

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const messages = data?.pages.flatMap((p) => p.results) ?? []

  useEffect(() => {
    clearConversationUnread(convId)
    return () => clearConversationUnread(convId)
  }, [convId, clearConversationUnread])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage({ content: text })
    setInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, 120)}px`
  }

  // Build render list with date separators interspersed
  type RenderItem =
    | { kind: 'separator'; key: string; label: string }
    | { kind: 'message'; key: string; msg: Message; isGrouped: boolean; isLast: boolean }

  const renderItems: RenderItem[] = []
  messages.forEach((msg, idx) => {
    const prev = messages[idx - 1]
    const next = messages[idx + 1]

    // Date separator when day changes
    if (!prev || !isSameDay(new Date(msg.created_at), new Date(prev.created_at))) {
      renderItems.push({
        kind: 'separator',
        key: `sep-${msg.created_at}`,
        label: dateSeparatorLabel(msg.created_at),
      })
    }

    const sameAsPrev = !!prev && prev.sender.id === msg.sender.id
    const sameAsNext = !!next && next.sender.id === msg.sender.id
    const isOwn = msg.sender.id === currentUser?.id

    renderItems.push({
      kind: 'message',
      key: String(msg.id),
      msg,
      isGrouped: sameAsPrev,
      isLast: !sameAsNext,
    })
    void isOwn
  })

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
        <Link
          to="/messages"
          className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>

        {conversation ? (
          <Link
            to={`/profile/${conversation.other_user.username}`}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <UserAvatar user={conversation.other_user} size="md" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-bg-base" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm leading-tight">
                {conversation.other_user.first_name} {conversation.other_user.last_name}
              </p>
              <p className="text-xs text-text-muted">@{conversation.other_user.username}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        )}
      </div>

      {/* ── Messages list ── */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {/* Load older messages button */}
        <AnimatePresence>
          {hasNextPage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-3"
            >
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs text-text-muted hover:text-accent border border-border rounded-full px-4 py-1.5 transition-colors hover:border-accent"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load older messages'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'flex-row-reverse' : '')}>
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-44' : 'w-52')} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            {conversation && (
              <UserAvatar user={conversation.other_user} size="lg" />
            )}
            <div>
              <p className="font-semibold text-text-primary text-sm">
                {conversation
                  ? `${conversation.other_user.first_name} ${conversation.other_user.last_name}`
                  : ''}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Start the conversation — say hello!
              </p>
            </div>
          </div>
        )}

        {/* Render messages with date separators */}
        <div className="px-1 pb-2">
          {renderItems.map((item) => {
            if (item.kind === 'separator') {
              return <DateSeparator key={item.key} label={item.label} />
            }
            const isOwn = item.msg.sender.id === currentUser?.id
            return (
              <MessageBubble
                key={item.key}
                msg={item.msg}
                isOwn={isOwn}
                isGrouped={item.isGrouped}
                isLast={item.isLast}
                onDelete={isOwn ? () => deleteMessage(item.msg.id) : undefined}
              />
            )
          })}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="pt-4 border-t border-border shrink-0">
        <div className="flex items-end gap-2 bg-bg-secondary rounded-2xl px-4 py-3 border border-border focus-within:border-accent/50 transition-colors">
          <button className="text-text-muted hover:text-accent transition-colors shrink-0 mb-0.5">
            <Smile size={18} />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Type a message…"
            rows={1}
            maxLength={5000}
            className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder-text-muted outline-none leading-relaxed"
            style={{ maxHeight: '120px' }}
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              'shrink-0 p-2 rounded-xl transition-all',
              input.trim()
                ? 'text-white shadow-md'
                : 'text-text-muted bg-bg-elevated'
            )}
            style={input.trim() ? {
              background: 'linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent) / 0.8))',
            } : {}}
          >
            <Send size={16} />
          </motion.button>
        </div>
        {input.length > 4500 && (
          <p className="text-[10px] text-text-muted text-right mt-1 pr-1">
            {5000 - input.length} chars left
          </p>
        )}
      </div>
    </div>
  )
}
