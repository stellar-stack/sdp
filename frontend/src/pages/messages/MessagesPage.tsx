import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConversationsQuery, useSendMessage } from '@/queries/messages.queries'
import { useSearchUsers } from '@/queries/auth.queries'
import { useDebounce } from '@/hooks/useDebounce'
import { UserAvatar } from '@/components/user/UserAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { isToday, isYesterday, format, formatDistanceToNow } from 'date-fns'

function formatConvTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: false }).replace('about ', '')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useConversationsQuery()
  const { mutate: sendMessage, isPending: starting } = useSendMessage()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const { data: searchResults } = useSearchUsers(debouncedSearch)

  const conversations = data?.results ?? []

  const startConversation = (username: string) => {
    sendMessage(
      { recipient: username, content: '👋' },
      {
        onSuccess: (data) => {
          setSearch('')
          navigate(`/messages/${data.conversation_id}`)
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Messages</h1>
        {conversations.length > 0 && (
          <span className="text-xs text-text-muted bg-bg-secondary px-2.5 py-1 rounded-full">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Search to start new conversation */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users to message…"
          className="input-base pl-9 pr-9 text-sm"
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {search.length >= 2 && (searchResults ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="card overflow-hidden divide-y divide-border"
          >
            {(searchResults ?? []).slice(0, 5).map((user) => (
              <button
                key={user.id}
                onClick={() => startConversation(user.username)}
                disabled={starting}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-surface-hover transition-colors text-left"
              >
                <UserAvatar user={user} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-text-muted">@{user.username}</p>
                </div>
                <span className="text-xs text-accent shrink-0">Message</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversations list */}
      <div className="card overflow-hidden">
        {isLoading && (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Search for someone above to start chatting"
          />
        )}

        {!isLoading && conversations.length > 0 && (
          <div className="divide-y divide-border">
            {conversations.map((conv) => {
              const hasUnread = conv.unread_count > 0
              const lastMsgPreview = conv.last_message
                ? conv.last_message.is_deleted
                  ? 'Message deleted'
                  : conv.last_message.content
                : 'Start chatting'

              return (
                <motion.button
                  key={conv.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    <UserAvatar user={conv.other_user} size="md" />
                    {hasUnread && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-bg-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        'text-sm truncate',
                        hasUnread ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'
                      )}>
                        {conv.other_user.first_name} {conv.other_user.last_name}
                      </p>
                      {conv.last_message && (
                        <span className={cn(
                          'text-[11px] shrink-0',
                          hasUnread ? 'text-accent font-medium' : 'text-text-muted'
                        )}>
                          {formatConvTime(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn(
                        'text-xs truncate',
                        conv.last_message?.is_deleted
                          ? 'italic text-text-muted'
                          : hasUnread
                          ? 'text-text-primary'
                          : 'text-text-muted'
                      )}>
                        {lastMsgPreview}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
