import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSaveVendor, useVendorByProfile } from '@/hooks/useProducts'
import { updateProfile, uploadProfileImage } from '@/services/profile'
import { Button, Card, Input, Spinner, Textarea } from '@/components/ui'
import { ImageUploadField } from '@/components/settings/ImageUploadField'
import type { Vendor } from '@/types'

// ------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------
// Lenient on purpose: accepts "+267 71 234 567", "71234567", "071-234-567"
const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\+?[0-9][0-9\s-]{6,18}$/.test(v), 'Enter a valid phone number')

const emptyToNull = (v: string) => (v.trim() === '' ? null : v.trim())

function initials(name: string | null | undefined) {
  return name?.trim().charAt(0).toUpperCase() || 'U'
}

function SavedNote({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span role="status" className="inline-flex items-center gap-1 text-sm text-forest-700">
      <CheckCircle2 size={16} /> Saved
    </span>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
  )
}

// ------------------------------------------------------------
// Personal details — used by every role
// ------------------------------------------------------------
const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Please enter your name').max(120),
  phone: phoneSchema,
  avatar_url: z.string().nullable(),
})
type ProfileForm = z.infer<typeof profileSchema>

function ProfileSection() {
  const { user, profile, refreshProfile } = useAuth()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, control, formState: { errors, isSubmitting, isDirty }, reset } =
    useForm<ProfileForm>({
      resolver: zodResolver(profileSchema),
      values: {
        full_name: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        avatar_url: profile?.avatar_url ?? null,
      },
    })

  if (!user || !profile) return <Spinner />

  async function onSubmit(data: ProfileForm) {
    try {
      setError('')
      await updateProfile(user!.id, {
        full_name: data.full_name.trim(),
        phone: emptyToNull(data.phone),
        avatar_url: data.avatar_url,
      })
      const fresh = await refreshProfile()
      reset({ full_name: fresh?.full_name ?? '', phone: fresh?.phone ?? '', avatar_url: fresh?.avatar_url ?? null })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save your details')
    }
  }

  return (
    <Card>
      <SectionHeader title="Personal details" description="How you appear to vendors and customers on Enermo." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Controller
          name="avatar_url"
          control={control}
          render={({ field }) => (
            <ImageUploadField
              label="Profile photo"
              value={field.value}
              fallback={initials(profile.full_name)}
              onUpload={(file) => uploadProfileImage(user.id, file, 'avatar')}
              onChange={(url) => field.onChange(url)}
            />
          )}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
          <Input
            label="Phone number"
            type="tel"
            autoComplete="tel"
            placeholder="+267 71 234 567"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <Input label="Email" value={user.email ?? ''} disabled readOnly hint="Your sign-in email can't be changed here." />
        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
          <SavedNote show={saved} />
        </div>
      </form>
    </Card>
  )
}

// ------------------------------------------------------------
// Business details — vendors only
// ------------------------------------------------------------
const businessSchema = z.object({
  business_name: z.string().trim().min(2, 'Business name is required').max(120),
  description: z.string().trim().max(2000),
  email: z.string().trim().refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email'),
  phone: phoneSchema,
  website: z.string().trim().max(200),
  location: z.string().trim().max(200),
  city: z.string().trim().max(100),
  logo_url: z.string().nullable(),
})
type BusinessForm = z.infer<typeof businessSchema>

function toBusinessForm(v: Vendor | null | undefined): BusinessForm {
  return {
    business_name: v?.business_name ?? '',
    description: v?.description ?? '',
    email: v?.email ?? '',
    phone: v?.phone ?? '',
    website: v?.website ?? '',
    location: v?.location ?? '',
    city: v?.city ?? '',
    logo_url: v?.logo_url ?? null,
  }
}

/** "enermo.co.bw" → "https://enermo.co.bw" so links on the vendor page work. */
function normaliseWebsite(v: string) {
  const t = v.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

function BusinessSection() {
  const { user, profile } = useAuth()
  const { data: vendor, isLoading } = useVendorByProfile(profile?.id)
  const saveVendor = useSaveVendor(profile?.id)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, control, formState: { errors, isDirty }, reset } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    values: toBusinessForm(vendor),
  })

  if (isLoading || !user) return <Spinner />
  const isNew = !vendor

  async function onSubmit(data: BusinessForm) {
    const result = await saveVendor.mutateAsync({
      vendorId: vendor?.id,
      data: { ...data, website: normaliseWebsite(data.website) },
    })
    reset(toBusinessForm(result))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card>
      <SectionHeader
        title="Business details"
        description="Shown on your public vendor page and product listings."
      />
      {isNew && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-primary-50 border border-primary-200 text-sm text-primary-800">
          Add your business details to start listing products on Enermo.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {saveVendor.error && (
          <p role="alert" className="text-sm text-red-600">
            {saveVendor.error instanceof Error ? saveVendor.error.message : 'Could not save business details'}
          </p>
        )}
        <Controller
          name="logo_url"
          control={control}
          render={({ field }) => (
            <ImageUploadField
              label="Business logo"
              shape="rounded"
              value={field.value}
              fallback={initials(vendor?.business_name ?? profile?.full_name)}
              onUpload={(file) => uploadProfileImage(user.id, file, 'logo')}
              onChange={(url) => field.onChange(url)}
            />
          )}
        />
        <Input label="Business name" error={errors.business_name?.message} {...register('business_name')} />
        <Textarea
          label="About your business"
          placeholder="What you sell or install, areas you cover, years in business…"
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Business email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Business phone" type="tel" placeholder="+267 71 234 567" error={errors.phone?.message} {...register('phone')} />
          <Input label="Website" placeholder="www.example.co.bw" error={errors.website?.message} {...register('website')} />
          <Input label="City / town" placeholder="Gaborone" error={errors.city?.message} {...register('city')} />
        </div>
        <Input label="Address" placeholder="Plot 123, Main Mall" error={errors.location?.message} {...register('location')} />
        <div className="flex items-center gap-3">
          <Button type="submit" loading={saveVendor.isPending} disabled={!isDirty && !isNew}>
            {isNew ? 'Create business profile' : 'Save changes'}
          </Button>
          <SavedNote show={saved} />
        </div>
      </form>
    </Card>
  )
}

// ------------------------------------------------------------
// Pages
// ------------------------------------------------------------
function PageTitle({ children }: { children: string }) {
  return <h1 className="font-display text-2xl font-bold text-gray-900">{children}</h1>
}

export function CustomerSettings() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle>Settings</PageTitle>
      <ProfileSection />
    </div>
  )
}

export function VendorSettings() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle>Settings</PageTitle>
      <BusinessSection />
      <ProfileSection />
    </div>
  )
}
