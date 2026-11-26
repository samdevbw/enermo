// Runs under Node 22 (`node --experimental-strip-types --test`) or `deno test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimateSolarSystem, SizingError } from './sizing.ts'

test('800 kWh/month matches the worked example (26.7 kWh/day, ~6.3 kWp)', () => {
  const r = estimateSolarSystem({ monthlyKwh: 800 })
  assert.equal(r.dailyKwh, 26.7)
  assert.equal(r.arrayKwp, 6.3) // 26.67 / (5.5 * 0.77)
  assert.equal(r.panelCount, 12) // 6.3 kWp / 550 W, rounded up
  assert.equal(r.systemType, 'hybrid')
  // 40% of 26.67 = 10.67 usable / 0.9 / 0.93 = 12.7 kWh rated
  assert.equal(r.batteryUsableKwh, 10.7)
  assert.equal(r.batteryRatedKwh, 12.7)
  assert.ok(r.assumptions.some((s) => s.includes('5.5 peak sun hours')))
  assert.match(r.disclaimer, /not an engineering design/)
})

test('appliance list drives daily energy and inverter from peak load', () => {
  const r = estimateSolarSystem({
    appliances: [
      { name: 'Fridge', watts: 150, hoursPerDay: 24 },
      { name: 'LED lights', watts: 10, quantity: 10, hoursPerDay: 5 },
      { name: 'TV', watts: 100, hoursPerDay: 5 },
    ],
  })
  assert.equal(r.dailyKwh, 4.6) // 3.6 + 0.5 + 0.5
  assert.equal(r.peakLoadKw, 0.35)
  assert.equal(r.inverterKw, 1) // 0.35 * 1.25 -> smallest standard size
  assert.ok(r.notes.some((n) => n.includes('Fridge')), 'flags motor surge')
})

test('lead-acid needs a larger rated battery than lithium for the same usable energy', () => {
  const li = estimateSolarSystem({ dailyKwh: 10, systemType: 'off-grid', batteryChemistry: 'lithium' })
  const pb = estimateSolarSystem({ dailyKwh: 10, systemType: 'off-grid', batteryChemistry: 'lead-acid' })
  assert.equal(li.batteryUsableKwh, pb.batteryUsableKwh)
  assert.ok(pb.batteryRatedKwh > li.batteryRatedKwh * 1.7)
})

test('grid-tied has no battery', () => {
  const r = estimateSolarSystem({ dailyKwh: 20, systemType: 'grid-tied' })
  assert.equal(r.batteryRatedKwh, 0)
  assert.equal(r.batteryAh, 0)
})

test('backup hours and load drive hybrid battery size', () => {
  const r = estimateSolarSystem({ dailyKwh: 20, backupHours: 4, backupLoadKw: 1 })
  assert.equal(r.batteryUsableKwh, 4)
  assert.equal(r.batteryRatedKwh, 4.8) // 4 / 0.9 / 0.93
})

test('peak sun hours are configurable (regional data later)', () => {
  const sunny = estimateSolarSystem({ dailyKwh: 20, assumptions: { peakSunHours: 6.5 } })
  const base = estimateSolarSystem({ dailyKwh: 20 })
  assert.ok(sunny.arrayKwp < base.arrayKwp)
})

test('rejects missing or implausible input', () => {
  assert.throws(() => estimateSolarSystem({}), SizingError)
  assert.throws(() => estimateSolarSystem({ dailyKwh: 10, assumptions: { peakSunHours: 12 } }), SizingError)
})
