import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Users, MessageCircle, Bell, Bookmark, Search,
  LogOut, ShieldCheck, ChevronDown, ChevronUp, Plus,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useNotificationStore } from '@/store/notification.store'
import { useMessageStore } from '@/store/message.store'
import { useLogout } from '@/queries/auth.queries'
import { useMyCommunities } from '@/queries/communities.queries'
import { cn, getInitials, getMediaUrl } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const navLinks = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/communities', icon: Users, label: 'Communities' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/search', icon: Search, label: 'Search' },
]

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

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { openModal } = useUIStore()
  const unreadNotifs = useNotificationStore((s) => s.unreadCount)
  const unreadMessages = useMessageStore((s) => s.totalUnread)
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()
  const [communitiesOpen, setCommunitiesOpen] = useState(true)

  const { data: myCommunities } = useMyCommunities()

  return (
    <aside
      className="fixed left-0 top-0 hidden h-full w-64 flex-col lg:flex bg-bg-secondary border-r border-border"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 mb-2">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-accent"
          style={{ boxShadow: '0 0 12px rgb(var(--color-accent) / 0.4)' }}
        >
          <span className="font-black text-sm" style={{ color: '#0e0e0e' }}>V</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-text-primary">Voyage</span>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
        {/* Navigation */}
        <nav className="space-y-0.5">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('sidebar-link relative', isActive && 'active')
              }
            >
              <Icon size={18} />
              <span>{label}</span>

              {label === 'Notifications' && unreadNotifs > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold"
                  style={{ background: 'rgb(0 255 132)', color: '#0e0e0e' }}
                >
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </motion.span>
              )}
              {label === 'Messages' && unreadMessages > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold"
                  style={{ background: 'rgb(0 255 132)', color: '#0e0e0e' }}
                >
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </motion.span>
              )}
            </NavLink>
          ))}

          {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            >
              <ShieldCheck size={18} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-border" />

        {/* Enrolled Communities */}
        {myCommunities && myCommunities.length > 0 && (
          <div>
            <button
              onClick={() => setCommunitiesOpen((v) => !v)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors mb-1"
            >
              <span>My Communities</span>
              {communitiesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            <AnimatePresence initial={false}>
              {communitiesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5">
                    {myCommunities.slice(0, 8).map((community) => (
                      <Link
                        key={community.id}
                        to={`/communities/${community.id}`}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors truncate"
                      >
                        <div className={cn(
                          'h-6 w-6 rounded-md flex items-center justify-center shrink-0 bg-gradient-to-br',
                          getCommunityGradient(community.name)
                        )}>
                          <span className="text-white text-[10px] font-bold">
                            {community.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="truncate font-medium">{community.name}</span>
                      </Link>
                    ))}
                    {myCommunities.length > 8 && (
                      <Link
                        to="/communities"
                        className="flex items-center px-3 py-1.5 text-xs text-text-muted hover:text-accent transition-colors font-medium"
                      >
                        +{myCommunities.length - 8} more
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="px-3 pb-5 space-y-2 border-t border-border pt-4">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Create post */}
        <button
          onClick={() => openModal('create-post')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 bg-accent"
          style={{ color: '#0e0e0e', boxShadow: '0 4px 16px rgb(var(--color-accent) / 0.25)' }}
        >
          <Plus size={16} />
          New Post
        </button>

        {/* User profile */}
        <NavLink
          to={`/profile/${user?.username}`}
          className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-surface-hover transition-all duration-150 group"
        >
          {user?.profile_picture ? (
            <img
              src={getMediaUrl(user.profile_picture)!}
              alt={user.username}
              className="h-9 w-9 rounded-full object-cover"
              style={{ border: '2px solid rgb(var(--color-accent) / 0.4)' }}
            />
          ) : (
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-accent-muted"
              style={{ border: '2px solid rgb(var(--color-accent) / 0.3)' }}
            >
              <span className="text-accent text-sm font-bold">
                {getInitials(user?.first_name ?? '', user?.last_name ?? '')}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-text-muted truncate">@{user?.username}</p>
          </div>
          <LogOut
            size={15}
            className="text-text-muted group-hover:text-danger transition-colors shrink-0 cursor-pointer"
            onClick={(e) => { e.preventDefault(); logout(); navigate('/') }}
          />
        </NavLink>
      </div>
    </aside>
  )
}
