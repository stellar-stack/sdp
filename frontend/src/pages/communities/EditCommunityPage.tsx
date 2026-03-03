import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCommunityDetail, useUpdateCommunity } from '@/queries/communities.queries'
import { createCommunitySchema, type CreateCommunityInput } from '@/lib/validators'
import { extractErrorMessage, getMediaUrl } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

export default function EditCommunityPage() {
  const { communityId } = useParams<{ communityId: string }>()
  const id = Number(communityId)
  const navigate = useNavigate()
  const { data: community, isLoading } = useCommunityDetail(id)
  const { mutate: updateCommunity, isPending } = useUpdateCommunity(id)

  const [banner, setBanner] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCommunityInput>({
    resolver: zodResolver(createCommunitySchema),
  })

  // Pre-fill form once community data arrives
  useEffect(() => {
    if (community) {
      reset({
        name: community.name,
        about: community.about,
        rules: community.rules ?? '',
      })
      const url = getMediaUrl(community.banner ?? null)
      if (url) setBannerPreview(url)
    }
  }, [community, reset])

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      if (!file) return
      setBanner(file)
      setBannerPreview(URL.createObjectURL(file))
    },
  })

  const onSubmit = (data: CreateCommunityInput) => {
    updateCommunity(
      { ...data, banner: banner ?? undefined },
      {
        onSuccess: () => {
          toast.success('Community updated!')
          navigate(`/communities/${id}`)
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="card p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Edit Community</h1>
        <p className="text-sm text-text-muted mt-0.5">Update community details and settings</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {/* Banner */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Banner Image
          </label>
          {bannerPreview ? (
            <div className="relative">
              <img src={bannerPreview} alt="banner" className="w-full h-32 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => { setBanner(null); setBannerPreview(null) }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className="cursor-pointer flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-text-muted hover:border-accent hover:text-accent transition-colors"
            >
              <input {...getInputProps()} />
              <Upload size={20} />
              <p className="text-sm">Upload banner image</p>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Name *</label>
          <input {...register('name')} className="input-base" placeholder="Community name" />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">About *</label>
          <textarea
            {...register('about')}
            rows={3}
            className="input-base resize-none"
            placeholder="What is this community about?"
          />
          {errors.about && <p className="mt-1 text-xs text-danger">{errors.about.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Rules (optional, one per line)
          </label>
          <textarea
            {...register('rules')}
            rows={4}
            className="input-base resize-none"
            placeholder={'Be respectful\nNo spam\nStay on topic'}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(`/communities/${id}`)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
            {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
