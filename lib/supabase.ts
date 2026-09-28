import { createClient } from '@supabase/supabase-js'

// Add these to .env.local at the project root:
// NEXT_PUBLIC_SUPABASE_URL=your-project-url
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export type Service = {
  id: string
  name: string
  duration_minutes: number
}

export type BookedSlot = {
  service_id: string
  booking_date: string
  booking_time: string
}