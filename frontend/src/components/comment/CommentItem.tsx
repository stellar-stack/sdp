import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { UserAvatar } from '@/components/user/UserAvatar'
import { CommentInput } from './CommentInput'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import type { Comment } from '@/types'

interface CommentItemProps {
  comment: Comment
  postId: number
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  const currentUser = useAuthStore((s) => s.user)
  const { openModal } = useUIStore()

  const isOwner = currentUser?.username === comment.user.username
  const isAdminOrMod = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
  const canDelete = isOwner || isAdminOrMod

  const replyCount = comment.reply_count ?? comment.replies.length

  return (
    <div>
      {/* Main comment */}
      <div className="flex gap-2.5">
        <Link to={`/profile/${comment.user.username}`} className="shrink-0">
          <UserAvatar user={comment.user} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-bg-secondary rounded-xl px-3 py-2">
            <Link
              to={`/profile/${comment.user.username}`}
              className="font-semibold text-xs text-text-primary hover:underline"
            >
              {comment.user.first_name} {comment.user.last_name}
            </Link>
            <p className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <span className="text-xs text-text-muted">{formatDate(comment.created_at)}</span>
            <button
              onClick={() => setShowReply((s) => !s)}
              className="text-xs text-text-secondary hover:text-accent font-medium transition-colors"
            >
              Reply
            </button>
            {canDelete && (
              <button
                onClick={() => openModal('confirm-delete', { type: 'comment', id: comment.id, postId })}
                className="text-xs text-text-muted hover:text-danger transition-colors flex items-center gap-0.5"
              >
                <Trash2 size={11} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply toggle — Instagram style */}
      {replyCount > 0 && (
        <div className="mt-2 ml-11">
          <button
            onClick={() => setShowReplies((s) => !s)}
            className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className="w-5 h-px bg-text-muted inline-block" />
            {showReplies
              ? 'Hide replies'
              : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
          </button>
        </div>
      )}

      {/* Expanded replies */}
      {showReplies && comment.replies.length > 0 && (
        <div className="mt-2 ml-11 space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2.5">
              <Link to={`/profile/${reply.user.username}`} className="shrink-0">
                <UserAvatar user={reply.user} size="sm" />
              </Link>
              <div className="flex-1">
                <div className="bg-bg-secondary rounded-xl px-3 py-2">
                  <Link
                    to={`/profile/${reply.user.username}`}
                    className="font-semibold text-xs text-text-primary hover:underline"
                  >
                    {reply.user.first_name} {reply.user.last_name}
                  </Link>
                  <p className="text-sm text-text-primary mt-0.5">{reply.content}</p>
                </div>
                <span className="text-xs text-text-muted px-1 mt-1 block">
                  {formatDate(reply.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReply && (
        <div className="mt-2 ml-11">
          <CommentInput
            postId={postId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.user.first_name}…`}
            onSuccess={() => { setShowReply(false); setShowReplies(true) }}
          />
        </div>
      )}
    </div>
  )
}
