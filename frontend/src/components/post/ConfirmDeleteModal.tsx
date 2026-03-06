import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '@/store/ui.store'
import { useDeletePost, useDeleteComment } from '@/queries/posts.queries'

interface DeleteModalData {
  type: 'post' | 'comment'
  id: number
  postId?: number
}

export function ConfirmDeleteModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  const data = modalData as DeleteModalData | null
  const isOpen = activeModal === 'confirm-delete' && !!data

  const { mutate: deletePost, isPending: isDeletingPost } = useDeletePost()
  const { mutate: deleteComment, isPending: isDeletingComment } = useDeleteComment(data?.postId ?? 0)

  const isPending = isDeletingPost || isDeletingComment
  const label = data?.type === 'post' ? 'post' : 'comment'

  const handleConfirm = () => {
    if (!data) return

    if (data.type === 'post') {
      deletePost(data.id, {
        onSuccess: () => {
          toast.success('Post deleted')
          closeModal()
          if (location.pathname === `/post/${data.id}`) {
            navigate(-1)
          }
        },
        onError: () => toast.error('Failed to delete post'),
      })
    } else {
      deleteComment(data.id, {
        onSuccess: () => {
          toast.success('Comment deleted')
          closeModal()
        },
        onError: () => toast.error('Failed to delete comment'),
      })
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => { if (!o && !isPending) closeModal() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{ x: '-50%', y: '-50%' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm rounded-2xl border border-border bg-bg-card p-6 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
                <AlertTriangle size={22} className="text-danger" />
              </div>

              <div>
                <Dialog.Title className="text-base font-semibold text-text-primary">
                  Delete {label}?
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm text-text-muted leading-relaxed">
                  This action cannot be undone. The {label} will be permanently removed.
                </Dialog.Description>
              </div>

              <div className="flex w-full gap-3 pt-1">
                <button
                  onClick={closeModal}
                  disabled={isPending}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
