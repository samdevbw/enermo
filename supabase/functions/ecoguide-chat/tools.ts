// ============================================================
// Tool definitions exposed to the model. The model can ONLY request these;
// each maps to a fixed, parameterised database function or pure calculation.
// ============================================================
import { estimateSolarSystem, SizingError, type SizingInput } from './sizing.ts'

export interface ProductHit {
  id: string; title: string; slug: string; price: number | null; currency: string | null
  capacity: string | null; brand: string | null; model: string | null; in_stock: boolean
  warranty_months: number | null; features: string[] | null; category: string | null
  category_slug: string | null; vendor_id: string; vendor_name: string; vendor_verified: boolean
  vendor_city: string | null; image_url: string | null; match_score: number
}

export interface VendorHit {
  id: string; business_name: string; description: string | null; city: string | null
  verified: boolean; rating: number | null; review_count: number | null; logo_url: string | null
  capabilities: string[]; product_categories: string[]; published_products: number; match_score: number
}

export interface ToolBackend {
  searchProducts(a: { terms: string[]; category: string | null; minPrice: number | null; maxPrice: number | null; limit: number }): Promise<ProductHit[]>
  searchVendors(a: { terms: string[]; city: string | null; capability: string | null; limit: number }): Promise<VendorHit[]>
}

export const VENDOR_CAPABILITIES = ['supplier', 'installer', 'maintenance', 'financial_institution', 'rental_provider'] as const

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search published ENERMO marketplace listings. Returns real products with price (BWP), vendor and link slug.',
      parameters: {
        type: 'object',
        properties: {
          keywords: { type: 'array', items: { type: 'string' }, description: 'Short search terms, e.g. ["inverter","5kva"]', maxItems: 8 },
          category_slug: { type: 'string', description: 'Optional category slug to filter by.' },
          min_price: { type: 'number', description: 'Optional minimum price in BWP.' },
          max_price: { type: 'number', description: 'Optional maximum price in BWP.' },
          limit: { type: 'integer', minimum: 1, maximum: 8 },
        },
        required: ['keywords'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_vendors',
      description: 'Search active ENERMO vendors (suppliers, installers, service providers). Returns public profile info only.',
      parameters: {
        type: 'object',
        properties: {
          keywords: { type: 'array', items: { type: 'string' }, maxItems: 8 },
          city: { type: 'string', description: 'Optional town or city in Botswana, e.g. "Gaborone".' },
          capability: { type: 'string', enum: [...VENDOR_CAPABILITIES] },
          limit: { type: 'integer', minimum: 1, maximum: 6 },
        },
        required: ['keywords'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estimate_solar_system',
      description: 'Preliminary solar sizing (array kWp, panels, inverter kW, battery kWh) with visible assumptions. Not an engineering design.',
      parameters: {
        type: 'object',
        properties: {
          monthly_kwh: { type: 'number' },
          daily_kwh: { type: 'number' },
          appliances: {
            type: 'array',
            maxItems: 30,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                watts: { type: 'number' },
                quantity: { type: 'integer' },
                hours_per_day: { type: 'number' },
              },
              required: ['name', 'watts', 'hours_per_day'],
              additionalProperties: false,
            },
          },
          system_type: { type: 'string', enum: ['grid-tied', 'hybrid', 'off-grid'] },
          battery_chemistry: { type: 'string', enum: ['lithium', 'lead-acid'] },
          backup_hours: { type: 'number' },
          backup_load_kw: { type: 'number' },
          autonomy_days: { type: 'number' },
          offset_fraction: { type: 'number', description: 'Share of consumption to cover with solar, 0.1–1.' },
          peak_sun_hours: { type: 'number', description: 'Override only if the user gives a site-specific value.' },
        },
        additionalProperties: false,
      },
    },
  },
] as const

export type ToolDefinition = (typeof TOOL_DEFINITIONS)[number]

const str = (v: unknown, max = 80) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const terms = (v: unknown) =>
  Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase().trim().slice(0, 40)).filter(Boolean).slice(0, 8) : []

export interface ToolOutcome {
  /** JSON sent back to the model */
  content: string
  products?: ProductHit[]
  vendors?: VendorHit[]
  estimate?: ReturnType<typeof estimateSolarSystem>
}

/** Executes one tool call. Never throws — errors go back to the model as data. */
export async function runTool(name: string, rawArgs: string, backend: ToolBackend): Promise<ToolOutcome> {
  let args: Record<string, unknown>
  try {
    args = JSON.parse(rawArgs || '{}')
  } catch {
    return { content: JSON.stringify({ error: 'Arguments were not valid JSON.' }) }
  }

  try {
    if (name === 'search_products') {
      const products = await backend.searchProducts({
        terms: terms(args.keywords),
        category: str(args.category_slug),
        minPrice: num(args.min_price),
        maxPrice: num(args.max_price),
        limit: Math.min(Math.max(num(args.limit) ?? 6, 1), 8),
      })
      return {
        products,
        content: JSON.stringify(
          products.length
            ? products.map((p) => ({
                title: p.title, slug: p.slug, price_bwp: p.price, capacity: p.capacity, brand: p.brand,
                model: p.model, in_stock: p.in_stock, warranty_months: p.warranty_months,
                features: p.features?.slice(0, 5), category: p.category, vendor: p.vendor_name,
                vendor_id: p.vendor_id, vendor_verified: p.vendor_verified, vendor_city: p.vendor_city,
              }))
            : { result: 'No matching published products.' },
        ),
      }
    }

    if (name === 'search_vendors') {
      const capability = str(args.capability)
      const vendors = await backend.searchVendors({
        terms: terms(args.keywords),
        city: str(args.city, 40),
        capability: capability && (VENDOR_CAPABILITIES as readonly string[]).includes(capability) ? capability : null,
        limit: Math.min(Math.max(num(args.limit) ?? 5, 1), 6),
      })
      return {
        vendors,
        content: JSON.stringify(
          vendors.length
            ? vendors.map((v) => ({
                name: v.business_name, id: v.id, city: v.city, verified: v.verified, rating: v.rating,
                capabilities: v.capabilities, sells: v.product_categories, listings: v.published_products,
                about: v.description,
              }))
            : { result: 'No matching active vendors.' },
        ),
      }
    }

    if (name === 'estimate_solar_system') {
      const appliances = Array.isArray(args.appliances)
        ? (args.appliances as Record<string, unknown>[]).slice(0, 30).map((a) => ({
            name: str(a.name, 40) ?? 'Appliance',
            watts: num(a.watts) ?? 0,
            quantity: num(a.quantity) ?? 1,
            hoursPerDay: num(a.hours_per_day) ?? 0,
          }))
        : undefined
      const input: SizingInput = {
        monthlyKwh: num(args.monthly_kwh) ?? undefined,
        dailyKwh: num(args.daily_kwh) ?? undefined,
        appliances,
        systemType: (['grid-tied', 'hybrid', 'off-grid'] as const).find((t) => t === args.system_type),
        batteryChemistry: (['lithium', 'lead-acid'] as const).find((t) => t === args.battery_chemistry),
        backupHours: num(args.backup_hours) ?? undefined,
        backupLoadKw: num(args.backup_load_kw) ?? undefined,
        autonomyDays: num(args.autonomy_days) ?? undefined,
        offsetFraction: num(args.offset_fraction) ?? undefined,
        assumptions: num(args.peak_sun_hours) ? { peakSunHours: num(args.peak_sun_hours)! } : undefined,
      }
      const estimate = estimateSolarSystem(input)
      return { estimate, content: JSON.stringify(estimate) }
    }

    return { content: JSON.stringify({ error: `Unknown tool ${name}` }) }
  } catch (e) {
    const msg = e instanceof SizingError ? e.message : 'The tool failed; tell the user you could not complete this step.'
    if (!(e instanceof SizingError)) console.error(`tool ${name} failed`, e)
    return { content: JSON.stringify({ error: msg }) }
  }
}
