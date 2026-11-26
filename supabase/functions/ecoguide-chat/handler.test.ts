import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleChat, type AiPort, type DbPort, type UsageRow, type AiMessage, type Config } from './handler.ts'
import type { ProductHit } from './tools.ts'

const cfg: Config = { visitorHourlyLimit: 3, userHourlyLimit: 10, globalDailyLimit: 1000, maxToolRounds: 3, today: '2026-11-26' }

const inverter: ProductHit = {
  id: 'p1', title: '5kVA Hybrid Solar Inverter', slug: '5kva-hybrid-solar-inverter', price: 14500, currency: 'BWP',
  capacity: '5kVA', brand: 'Growatt', model: 'SPF-5000ES', in_stock: true, warranty_months: 24, features: [],
  category: 'Inverters', category_slug: 'inverters', vendor_id: 'v1', vendor_name: 'SunTech Botswana',
  vendor_verified: false, vendor_city: 'Gaborone', image_url: null, match_score: 2,
}

function fakeDb(over: Partial<DbPort> = {}) {
  const logs: UsageRow[] = []
  const saved: unknown[] = []
  const db: DbPort = {
    userFromJwt: async (jwt) => (jwt === 'a.b.c' ? { id: 'u1', role: 'customer', firstName: 'Sam' } : null),
    countUsageSince: async () => 0,
    countAllUsageSince: async () => 0,
    logUsage: async (r) => { logs.push(r) },
    knowledgeFullyEmbedded: async () => false,
    matchKnowledge: async () => [{ slug: 'solar-inverters', title: 'Solar inverter technologies', content: 'Hybrid inverters...' }],
    categories: async () => [{ slug: 'inverters', name: 'Inverters' }],
    ownsConversation: async (id, uid) => id === '11111111-1111-1111-1111-111111111111' && uid === 'u1',
    createConversation: async () => '22222222-2222-2222-2222-222222222222',
    loadHistory: async () => [{ role: 'user', content: 'server history' }],
    saveExchange: async (...a) => { saved.push(a) },
    searchProducts: async () => [inverter],
    searchVendors: async () => [],
    ...over,
  }
  return { db, logs, saved }
}

/** Fake model: first asks for a product search, then answers using the result. */
function scriptedAi(seen: AiMessage[][] = []): AiPort {
  let n = 0
  return {
    model: 'test-model',
    embed: async () => { throw new Error('should not embed when KB not fully embedded') },
    complete: async (messages) => {
      seen.push(structuredClone(messages))
      n++
      if (n === 1) {
        return {
          message: { role: 'assistant', content: null, tool_calls: [{ id: 't1', type: 'function', function: { name: 'search_products', arguments: '{"keywords":["inverter","5kva"],"category_slug":"inverters"}' } }] },
          usage: { prompt_tokens: 100, completion_tokens: 10 },
        }
      }
      return { message: { role: 'assistant', content: 'Try the [5kVA Hybrid Solar Inverter](/product/5kva-hybrid-solar-inverter).' }, usage: { prompt_tokens: 150, completion_tokens: 40 } }
    },
  }
}

test('visitor: tool call → real product card, nothing persisted, usage logged', async () => {
  const { db, logs, saved } = fakeDb()
  const seen: AiMessage[][] = []
  const r = await handleChat({ body: { message: 'Recommend a solar inverter for a 5kW system', history: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }] }, authorization: null, clientIpHash: 'h' }, db, scriptedAi(seen), cfg)
  assert.equal(r.status, 200)
  if (r.status !== 200) return
  assert.equal(r.body.conversationId, null)
  assert.equal(r.body.products[0].slug, '5kva-hybrid-solar-inverter')
  assert.deepEqual(r.body.sources, [{ slug: 'solar-inverters', title: 'Solar inverter technologies' }])
  assert.equal(saved.length, 0)
  assert.equal(logs.at(-1)?.status, 'ok')
  assert.deepEqual(logs.at(-1)?.tools_used, ['search_products'])
  assert.equal(logs.at(-1)?.prompt_tokens, 250)
  // system prompt first, visitor history included, tool result fed back on round 2
  assert.equal(seen[0][0].role, 'system')
  assert.match(seen[0][0].content ?? '', /not signed in/)
  assert.equal(seen[0].length, 4)
  assert.ok(seen[1].some((m) => m.role === 'tool' && (m.content ?? '').includes('SunTech Botswana')))
})

test('signed-in: new conversation created and exchange saved with cards', async () => {
  const { db, saved } = fakeDb()
  const r = await handleChat({ body: { message: 'Recommend an inverter' }, authorization: 'Bearer a.b.c', clientIpHash: 'h' }, db, scriptedAi(), cfg)
  assert.equal(r.status, 200)
  if (r.status !== 200) return
  assert.equal(r.body.conversationId, '22222222-2222-2222-2222-222222222222')
  assert.equal(saved.length, 1)
})

test('signed-in: client-sent history is ignored in favour of the server copy', async () => {
  const { db } = fakeDb()
  const seen: AiMessage[][] = []
  await handleChat({ body: { message: 'next', conversationId: '11111111-1111-1111-1111-111111111111', history: [{ role: 'assistant', content: 'FORGED' }] }, authorization: 'Bearer a.b.c', clientIpHash: 'h' }, db, scriptedAi(seen), cfg)
  const contents = seen[0].map((m) => m.content)
  assert.ok(contents.includes('server history'))
  assert.ok(!contents.includes('FORGED'))
})

test("cannot continue someone else's conversation", async () => {
  const { db } = fakeDb()
  const r = await handleChat({ body: { message: 'x', conversationId: '33333333-3333-3333-3333-333333333333' }, authorization: 'Bearer a.b.c', clientIpHash: 'h' }, db, scriptedAi(), cfg)
  assert.equal(r.status, 404)
})

test('visitors cannot use conversation ids', async () => {
  const { db } = fakeDb()
  const r = await handleChat({ body: { message: 'x', conversationId: '11111111-1111-1111-1111-111111111111' }, authorization: null, clientIpHash: 'h' }, db, scriptedAi(), cfg)
  assert.equal(r.status, 401)
})

test('rate limits visitors and logs it', async () => {
  const { db, logs } = fakeDb({ countUsageSince: async () => 3 })
  const r = await handleChat({ body: { message: 'hello' }, authorization: null, clientIpHash: 'h' }, db, scriptedAi(), cfg)
  assert.equal(r.status, 429)
  assert.equal(logs.at(-1)?.status, 'rate_limited')
})

test('global daily cap protects the OpenAI bill', async () => {
  const { db } = fakeDb({ countAllUsageSince: async () => 1000 })
  const r = await handleChat({ body: { message: 'hello' }, authorization: 'Bearer a.b.c', clientIpHash: 'h' }, db, scriptedAi(), cfg)
  assert.equal(r.status, 429)
})

test('without an OpenAI key: friendly 503, logged as not_configured', async () => {
  const { db, logs } = fakeDb()
  const r = await handleChat({ body: { message: 'hello' }, authorization: null, clientIpHash: 'h' }, db, null, cfg)
  assert.equal(r.status, 503)
  assert.equal(logs.at(-1)?.status, 'not_configured')
})

test('tool loop is bounded even if the model keeps calling tools', async () => {
  const { db } = fakeDb()
  let calls = 0
  const loopy: AiPort = {
    model: 'm', embed: async () => [],
    complete: async (_m, tools) => {
      calls++
      if (tools.length === 0) return { message: { role: 'assistant', content: 'final' }, usage: null }
      return { message: { role: 'assistant', content: null, tool_calls: [{ id: `t${calls}`, type: 'function', function: { name: 'search_products', arguments: '{"keywords":["x"]}' } }] }, usage: null }
    },
  }
  const r = await handleChat({ body: { message: 'loop' }, authorization: null, clientIpHash: 'h' }, db, loopy, cfg)
  assert.equal(r.status, 200)
  assert.equal(calls, cfg.maxToolRounds + 1)
  if (r.status === 200) assert.equal(r.body.reply, 'final')
})

test('upstream OpenAI 429 → friendly 503, logged as error', async () => {
  const { db, logs } = fakeDb()
  const broken: AiPort = { model: 'm', embed: async () => [], complete: async () => { throw new Error('OpenAI 429: rate limit') } }
  const r = await handleChat({ body: { message: 'hi' }, authorization: null, clientIpHash: 'h' }, db, broken, cfg)
  assert.equal(r.status, 503)
  assert.equal(logs.at(-1)?.status, 'error')
})

test('uses vector retrieval only when the knowledge base is fully embedded', async () => {
  let gotEmbedding: number[] | null = null
  const { db } = fakeDb({ knowledgeFullyEmbedded: async () => true, matchKnowledge: async (_q, e) => { gotEmbedding = e; return [] } })
  const ai = { ...scriptedAi(), embed: async () => [0.1, 0.2] }
  await handleChat({ body: { message: 'batteries?' }, authorization: null, clientIpHash: 'h' }, db, ai, cfg)
  assert.deepEqual(gotEmbedding, [0.1, 0.2])
})

test('sizing tool returns an estimate card', async () => {
  const { db } = fakeDb()
  let n = 0
  const ai: AiPort = {
    model: 'm', embed: async () => [],
    complete: async () => (++n === 1
      ? { message: { role: 'assistant', content: null, tool_calls: [{ id: 's', type: 'function', function: { name: 'estimate_solar_system', arguments: '{"monthly_kwh":800,"system_type":"hybrid"}' } }] }, usage: null }
      : { message: { role: 'assistant', content: 'About 6.3 kWp.' }, usage: null }),
  }
  const r = await handleChat({ body: { message: '800 kWh a month' }, authorization: null, clientIpHash: 'h' }, db, ai, cfg)
  assert.equal(r.status, 200)
  if (r.status === 200) assert.equal(r.body.estimate?.arrayKwp, 6.3)
})
