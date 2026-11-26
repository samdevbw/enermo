// ============================================================
// Preliminary solar sizing engine — pure functions, no I/O.
// Every assumption is returned with the result so the UI and the AI can
// show it. NOT an engineering design.
// ============================================================

export type SystemType = 'grid-tied' | 'hybrid' | 'off-grid'
export type BatteryChemistry = 'lithium' | 'lead-acid'

export interface Appliance {
  name: string
  watts: number
  quantity?: number
  hoursPerDay: number
}

export interface SizingInput {
  monthlyKwh?: number
  dailyKwh?: number
  appliances?: Appliance[]
  systemType?: SystemType
  batteryChemistry?: BatteryChemistry
  /** Hours of backup required for the backup load (hybrid). */
  backupHours?: number
  /** Load (kW) to keep running during backup. Defaults to an estimate. */
  backupLoadKw?: number
  /** Days of autonomy for off-grid systems. */
  autonomyDays?: number
  /** Share of daily use to offset with solar (0–1). Default 1. */
  offsetFraction?: number
  assumptions?: Partial<SizingAssumptions>
}

export interface SizingAssumptions {
  /** Equivalent full-sun hours per day. Region-specific — replace with irradiation data later. */
  peakSunHours: number
  /** Losses from heat, dust, wiring, mismatch and inverter. */
  systemEfficiency: number
  inverterEfficiency: number
  depthOfDischarge: Record<BatteryChemistry, number>
  systemVoltage: number
  panelWatts: number
  /** Inverter rating above expected peak load. */
  inverterHeadroom: number
  /** Share of daily use that happens without sun (hybrid default for overnight storage). */
  nightFraction: number
}

/**
 * Conservative defaults for Botswana. Peak sun hours there are typically
 * well above 5; 5.5 keeps estimates on the safe side. Pass a regional value
 * in `assumptions.peakSunHours` once irradiation data is integrated.
 */
export const DEFAULT_ASSUMPTIONS: SizingAssumptions = {
  peakSunHours: 5.5,
  systemEfficiency: 0.77,
  inverterEfficiency: 0.93,
  depthOfDischarge: { lithium: 0.9, 'lead-acid': 0.5 },
  systemVoltage: 48,
  panelWatts: 550,
  inverterHeadroom: 1.25,
  nightFraction: 0.4,
}

const STANDARD_INVERTER_KW = [1, 2, 3, 3.6, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]

export interface SizingResult {
  dailyKwh: number
  peakLoadKw: number | null
  arrayKwp: number
  panelCount: number
  panelWatts: number
  inverterKw: number
  batteryUsableKwh: number
  batteryRatedKwh: number
  batteryAh: number
  systemType: SystemType
  batteryChemistry: BatteryChemistry
  assumptions: string[]
  notes: string[]
  disclaimer: string
}

const round = (n: number, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export class SizingError extends Error {}

export function estimateSolarSystem(input: SizingInput): SizingResult {
  const a: SizingAssumptions = {
    ...DEFAULT_ASSUMPTIONS,
    ...input.assumptions,
    depthOfDischarge: { ...DEFAULT_ASSUMPTIONS.depthOfDischarge, ...input.assumptions?.depthOfDischarge },
  }
  if (a.peakSunHours < 2 || a.peakSunHours > 8) throw new SizingError('Peak sun hours must be between 2 and 8.')
  if (a.systemEfficiency <= 0.4 || a.systemEfficiency > 1) throw new SizingError('System efficiency must be between 0.4 and 1.')

  const systemType = input.systemType ?? 'hybrid'
  const chemistry = input.batteryChemistry ?? 'lithium'
  const notes: string[] = []

  // ---- 1. Daily energy -------------------------------------------------
  let dailyKwh: number
  let peakLoadKw: number | null = null
  const appliances = (input.appliances ?? []).filter((x) => x.watts > 0 && x.hoursPerDay >= 0)

  if (appliances.length > 0) {
    dailyKwh = appliances.reduce((sum, x) => sum + (x.watts * (x.quantity ?? 1) * x.hoursPerDay) / 1000, 0)
    // Assume everything could run together — an upper bound the installer can refine.
    peakLoadKw = appliances.reduce((sum, x) => sum + (x.watts * (x.quantity ?? 1)) / 1000, 0)
    const motors = appliances.filter((x) => /fridge|freez|pump|air ?con|aircon|compressor|motor|borehole|drill|washing/i.test(x.name))
    if (motors.length) notes.push(`Motor loads (${motors.map((m) => m.name).join(', ')}) draw a start-up surge; check the inverter's surge rating.`)
  } else if (input.dailyKwh && input.dailyKwh > 0) {
    dailyKwh = input.dailyKwh
  } else if (input.monthlyKwh && input.monthlyKwh > 0) {
    dailyKwh = input.monthlyKwh / 30
  } else {
    throw new SizingError('Provide monthly kWh, daily kWh, or a list of appliances.')
  }
  if (dailyKwh > 5000) throw new SizingError('This is beyond a preliminary residential/commercial estimate; a site assessment is needed.')

  const offset = clamp(input.offsetFraction ?? 1, 0.1, 1)
  const targetKwh = dailyKwh * offset

  // ---- 2. Array --------------------------------------------------------
  const arrayKwp = targetKwh / (a.peakSunHours * a.systemEfficiency)
  const panelCount = Math.max(1, Math.ceil((arrayKwp * 1000) / a.panelWatts))

  // ---- 3. Inverter -----------------------------------------------------
  // With appliance data: peak load + headroom. Without: estimate from array size
  // (a common pairing), and say so.
  const inverterBasis = peakLoadKw ?? Math.max(arrayKwp * 0.8, dailyKwh / 6)
  const inverterKw = STANDARD_INVERTER_KW.find((s) => s >= inverterBasis * a.inverterHeadroom) ?? round(inverterBasis * a.inverterHeadroom, 0)
  if (peakLoadKw === null) notes.push('Inverter size is estimated from consumption; list the appliances that run at the same time for a better figure.')

  // ---- 4. Battery ------------------------------------------------------
  let usableKwh = 0
  const assumptions: string[] = []
  if (systemType === 'grid-tied') {
    notes.push('Grid-tied systems have no batteries and switch off during power cuts.')
  } else if (systemType === 'off-grid') {
    const days = clamp(input.autonomyDays ?? 1, 0.5, 5)
    usableKwh = dailyKwh * days
    assumptions.push(`Off-grid battery covers ${days} day(s) of full consumption without sun`)
    notes.push('Off-grid systems are often paired with a generator for long cloudy spells.')
  } else if (input.backupHours && input.backupHours > 0) {
    const load = input.backupLoadKw ?? (peakLoadKw ? peakLoadKw * 0.5 : dailyKwh / 24 * 1.5)
    usableKwh = load * input.backupHours
    assumptions.push(`Backup of ${round(load, 2)} kW for ${input.backupHours} h${input.backupLoadKw ? '' : ' (backup load estimated)'}`)
  } else {
    usableKwh = dailyKwh * a.nightFraction
    assumptions.push(`Hybrid battery covers ${Math.round(a.nightFraction * 100)}% of daily use (evening and night)`)
  }

  const dod = a.depthOfDischarge[chemistry]
  const ratedKwh = usableKwh > 0 ? usableKwh / dod / a.inverterEfficiency : 0
  const batteryAh = ratedKwh > 0 ? (ratedKwh * 1000) / a.systemVoltage : 0

  assumptions.unshift(
    `${a.peakSunHours} peak sun hours per day`,
    `${Math.round(a.systemEfficiency * 100)}% overall system efficiency`,
    `${a.panelWatts} W panels`,
    `Inverter sized with ${Math.round((a.inverterHeadroom - 1) * 100)}% headroom`,
  )
  if (ratedKwh > 0) {
    assumptions.push(
      `${chemistry === 'lithium' ? 'Lithium (LiFePO4)' : 'Lead-acid'} battery at ${Math.round(dod * 100)}% usable depth of discharge`,
      `${Math.round(a.inverterEfficiency * 100)}% inverter efficiency`,
      `${a.systemVoltage} V battery bank`,
    )
  }
  if (offset < 1) assumptions.push(`Solar sized to cover ${Math.round(offset * 100)}% of consumption`)

  return {
    dailyKwh: round(dailyKwh, 1),
    peakLoadKw: peakLoadKw === null ? null : round(peakLoadKw, 2),
    arrayKwp: round(arrayKwp, 1),
    panelCount,
    panelWatts: a.panelWatts,
    inverterKw,
    batteryUsableKwh: round(usableKwh, 1),
    batteryRatedKwh: round(ratedKwh, 1),
    batteryAh: Math.round(batteryAh),
    systemType,
    batteryChemistry: chemistry,
    assumptions,
    notes,
    disclaimer:
      'Preliminary estimate only, not an engineering design. A qualified solar installer must confirm sizing after a site assessment (roof space, shading, wiring and actual loads).',
  }
}
