// ============================================================
// About page
// ============================================================
import { Link } from 'react-router-dom'
import { Sun, Target, Users, Leaf, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'

export function About() {
  return (
    <div className="font-body">
      {/* Hero */}
      <section className="bg-gradient-to-br from-forest-950 to-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 bg-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sun size={28} className="text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">About Enermo</h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
            We're on a mission to accelerate clean energy adoption across Africa — starting with Botswana.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Target size={24} />,
                title: 'Our Mission',
                desc: 'Make clean energy accessible to every home, farm, and business in Botswana by connecting buyers with trusted local vendors.',
              },
              {
                icon: <Users size={24} />,
                title: 'Our Community',
                desc: 'We partner with verified solar installers, importers, and energy companies to create a curated, trustworthy marketplace.',
              },
              {
                icon: <Leaf size={24} />,
                title: 'Our Impact',
                desc: 'Each installation on Enermo represents tonnes of CO₂ avoided and families freed from expensive diesel and grid dependence.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              Enermo was born out of a simple frustration: finding a reliable solar vendor in Botswana was harder than it should be. Buyers were stuck scrolling Facebook groups, relying on word-of-mouth, or visiting multiple shops without being able to compare prices or verify credentials.
            </p>
            <p>
              We set out to build the platform that Africa's clean energy ecosystem deserves — one that makes it easy to discover products, compare specifications, and connect with vendors who have been vetted and reviewed by real customers.
            </p>
            <p>
              Our roadmap includes PAYG financing integration, IoT monitoring dashboards for installed systems, and eventually a Carbon-as-a-Service layer that lets communities monetise their clean energy impact.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-500 text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold mb-3">Join the Energy Revolution</h2>
          <p className="text-primary-100 mb-6">Whether you're buying or selling — Enermo is your platform.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/marketplace"><Button variant="outline" className="border-white text-white hover:bg-white/10">Browse Products</Button></Link>
            <Link to="/signup?role=vendor"><Button className="bg-white text-primary-600 hover:bg-primary-50">Become a Vendor <ArrowRight size={16} /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// ============================================================
// Contact page
// ============================================================
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui'

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
})

type ContactForm = z.infer<typeof contactSchema>

export function Contact() {
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  async function onSubmit(_data: ContactForm) {
    // TODO: Wire to Supabase or email service
    await new Promise((r) => setTimeout(r, 800))
    setDone(true)
    reset()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Info */}
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Get In Touch</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Have questions about the platform, need help with a vendor listing, or want to discuss a partnership? We'd love to hear from you.
          </p>

          <div className="space-y-5">
            {[
              { icon: <Mail size={20} />, label: 'Email', value: 'hello@enermo.co.bw' },
              { icon: <Phone size={20} />, label: 'Phone', value: '+267 7100 0000' },
              { icon: <MapPin size={20} />, label: 'Address', value: 'Plot 54368, CBD, Gaborone, Botswana' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                  <p className="text-gray-700 font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          {done ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="text-forest-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Message Sent!</h3>
              <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
              <button onClick={() => setDone(false)} className="mt-4 text-sm text-primary-600 hover:underline">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Send a Message</h2>
              <Input label="Your Name" error={errors.name?.message} {...register('name')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Subject" error={errors.subject?.message} {...register('subject')} />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  rows={5}
                  className={`w-full px-3 py-2 border rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                    errors.message ? 'border-red-400' : 'border-gray-300'
                  }`}
                  {...register('message')}
                />
                {errors.message && <p className="text-xs text-red-600">{errors.message.message}</p>}
              </div>
              <Button type="submit" fullWidth size="lg">Send Message</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
