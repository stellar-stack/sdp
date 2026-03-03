import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Share2, Bookmark, BookmarkCheck,
  MoreHorizontal, Edit, Trash2, Flag,
  Copy, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { useToggleReaction, useToggleBookmark, useDeletePost, useSharePost } from '@/queries/posts.queries'
import { useUIStore } from '@/store/ui.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { cn, formatDate, formatCount } from '@/lib/utils'
import type { Post } from '@/types'

interface PostCardProps {
  post: Post
}

const menuVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
}

export function PostCard({ post }: PostCardProps) {
  const currentUser = useAuthStore((s) => s.user)
  const { openModal } = useUIStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  const { mutate: toggleReaction } = useToggleReaction(post.id)
  const { mutate: toggleBookmark } = useToggleBookmark()
  const { mutate: sharePost } = useSharePost()
  const { mutate: deletePost } = useDeletePost()

  const isOwner = currentUser?.username === post.user.username
  const isAdminOrMod = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
  const isLiked = post.user_reaction === 'LIKE'

  useEffect(() => {
    if (!showShareMenu) return
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShareMenu])

  const handleLike = () => toggleReaction(isLiked ? null : 'LIKE')

  const shareUrl = `${window.location.origin}/post/${post.id}`
  const shareText = post.caption ? `${post.caption} — ` : ''

  const handleShareOption = (action: 'whatsapp' | 'twitter' | 'copy') => {
    setShowShareMenu(false)
    sharePost(post.id)
    if (action === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + shareUrl)}`, '_blank', 'noopener,noreferrer')
    } else if (action === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
    } else if (action === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => toast.success('Link copied!'))
    }
  }

  const handleDelete = () => {
    if (!confirm('Delete this post?')) return
    deletePost(post.id, {
      onSuccess: () => toast.success('Post deleted'),
      onError: () => toast.error('Failed to delete post'),
    })
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 bg-bg-card border border-border"
    >
      {/* ── Header + text ── */}
      <div className="p-4 space-y-2.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <Link to={`/profile/${post.user.username}`} className="flex items-center gap-2.5 min-w-0">
            <UserAvatar user={post.user} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-text-primary hover:text-accent transition-colors leading-tight truncate">
                {post.user.first_name} {post.user.last_name}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5 flex-wrap">
                <span>@{post.user.username}</span>
                <span>·</span>
                <span>{formatDate(post.created_at)}</span>
                {post.community && post.community_id && (
                  <>
                    <span>·</span>
                    <Link
                      to={`/communities/${post.community_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold hover:opacity-80 transition-opacity"
                      style={{ background: 'rgb(var(--color-accent) / 0.12)', color: 'rgb(var(--color-accent))' }}
                    >
                      c/{post.community}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Link>

          {/* 3-dot menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-50 w-40 rounded-xl py-1 overflow-hidden border border-border bg-bg-elevated shadow-xl"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {(isOwner || isAdminOrMod) && (
                    <>
                      {isOwner && (
                        <button
                          onClick={() => { setShowMenu(false); openModal('edit-post', post) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                        >
                          <Edit size={13} /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => { setShowMenu(false); handleDelete() }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                  {!isOwner && (
                    <button
                      onClick={() => { setShowMenu(false); openModal('report', { postId: post.id }) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <Flag size={13} /> Report
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Caption + content */}
        {post.caption && (
          <p className="font-semibold text-text-primary text-sm leading-snug line-clamp-2">{post.caption}</p>
        )}
        {post.content && (
          <p className="text-text-secondary text-sm leading-[1.7] whitespace-pre-wrap line-clamp-3">
            {post.content}
          </p>
        )}
      </div>

      {/* ── Media below text ── */}
      {post.post_type === 'IMAGE' && post.image && (
        <Link to={`/post/${post.id}`} className="block">
          <img
            src={post.image}
            alt={post.caption || 'Post image'}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
        </Link>
      )}
      {post.post_type === 'VIDEO' && post.video && (
        <video
          src={post.video}
          controls
          className="w-full aspect-video bg-black"
        />
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-0.5 px-3 py-2.5 -mx-0">
        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            isLiked ? 'font-semibold' : 'text-text-muted hover:bg-bg-elevated'
          )}
          style={isLiked ? { color: 'rgb(var(--color-accent))', background: 'rgb(var(--color-accent) / 0.1)' } : {}}
        >
          <span className="text-sm font-medium">Like</span>
          {post.reactions_count > 0 && <span>{formatCount(post.reactions_count)}</span>}
        </motion.button>

        {/* Comment */}
        <Link
          to={`/post/${post.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:bg-bg-elevated transition-colors"
        >
          <MessageCircle size={15} />
          {post.comments_count > 0 && <span>{formatCount(post.comments_count)}</span>}
        </Link>

        {/* Share */}
        <div className="relative" ref={shareMenuRef}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowShareMenu((v) => !v)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
              showShareMenu ? '' : 'text-text-muted hover:bg-bg-elevated'
            )}
            style={showShareMenu ? { color: 'rgb(var(--color-accent))', background: 'rgb(var(--color-accent) / 0.1)' } : {}}
          >
            <Share2 size={15} />
            {post.shares_count > 0 && <span>{formatCount(post.shares_count)}</span>}
          </motion.button>

          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.12 }}
                className="absolute left-0 bottom-full mb-2 z-50 w-44 rounded-xl py-1 overflow-hidden bg-bg-elevated border border-border shadow-xl"
              >
                <button onClick={() => handleShareOption('whatsapp')} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors">
                  <span className="text-base leading-none">💬</span>
                  <span>WhatsApp</span>
                  <ExternalLink size={10} className="ml-auto text-text-muted" />
                </button>
                <button onClick={() => handleShareOption('twitter')} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors">
                  <span className="text-base leading-none">𝕏</span>
                  <span>Twitter / X</span>
                  <ExternalLink size={10} className="ml-auto text-text-muted" />
                </button>
                <button onClick={() => handleShareOption('copy')} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors">
                  <Copy size={13} />
                  <span>Copy Link</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bookmark */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => toggleBookmark(post.id)}
          className={cn('ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            post.is_bookmarked ? '' : 'text-text-muted hover:bg-bg-elevated'
          )}
          style={post.is_bookmarked ? { color: 'rgb(var(--color-accent))', background: 'rgb(var(--color-accent) / 0.1)' } : {}}
        >
          {post.is_bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </motion.button>
      </div>
    </motion.article>
  )
}
