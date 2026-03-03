import { useParams, Link } from 'react-router-dom'
import { MapPin, Calendar, Edit, Users, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const communityColors = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-600',
]
function getCommunityGradient(name: string) {
  return communityColors[name.charCodeAt(0) % communityColors.length]
}

import { useUserProfile } from '@/queries/auth.queries'
import { useUserPostsQuery } from '@/queries/posts.queries'
import { useUserCommunities } from '@/queries/communities.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useAuthStore } from '@/store/auth.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { FollowButton } from '@/components/user/FollowButton'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeleton } from '@/components/post/PostSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCount } from '@/lib/utils'
import { format } from 'date-fns'
import type { UserPrivate } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const { data: profile, isLoading: profileLoading } = useUserProfile(username!)
  const { data: postsData, isLoading: postsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserPostsQuery(username!)
  const { data: userCommunities } = useUserCommunities(username!)
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const isOwnProfile = currentUser?.username === username
  const posts = postsData?.pages.flatMap((p) => p.results) ?? []

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl overflow-hidden bg-bg-card border border-border">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="px-5 pb-5 -mt-10">
            <Skeleton className="h-20 w-20 rounded-full border-4 border-bg-card" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return <div className="text-center text-text-muted py-16">User not found</div>

  const priv = profile as UserPrivate

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="rounded-2xl overflow-hidden bg-bg-card border border-border">
        {/* Tall banner */}
        <div
          className="h-44 w-full relative"
          style={{
            background: 'linear-gradient(135deg, #0a1a0f 0%, #0d2b1a 40%, #061a2d 100%)',
          }}
        >
          {/* Decorative green glow */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-24 w-48 blur-2xl pointer-events-none"
            style={{ background: 'rgb(var(--color-accent) / 0.12)' }}
          />
        </div>

        <div className="px-5 pb-6">
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <UserAvatar
                user={profile}
                size="xl"
                className="ring-4"
                style={{ '--ring-color': 'rgb(var(--color-bg-card))' } as React.CSSProperties}
              />
              {/* Accent ring overlay */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: '0 0 0 3px rgb(var(--color-accent) / 0.5)', borderRadius: '50%' }}
              />
            </div>

            <div className="flex gap-2 mt-12">
              {isOwnProfile ? (
                <Link
                  to="/profile/edit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:bg-bg-elevated border border-border text-text-secondary"
                >
                  <Edit size={13} /> Edit Profile
                </Link>
              ) : (
                <div className="flex gap-2">
                  <FollowButton
                    username={profile.username}
                    isFollowing={profile.is_following ?? false}
                    currentUsername={currentUser?.username}
                  />
                  <Link
                    to="/messages"
                    className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                  >
                    <MessageCircle size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Name + role */}
          <div className="mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {profile.first_name} {profile.last_name}
              </h1>
              {profile.role !== 'USER' && (
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: 'rgb(var(--color-accent) / 0.15)', color: 'rgb(var(--color-accent))', border: '1px solid rgb(var(--color-accent) / 0.3)' }}
                >
                  {profile.role}
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm mt-0.5">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-text-secondary text-sm mb-4 leading-[1.7]">{profile.bio}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs text-text-muted mb-5">
            {priv.country && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {priv.country}
              </span>
            )}
            {priv.date_joined && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> Joined {format(new Date(priv.date_joined), 'MMMM yyyy')}
              </span>
            )}
          </div>

          {/* Follow stats */}
          <div className="flex items-center divide-x divide-border rounded-xl overflow-hidden bg-bg-elevated border border-border">
            <Link
              to={`/profile/${username}/followers`}
              className="flex-1 text-center py-3 hover:bg-surface-hover transition-colors"
            >
              <p className="text-lg font-bold text-text-primary">{formatCount(profile.followers_count)}</p>
              <p className="text-[11px] text-text-muted">Followers</p>
            </Link>
            <Link
              to={`/profile/${username}/following`}
              className="flex-1 text-center py-3 hover:bg-surface-hover transition-colors"
            >
              <p className="text-lg font-bold text-text-primary">{formatCount(profile.following_count)}</p>
              <p className="text-[11px] text-text-muted">Following</p>
            </Link>
            <div className="flex-1 text-center py-3">
              <p className="text-lg font-bold text-text-primary">{formatCount(posts.length)}</p>
              <p className="text-[11px] text-text-muted">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Communities */}
      {userCommunities && userCommunities.length > 0 && (
        <div className="rounded-2xl p-5 bg-bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-accent" />
            <h2 className="font-semibold text-text-primary text-sm">
              {isOwnProfile ? 'My Communities' : 'Communities'}
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgb(var(--color-accent) / 0.12)', color: 'rgb(var(--color-accent))' }}
            >
              {userCommunities.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {userCommunities.map((community) => (
              <Link
                key={community.id}
                to={`/communities/${community.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors bg-bg-elevated border border-border"
              >
                <div className={cn(
                  'h-4 w-4 rounded flex items-center justify-center shrink-0 bg-gradient-to-br',
                  getCommunityGradient(community.name)
                )}>
                  <span className="text-white text-[9px] font-bold leading-none">
                    {community.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="truncate max-w-[100px] font-medium">{community.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts section */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-bold text-text-primary tracking-tight">Posts</h2>
      </div>

      {postsLoading && <div className="space-y-4">{[1, 2].map((i) => <PostSkeleton key={i} />)}</div>}

      <div className="space-y-4">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <PostSkeleton />}
    </div>
  )
}
