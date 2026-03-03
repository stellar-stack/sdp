import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useToggleJoin } from '@/queries/communities.queries'
import { cn, formatCount } from '@/lib/utils'
import type { CommunityList } from '@/types'

interface CommunityCardProps {
  community: CommunityList
}

const bannerGradients = [
  'linear-gradient(135deg, #1e3a5f 0%, #0f2035 100%)',
  'linear-gradient(135deg, #2d1b4e 0%, #1a0d30 100%)',
  'linear-gradient(135deg, #3d2200 0%, #1f1100 100%)',
  'linear-gradient(135deg, #0d2b1a 0%, #061508 100%)',
  'linear-gradient(135deg, #3d0d1a 0%, #200008 100%)',
  'linear-gradient(135deg, #1a1f4e 0%, #0a0d28 100%)',
]

const iconColors = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#00ff84', '#f43f5e', '#6366f1',
]

function getIndex(name: string) {
  return name.charCodeAt(0) % bannerGradients.length
}

export function CommunityCard({ community }: CommunityCardProps) {
  const { mutate: toggleJoin, isPending } = useToggleJoin(community.id)
  const idx = getIndex(community.name)

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 bg-bg-card border border-border'
      )}
    >
      {/* Banner */}
      <div
        className="h-20 w-full flex items-center justify-center"
        style={{ background: bannerGradients[idx] }}
      >
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg"
          style={{ background: 'rgba(0,0,0,0.35)', color: iconColors[idx], border: `1px solid ${iconColors[idx]}40` }}
        >
          {community.name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/communities/${community.id}`}>
            <h3 className="font-bold text-text-primary text-sm leading-tight hover:text-accent transition-colors">
              {community.name}
            </h3>
          </Link>
          <button
            onClick={() => toggleJoin()}
            disabled={isPending}
            className={cn(
              'shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95',
              community.is_member
                ? 'text-text-muted border border-border hover:border-danger/40 hover:text-danger'
                : 'hover:-translate-y-0.5'
            )}
            style={
              community.is_member
                ? { background: 'transparent' }
                : { background: 'rgb(var(--color-accent) / 0.12)', color: 'rgb(var(--color-accent))', border: '1px solid rgb(var(--color-accent) / 0.3)' }
            }
          >
            {isPending ? '…' : community.is_member ? 'Leave' : 'Join'}
          </button>
        </div>

        {community.about && (
          <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">{community.about}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Users size={11} />
          <span>{formatCount(community.members_count)} members</span>
        </div>
      </div>
    </div>
  )
}
