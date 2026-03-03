import { Sun, Moon, Monitor } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'

type Theme = 'light' | 'dark' | 'system'

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark', icon: Moon, label: 'Dark' },
]

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  return (
    <div className="flex items-center gap-0.5 rounded-xl p-1 bg-bg-secondary border border-border">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className="flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all duration-150"
          style={
            theme === value
              ? { background: 'rgb(var(--color-accent))', color: '#0e0e0e' }
              : { color: 'rgb(var(--color-text-muted))' }
          }
          onMouseEnter={e => {
            if (theme !== value) e.currentTarget.style.color = 'rgb(var(--color-text-primary))'
          }}
          onMouseLeave={e => {
            if (theme !== value) e.currentTarget.style.color = 'rgb(var(--color-text-muted))'
          }}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  )
}
