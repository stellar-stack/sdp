import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useRegister } from '@/queries/auth.queries'
import { registerSchema, type RegisterInput } from '@/lib/validators'
import { extractErrorMessage, parseApiErrors } from '@/lib/utils'
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton'
import GithubOAuthButton from '@/components/auth/GithubOAuthButton'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { mutate: registerUser, isPending } = useRegister()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const passwordValue = watch('password', '')

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      if (!file) return
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    },
  })

  const onSubmit = (data: RegisterInput) => {
    registerUser(
      { ...data, profile_picture: avatarFile ?? undefined },
      {
        onSuccess: () => {
          toast.success('Account created! Check your email to verify.')
          navigate('/login')
        },
        onError: (err) => {
          const fieldErrors = parseApiErrors(err)
          if (fieldErrors) {
            Object.entries(fieldErrors).forEach(([key, msg]) =>
              setError(key as keyof RegisterInput, { message: msg })
            )
          } else {
            toast.error(extractErrorMessage(err))
          }
        },
      }
    )
  }

  return (
    <div className="flex min-h-screen bg-bg-primary">

      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden bg-bg-secondary border-r border-border"
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,255,132,0.15) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: '#00ff84', boxShadow: '0 0 16px rgba(0,255,132,0.5)' }}
          >
            <span className="font-black text-sm" style={{ color: '#0e0e0e' }}>V</span>
          </div>
          <span className="text-xl font-bold text-text-primary tracking-tight">Voyage</span>
        </div>

        {/* Quote / pull copy */}
        <div className="relative">
          <div
            className="w-12 h-1 rounded-full mb-6"
            style={{ background: '#00ff84' }}
          />
          <blockquote className="text-3xl font-black text-text-primary leading-tight tracking-tighter mb-6">
            "Start sharing.<br />Start connecting.<br />
            <span style={{ color: '#00ff84' }}>Start your Voyage.</span>"
          </blockquote>
          <p className="text-text-secondary text-sm leading-relaxed">
            Join a growing community of curious minds. Build your profile, create communities, and share what inspires you.
          </p>
        </div>

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
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#00ff84' }}>
              <span className="font-black text-sm" style={{ color: '#0e0e0e' }}>V</span>
            </div>
            <span className="text-lg font-bold text-text-primary">Voyage</span>
          </div>

          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-1">Create your account</h1>
          <p className="text-text-secondary text-sm mb-8">Free forever. No credit card needed.</p>

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            <GoogleOAuthButton />
            <GithubOAuthButton />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">or register with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar upload */}
            <div className="flex justify-center mb-2">
              <div {...getRootProps()} className="relative cursor-pointer">
                <input {...getInputProps()} />
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover"
                    style={{ border: '3px solid #00ff84' }}
                  />
                ) : (
                  <div
                    className="h-20 w-20 rounded-full flex flex-col items-center justify-center gap-1.5 transition-colors"
                    style={{ background: 'rgb(var(--color-bg-elevated))', border: '2px dashed rgb(var(--color-border))' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgb(var(--color-accent) / 0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgb(var(--color-border))')}
                  >
                    <User size={20} className="text-text-muted" />
                    <Upload size={11} className="text-text-muted" />
                  </div>
                )}
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input {...register('first_name')} placeholder="First name" className="input-base" />
                {errors.first_name && <p className="mt-1 text-xs text-danger">{errors.first_name.message}</p>}
              </div>
              <div>
                <input {...register('last_name')} placeholder="Last name" className="input-base" />
              </div>
            </div>

            <div>
              <input {...register('username')} placeholder="Username" className="input-base" autoComplete="username" />
              {errors.username && <p className="mt-1 text-xs text-danger">{errors.username.message}</p>}
            </div>

            <div>
              <input {...register('email')} type="email" placeholder="Email address" className="input-base" autoComplete="email" />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="input-base pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
              {/* Password strength indicator */}
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  {[
                    { label: 'At least 8 characters', ok: passwordValue.length >= 8 },
                    { label: 'One uppercase letter', ok: /[A-Z]/.test(passwordValue) },
                    { label: 'One number', ok: /[0-9]/.test(passwordValue) },
                    { label: 'One special character', ok: /[^a-zA-Z0-9]/.test(passwordValue) },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div
                        className="h-1.5 w-1.5 rounded-full shrink-0 transition-colors"
                        style={{ background: ok ? '#00ff84' : '#5a5a5a' }}
                      />
                      <span className="text-xs transition-colors" style={{ color: ok ? '#00ff84' : '#5a5a5a' }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
              {isPending ? 'Creating account…' : (
                <>Create account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
