import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image, Video, Type, Upload, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useUIStore } from '@/store/ui.store'
import { useCreatePost } from '@/queries/posts.queries'
import { useAuthStore } from '@/store/auth.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { extractErrorMessage } from '@/lib/utils'
import { postsApi } from '@/api'
import type { PostType } from '@/types'

const tabs: { type: PostType; icon: typeof Type; label: string }[] = [
  { type: 'TEXT', icon: Type, label: 'Text' },
  { type: 'IMAGE', icon: Image, label: 'Image' },
  { type: 'VIDEO', icon: Video, label: 'Video' },
]

export function CreatePostModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const communityId = (modalData as { communityId?: number } | null)?.communityId
  const { mutate: createPost, isPending } = useCreatePost(communityId)

  const [postType, setPostType] = useState<PostType>('TEXT')
  const [caption, setCaption] = useState('')
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<{
    suggested_caption: string | null
    suggested_community: { id: number; name: string } | null
  } | null>(null)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const [suggestedCommunityId, setSuggestedCommunityId] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { getRootProps, getInputProps } = useDropzone({
    accept: postType === 'IMAGE' ? { 'image/*': [] } : { 'video/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      if (!file) return
      setMediaFile(file)
      setMediaPreview(URL.createObjectURL(file))
    },
  })

  // Debounced AI suggestion (600ms after user stops typing)
  useEffect(() => {
    if (suggestionDismissed) return
    const combined = (caption + ' ' + content).trim()
    if (combined.length < 20) {
      setSuggestion(null)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSuggestionLoading(true)
      try {
        const result = await postsApi.getSuggestion({ content, caption })
        setSuggestion(result)
      } catch {
        // silently fail — suggestions are optional
      } finally {
        setSuggestionLoading(false)
      }
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [content, caption, suggestionDismissed])

  const handleClose = () => {
    closeModal()
    setCaption('')
    setContent('')
    setMediaFile(null)
    setMediaPreview(null)
    setPostType('TEXT')
    setSuggestion(null)
    setSuggestionDismissed(false)
    setSuggestedCommunityId(null)
  }

  const handleSubmit = () => {
    if (postType === 'TEXT' && !content.trim() && !caption.trim()) {
      toast.error('Write something to post')
      return
    }
    if ((postType === 'IMAGE' || postType === 'VIDEO') && !mediaFile) {
      toast.error(`Please select a ${postType.toLowerCase()} file`)
      return
    }

    const effectiveCommunityId = communityId ?? suggestedCommunityId ?? undefined
    createPost(
      {
        post_type: postType,
        caption: caption.trim() || undefined,
        content: postType === 'TEXT' ? content.trim() : undefined,
        image: postType === 'IMAGE' ? mediaFile! : undefined,
        video: postType === 'VIDEO' ? mediaFile! : undefined,
        community: effectiveCommunityId,
      },
      {
        onSuccess: () => {
          toast.success('Post created!')
          handleClose()
        },
        onError: (err) => {
          const msg = extractErrorMessage(err)
          const is451 = (err as { response?: { status?: number } }).response?.status === 451
          if (is451) toast.error(`Post removed: ${msg}`)
          else toast.error(msg)
        },
      }
    )
  }

  return (
    <Dialog.Root open={activeModal === 'create-post'} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ x: '-50%', y: '-50%' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg rounded-2xl border border-border bg-bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Dialog.Title className="font-semibold text-text-primary">
                {communityId ? 'Post to Community' : 'Create Post'}
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
                <X size={18} />
              </Dialog.Close>
            </div>

            <div className="p-5 space-y-4">
              {/* User info */}
              {user && (
                <div className="flex items-center gap-2.5">
                  <UserAvatar user={user} size="md" />
                  <div>
                    <p className="font-medium text-sm text-text-primary">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-text-muted">@{user.username}</p>
                  </div>
                </div>
              )}

              {/* Type tabs */}
              <div className="flex gap-1 rounded-xl bg-bg-secondary p-1">
                {tabs.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => { setPostType(type); setMediaFile(null); setMediaPreview(null) }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      postType === type
                        ? 'bg-bg-card text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Caption */}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
                maxLength={255}
                rows={1}
                className="input-base resize-none text-sm"
              />

              {/* Content (text only) */}
              {postType === 'TEXT' && (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  className="input-base resize-none text-sm"
                />
              )}

              {/* AI Suggestion panel */}
              <AnimatePresence>
                {(suggestionLoading || (suggestion && !suggestionDismissed && (suggestion.suggested_caption || suggestion.suggested_community))) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border p-3 space-y-2"
                    style={{ background: 'rgb(var(--color-accent) / 0.05)', borderColor: 'rgb(var(--color-accent) / 0.2)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-accent" />
                        <span className="text-xs font-semibold text-accent">
                          AI Suggestion
                        </span>
                      </div>
                      {!suggestionLoading && (
                        <button
                          onClick={() => { setSuggestionDismissed(true); setSuggestion(null) }}
                          className="text-text-muted hover:text-text-secondary transition-colors"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {suggestionLoading ? (
                      <div className="space-y-1.5">
                        <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'rgb(var(--color-accent) / 0.15)' }} />
                        <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'rgb(var(--color-accent) / 0.1)' }} />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {suggestion?.suggested_caption && (
                          <div>
                            <p className="text-xs text-text-muted mb-1">Suggested caption:</p>
                            <button
                              onClick={() => setCaption(suggestion.suggested_caption!)}
                              className="text-xs text-left rounded-lg px-2.5 py-1.5 w-full text-text-secondary hover:text-text-primary transition-colors"
                              style={{ background: 'rgb(var(--color-accent) / 0.08)' }}
                            >
                              "{suggestion.suggested_caption}"
                              <span className="ml-1.5 text-[10px] text-accent">
                                click to apply
                              </span>
                            </button>
                          </div>
                        )}
                        {suggestion?.suggested_community && !communityId && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-text-muted">Best community:</p>
                            <button
                              onClick={() => setSuggestedCommunityId(
                                suggestedCommunityId === suggestion.suggested_community!.id
                                  ? null
                                  : suggestion.suggested_community!.id
                              )}
                              className="text-xs font-medium px-2 py-0.5 rounded-full transition-all"
                              style={
                                suggestedCommunityId === suggestion.suggested_community.id
                                  ? { background: 'rgb(var(--color-accent))', color: '#0e0e0e' }
                                  : { background: 'rgb(var(--color-accent) / 0.12)', color: 'rgb(var(--color-accent))' }
                              }
                            >
                              {suggestedCommunityId === suggestion.suggested_community.id ? '✓ ' : ''}{suggestion.suggested_community.name}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Media dropzone */}
              {(postType === 'IMAGE' || postType === 'VIDEO') && (
                <div>
                  {mediaPreview ? (
                    <div className="relative">
                      {postType === 'IMAGE' ? (
                        <img
                          src={mediaPreview}
                          alt="preview"
                          className="w-full max-h-60 object-cover rounded-xl border border-border"
                        />
                      ) : (
                        <video
                          src={mediaPreview}
                          controls
                          className="w-full max-h-60 rounded-xl border border-border"
                        />
                      )}
                      <button
                        onClick={() => { setMediaFile(null); setMediaPreview(null) }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className="cursor-pointer flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-text-muted hover:border-accent hover:text-accent transition-colors"
                    >
                      <input {...getInputProps()} />
                      <Upload size={24} />
                      <p className="text-sm">
                        Drop {postType === 'IMAGE' ? 'an image' : 'a video'} here or click to browse
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
              <button onClick={handleClose} className="btn-secondary">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="btn-primary flex items-center gap-2"
              >
                {isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {isPending ? 'Posting…' : 'Post'}
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
