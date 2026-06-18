import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yiqoxfuselnrciqrrtmq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcW94ZnVzZWxucmNpcXJydG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTE3ODgsImV4cCI6MjA5NTk4Nzc4OH0.xMMr2My2OvwzvLh0URokSj8_a2yI6p2MCafJw1Ridfo'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return _client
}
