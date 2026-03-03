import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  sidebarOpen: boolean
  activeModal: string | null
  modalData: unknown
  setTheme: (theme: Theme) => void
  openModal: (name: string, data?: unknown) => void
  closeModal: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const storedTheme = (localStorage.getItem('voyage-theme') as Theme) ?? 'system'

// Apply theme class immediately on module load (avoids flash)
const _initialResolved = resolveTheme(storedTheme)
document.documentElement.classList.toggle('dark', _initialResolved === 'dark')
document.documentElement.classList.toggle('light', _initialResolved === 'light')

export const useUIStore = create<UIState>((set) => ({
  theme: storedTheme,
  resolvedTheme: _initialResolved,
  sidebarOpen: false,
  activeModal: null,
  modalData: null,

  setTheme: (theme) => {
    localStorage.setItem('voyage-theme', theme)
    const resolved = resolveTheme(theme)
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.classList.toggle('light', resolved === 'light')
    set({ theme, resolvedTheme: resolved })
  },

  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
