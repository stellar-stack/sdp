import { Plus, Newspaper } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFeedQuery } from '@/queries/posts.queries'
import { useUIStore } from '@/store/ui.store'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeleton } from '@/components/post/PostSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Link } from 'react-router-dom'

export default function FeedPage() {
  const { openModal } = useUIStore()
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedQuery()

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const posts = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Your Feed</h1>
          <p className="text-xs text-text-muted mt-0.5">Posts from communities you follow</p>
        </div>
        {/* Desktop create button */}
        <button
          onClick={() => openModal('create-post')}
          className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 active:scale-95"
          style={{ background: '#00ff84', color: '#0e0e0e', boxShadow: '0 4px 12px rgba(0,255,132,0.25)' }}
        >
          <Plus size={15} />
          New Post
        </button>
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="Your feed is empty"
          description="Join communities to see posts from people who share your interests."
          action={
            <Link to="/communities" className="btn-gradient text-sm">
              Browse Communities
            </Link>
          }
        />
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="space-y-4">
          {[1, 2].map((i) => <PostSkeleton key={i} />)}
        </div>
      )}

      {/* FAB — mobile only */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.08 }}
        onClick={() => openModal('create-post')}
        className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full flex items-center justify-center lg:hidden"
        style={{ background: '#00ff84', boxShadow: '0 4px 24px rgba(0,255,132,0.5)' }}
        aria-label="Create post"
      >
        <Plus size={24} style={{ color: '#0e0e0e' }} strokeWidth={2.5} />
      </motion.button>
    </div>
  )
}
