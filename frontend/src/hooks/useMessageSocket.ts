import { useCallback } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useWebSocket } from './useWebSocket'
import { useAuthStore } from '@/store/auth.store'
import { QUERY_KEYS } from '@/queries/queryClient'
import type { WSMessage, PaginatedResponse, Message } from '@/types'

export function useMessageSocket(conversationId: number | null) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const onMessage = useCallback(
    (raw: unknown) => {
      const msg = raw as WSMessage

      // Prepend to pages[0] (newest raw page). select() reverses pages+results,
      // so the new message ends up at the bottom (newest position) in the UI.
      queryClient.setQueryData(
        QUERY_KEYS.MESSAGES(Number(msg.conversation_id)),
        (old: InfiniteData<PaginatedResponse<Message>> | undefined) => {
          if (!old) return old
          const newMessage: Message = {
            id: msg.id,
            sender: msg.sender,
            content: msg.content,
            is_read: false,
            created_at: msg.created_at,
            is_deleted: false,
          }
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === 0
                ? { ...page, results: [newMessage, ...page.results] }
                : page
            ),
          }
        }
      )

      // Move conversation to top of list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONVERSATIONS })
    },
    [queryClient]
  )

  const { sendMessage } = useWebSocket({
    url: `/ws/messages/${conversationId}/`,
    enabled: !!user && !!conversationId,
    onMessage,
  })

  return { sendMessage }
}
