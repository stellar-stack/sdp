import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Search } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useCommunitiesQuery } from '@/queries/communities.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { CommunityCard } from '@/components/community/CommunityCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

const FILTERS = [
  'All',
  'Python',
  'Java',
  'C++',
  'Cybersecurity',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Cloud Computing',
  'Web Development',
  'Blockchain',
]

export default function CommunitiesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommunitiesQuery()
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const communities = (data?.pages.flatMap((p) => p.results) ?? []).filter((c) => {
    const matchesSearch = search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
    const matchesFilter = activeFilter === 'All' || c.name.toLowerCase().includes(activeFilter.toLowerCase())
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Communities</h1>
          <p className="text-xs text-text-muted mt-0.5">Join communities to learn and share together</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/communities/create')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 active:scale-95 bg-accent"
            style={{ color: '#0e0e0e', boxShadow: '0 4px 12px rgb(var(--color-accent) / 0.25)' }}
          >
            <Plus size={15} /> Create
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities…"
          className="input-base pl-10 py-2.5"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {FILTERS.map((f) => {
          const active = activeFilter === f
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95"
              style={
                active
                  ? { background: 'rgb(var(--color-accent))', color: '#0e0e0e', boxShadow: '0 2px 8px rgb(var(--color-accent) / 0.3)' }
                  : { background: 'rgb(var(--color-bg-card))', border: '1px solid rgb(var(--color-border))', color: 'rgb(var(--color-text-muted))' }
              }
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Loading skeletons — 2 column grid */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-bg-card border border-border">
              <Skeleton className="h-20 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && communities.length === 0 && (
        <EmptyState
          icon={Users}
          title="No communities found"
          description={isAdmin ? 'Create one to get started!' : 'No communities exist yet.'}
          action={
            isAdmin ? (
              <button onClick={() => navigate('/communities/create')} className="btn-primary">
                Create Community
              </button>
            ) : undefined
          }
        />
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {communities.map((community) => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-bg-card border border-border">
              <Skeleton className="h-20 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
