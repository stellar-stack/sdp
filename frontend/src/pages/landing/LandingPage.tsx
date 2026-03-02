import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MessageCircle, Users, Shield, Zap, Globe, Heart, ArrowRight, Play } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: MessageCircle,
    title: 'Real-time Messaging',
    description: 'Chat instantly with WebSocket-powered direct messages that feel alive.',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
  },
  {
    icon: Users,
    title: 'Communities',
    description: 'Create and join communities around shared interests and passions.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: Shield,
    title: 'AI Moderation',
    description: 'Smart content moderation powered by AI keeps every space safe.',
    color: '#00ff84',
    bg: 'rgba(0,255,132,0.1)',
  },
  {
    icon: Zap,
    title: 'Rich Media',
    description: 'Share text, images, and videos — your story in every format.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    icon: Globe,
    title: 'Open Platform',
    description: 'Connect with curious people from anywhere in the world.',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
  },
  {
    icon: Heart,
    title: 'Express Yourself',
    description: 'React, comment, and bookmark posts that inspire you.',
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.1)',
  },
]

const stats = [
  { value: '10K+', label: 'Active Members' },
  { value: '500+', label: 'Communities' },
  { value: '50K+', label: 'Posts Shared' },
]

const categories = ['All', 'Technology', 'Design', 'Business', 'Science', 'Art', 'Music', 'Gaming', 'Health']

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', {
        y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.1,
      })
      gsap.from('.hero-headline', {
        y: 40, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.25,
      })
      gsap.from('.hero-sub', {
        y: 20, opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.45,
      })
      gsap.from('.hero-cta', {
        y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.6,
      })
      gsap.from('.hero-visual', {
        x: 40, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.35,
      })
      gsap.to('.orb-1', {
        y: -30, x: 20, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut',
      })
      gsap.to('.orb-2', {
        y: 25, x: -15, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1,
      })

      ScrollTrigger.create({
        trigger: '.features-section',
        start: 'top 80%',
        onEnter: () => {
          gsap.from('.feature-card', {
            y: 40, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out',
          })
        },
        once: true,
      })
      ScrollTrigger.create({
        trigger: '.stats-section',
        start: 'top 85%',
        onEnter: () => {
          gsap.from('.stat-item', {
            y: 20, opacity: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out',
          })
        },
        once: true,
      })
      ScrollTrigger.create({
        trigger: '.cta-section',
        start: 'top 85%',
        onEnter: () => {
          gsap.from('.cta-content', {
            y: 30, opacity: 0, duration: 0.7, ease: 'power2.out',
          })
        },
        once: true,
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary">

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(14,14,14,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2d2d2d' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: '#00ff84', boxShadow: '0 0 12px rgba(0,255,132,0.4)' }}
          >
            <span className="font-black text-sm" style={{ color: '#0e0e0e' }}>V</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Voyage</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-text-secondary hover:text-white transition-colors text-sm font-medium">
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
            style={{ background: '#00ff84', color: '#0e0e0e', boxShadow: '0 4px 12px rgba(0,255,132,0.3)' }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative flex min-h-screen items-center overflow-hidden px-6 pt-20">
        {/* Background orbs */}
        <div className="orb-1 absolute left-1/4 top-1/3 h-96 w-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(0,255,132,0.08)' }} />
        <div className="orb-2 absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(139,92,246,0.07)' }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <div
                className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                style={{ background: 'rgba(0,255,132,0.12)', border: '1px solid rgba(0,255,132,0.25)', color: '#00ff84' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Open platform for curious minds
              </div>

              <h1 className="hero-headline text-5xl sm:text-6xl font-black text-white mb-6 leading-[1.05] tracking-tighter">
                Where ideas<br />
                <span style={{ color: '#00ff84' }}>take voyage.</span>
              </h1>

              <p className="hero-sub text-lg text-text-secondary max-w-lg mb-8 leading-relaxed">
                Share your journey, discover communities, and engage with people who matter — all in real time.
              </p>

              <div className="hero-cta flex items-center gap-3 flex-wrap">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  style={{ background: '#00ff84', color: '#0e0e0e', boxShadow: '0 4px 20px rgba(0,255,132,0.35)' }}
                >
                  Start for free <ArrowRight size={17} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-150 hover:bg-bg-elevated"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #2d2d2d', color: '#fff' }}
                >
                  Sign in
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex items-center gap-6 mt-10">
                {stats.map(({ value, label }) => (
                  <div key={label} className="stat-item">
                    <p className="text-2xl font-black" style={{ color: '#00ff84' }}>{value}</p>
                    <p className="text-xs text-text-muted mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual mockup */}
            <div className="hero-visual hidden lg:block">
              <div
                className="rounded-2xl overflow-hidden p-4 space-y-3"
                style={{ background: '#1a1a1a', border: '1px solid #2d2d2d', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
              >
                {/* Fake post card 1 */}
                <div className="rounded-xl overflow-hidden" style={{ background: '#262626', border: '1px solid #333' }}>
                  <div className="h-36 w-full" style={{ background: 'linear-gradient(135deg, #0d2b1a 0%, #1a4a2e 50%, #002d1a 100%)' }}>
                    <div className="h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,255,132,0.15)', border: '1px solid rgba(0,255,132,0.3)' }}>
                        <Play size={20} style={{ color: '#00ff84' }} />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full" style={{ background: 'linear-gradient(135deg,#00ff84,#00cc6a)' }} />
                      <div>
                        <div className="h-2.5 w-20 rounded-full bg-white/20 mb-1" />
                        <div className="h-2 w-14 rounded-full bg-white/10" />
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-white/15 mb-1.5" />
                    <div className="h-2.5 w-3/4 rounded-full bg-white/10" />
                    <div className="flex gap-3 mt-3">
                      {['❤️ 128', '💬 24', '🔖'].map((a) => (
                        <span key={a} className="text-[11px] text-text-muted">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fake post card 2 */}
                <div className="rounded-xl p-3" style={{ background: '#262626', border: '1px solid #333' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-full" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }} />
                    <div>
                      <div className="h-2.5 w-24 rounded-full bg-white/20 mb-1" />
                      <div className="h-2 w-16 rounded-full bg-white/10" />
                    </div>
                    <div className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(0,255,132,0.15)', color: '#00ff84' }}>
                      c/Design
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full rounded-full bg-white/15" />
                    <div className="h-2.5 w-5/6 rounded-full bg-white/10" />
                    <div className="h-2.5 w-4/6 rounded-full bg-white/8" />
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <div className="flex gap-4">
                    {['Feed', 'Communities', 'Messages'].map((t) => (
                      <span key={t} className="text-xs text-text-muted">{t}</span>
                    ))}
                  </div>
                  <div className="h-6 w-16 rounded-md flex items-center justify-center text-[10px] font-semibold"
                    style={{ background: '#00ff84', color: '#0e0e0e' }}>
                    + Post
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category chips ── */}
      <section className="py-10 px-6 border-t border-border" style={{ background: '#111' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-4">Explore communities by topic</p>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat, i) => (
              <Link
                key={cat}
                to="/register"
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 hover:-translate-y-0.5"
                style={
                  i === 0
                    ? { background: '#00ff84', color: '#0e0e0e' }
                    : { background: '#1a1a1a', border: '1px solid #2d2d2d', color: '#a0a0a0' }
                }
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Everything you need to connect
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
              Built with modern technology to give you the best social experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="feature-card rounded-2xl p-6 space-y-4 transition-all duration-200 hover:-translate-y-1 cursor-default"
                style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{ background: bg }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                  <p className="text-sm text-text-secondary leading-[1.7]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section py-24 px-6" style={{ background: '#111' }}>
        <div className="cta-content max-w-3xl mx-auto text-center">
          <div
            className="rounded-3xl p-14 space-y-6 relative overflow-hidden"
            style={{ background: '#0d2b1a', border: '1px solid rgba(0,255,132,0.2)' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,132,0.12) 0%, transparent 70%)' }}
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                Ready to start your{' '}
                <span style={{ color: '#00ff84' }}>Voyage</span>?
              </h2>
              <p className="text-text-secondary mb-8 leading-relaxed text-lg">
                Join thousands of curious minds. It&apos;s free — always will be.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: '#00ff84', color: '#0e0e0e', boxShadow: '0 4px 24px rgba(0,255,132,0.4)' }}
              >
                Create your account <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #2d2d2d', background: '#0e0e0e' }} className="py-8 px-6 text-center text-sm text-text-muted">
        <p>© 2026 Voyage. Built for curious minds everywhere.</p>
      </footer>
    </div>
  )
}
