import { Link } from 'react-router-dom'
import { Sun, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-white mb-3">
              <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
                <Sun size={16} className="text-white" />
              </div>
              Ener<span className="text-primary-400">mo</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Africa's clean energy marketplace. Connecting solar vendors with customers across Botswana and beyond.
            </p>
            <div className="flex gap-3 mt-4">
              {['facebook', 'twitter', 'linkedin'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 bg-gray-800 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors text-xs font-medium text-gray-300 hover:text-white"
                >
                  {s[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              {[
                ['Solar Home Systems', '/marketplace?category=solar-home-systems'],
                ['Rooftop Solar', '/marketplace?category=rooftop-solar'],
                ['Batteries', '/marketplace?category=batteries'],
                ['Inverters', '/marketplace?category=inverters'],
                ['Solar Water Pumps', '/marketplace?category=solar-water-pumps'],
              ].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              {[
                ['About Enermo', '/about'],
                ['Vendor Directory', '/vendors'],
                ['Become a Vendor', '/signup?role=vendor'],
                ['Contact Us', '/contact'],
              ].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 text-primary-400 shrink-0" />
                Plot 54368, CBD, Gaborone, Botswana
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-primary-400 shrink-0" />
                hello@enermo.co.bw
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-primary-400 shrink-0" />
                +267 7100 0000
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <p>© {new Date().getFullYear()} Enermo. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
