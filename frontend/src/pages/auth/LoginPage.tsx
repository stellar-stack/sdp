import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useLogin } from '@/queries/auth.queries'
import { loginSchema, type LoginInput } from '@/lib/validators'
import { extractErrorMessage } from '@/lib/utils'
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton'
import GithubOAuthButton from '@/components/auth/GithubOAuthButton'
import { MessageCircle, Users, Zap } from 'lucide-react'

const highlights = [
  { icon: Users, text: '10,000+ members across hundreds of communities' },
  { icon: MessageCircle, text: 'Real-time messaging powered by WebSockets' },
  { icon: Zap, text: 'AI-moderated, safe spaces for every discussion' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (data: LoginInput) => {
    login(data, {
      onSuccess: () => navigate('/feed'),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0e0e0e' }}>

      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#111111', borderRight: '1px solid #2d2d2d' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,255,132,0.15) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -left-24 h-64 w-64 rounded-full pointer-events-none blur-3xl"
          style={{ background: 'rgba(0,255,132,0.06)' }}
        />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: '#00ff84', boxShadow: '0 0 16px rgba(0,255,132,0.5)' }}
          >
            <span className="font-black text-sm" style={{ color: '#0e0e0e' }}>V</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Voyage</span>
        </div>

        {/* Main copy */}
        <div className="relative">
          <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-4">
            Where curious<br />minds meet.
          </h2>
          <p className="text-text-secondary text-base leading-relaxed mb-10">
            Share your journey, discover communities, and connect with people who inspire you.
          </p>

          <div className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(0,255,132,0.12)' }}
                >
                  <Icon size={15} style={{ color: '#00ff84' }} />
                </div>
                <span className="text-sm text-text-secondary">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-xs text-text-muted relative">© 2026 Voyage. Free forever.</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: '#00ff84' }}
            >
              <span className="font-black text-sm" style={{ color: '#0e0e0e' }}>V</span>
            </div>
            <span className="text-lg font-bold text-white">Voyage</span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-1">Welcome back</h1>
          <p className="text-text-secondary text-sm mb-8">Sign in to continue your voyage.</p>

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            <GoogleOAuthButton />
            <GithubOAuthButton />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ background: '#2d2d2d' }} />
            <span className="text-xs text-text-muted">or continue with email</span>
            <div className="h-px flex-1" style={{ background: '#2d2d2d' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
              <input
                {...register('username')}
                placeholder="your_username"
                className="input-base"
                autoComplete="username"
              />
              {errors.username && <p className="mt-1 text-xs text-danger">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input-base"
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              style={{
                background: isPending ? 'rgba(0,255,132,0.6)' : '#00ff84',
                color: '#0e0e0e',
                boxShadow: '0 4px 16px rgba(0,255,132,0.3)',
              }}
            >
              {isPending && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
              )}
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Get started free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
