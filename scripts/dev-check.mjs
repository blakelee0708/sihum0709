/**
 * 개발용 Supabase 점검. .env.local의 service_role로 읽습니다.
 *   node scripts/dev-check.mjs
 */
import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

async function rest(path) {
  const r = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return { status: r.status, body: await r.text() }
}

console.log('reports.started_at:', (await rest('reports?select=id,started_at&limit=1')).status)
console.log('queries:', (await rest('queries?select=id,user_id,exam_type,exam_name&limit=5')).body.slice(0, 500))
console.log('reports:', (await rest('reports?select=id,user_id,query_id,status,report_type&order=created_at.desc&limit=5')).body.slice(0, 800))
console.log('payments:', (await rest('payments?select=id,user_id,report_id,amount&order=paid_at.desc&limit=3')).body.slice(0, 400))

const u = await fetch(`${url}/auth/v1/admin/users?per_page=5`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
})
const users = await u.json()
console.log('users:', (users.users ?? []).map((x) => ({ id: x.id, email: x.email })))

console.log('started_at detail:', (await rest('reports?select=id,started_at&limit=1')).body)
console.log('reports cols:', (await rest('reports?select=*&limit=1')).body)
