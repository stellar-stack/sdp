import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true })
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

export function formatCount(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function getMediaUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return path // Vite proxy serves /media/* from backend
}

/**
 * Parses DRF field-level validation errors into a flat Record<fieldName, message>.
 * Returns null if no field errors found (caller should fall back to toast).
 */
export function parseApiErrors(error: unknown): Record<string, string> | null {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      const result: Record<string, string> = {}
      for (const [key, val] of Object.entries(record)) {
        if (key === 'detail' || key === 'error') continue
        if (Array.isArray(val) && val.length > 0) result[key] = String(val[0])
        else if (typeof val === 'string') result[key] = val
      }
      if (Object.keys(result).length > 0) return result
    }
  }
  return null
}

export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    if (response?.data && typeof response.data === 'object') {
      const data = response.data as Record<string, unknown>
      if (typeof data.error === 'string') return data.error
      if (typeof data.detail === 'string') return data.detail
      // Field errors
      const firstField = Object.values(data)[0]
      if (Array.isArray(firstField)) return firstField[0] as string
    }
  }
  return 'Something went wrong. Please try again.'
}
