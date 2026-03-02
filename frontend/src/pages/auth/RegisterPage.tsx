import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRegister } from '@/queries/auth.queries'
import { registerSchema, type RegisterInput } from '@/lib/validators'
import { extractErrorMessage } from '@/lib/utils'
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton'
import GithubOAuthButton from '@/components/auth/GithubOAuthButton'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { mutate: registerUser, isPending } = useRegister()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

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
        onError: (err) => toast.error(extractErrorMessage(err)),
      }
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0e0e0e' }}>

      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#111111', borderRight: '1px solid #2d2d2d' }}
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
          <span className="text-xl font-bold text-white tracking-tight">Voyage</span>
        </div>

        {/* Quote / pull copy */}
        <div className="relative">
          <div
            className="w-12 h-1 rounded-full mb-6"
            style={{ background: '#00ff84' }}
          />
          <blockquote className="text-3xl font-black text-white leading-tight tracking-tighter mb-6">
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
            <span className="text-lg font-bold text-white">Voyage</span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-1">Create your account</h1>
          <p className="text-text-secondary text-sm mb-8">Free forever. No credit card needed.</p>

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            <GoogleOAuthButton />
            <GithubOAuthButton />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ background: '#2d2d2d' }} />
            <span className="text-xs text-text-muted">or register with email</span>
            <div className="h-px flex-1" style={{ background: '#2d2d2d' }} />
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
                    style={{ background: '#1a1a1a', border: '2px dashed #2d2d2d' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,255,132,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#2d2d2d')}
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
              <input {...register('password')} type="password" placeholder="Password (min 8 characters)" className="input-base" autoComplete="new-password" />
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
