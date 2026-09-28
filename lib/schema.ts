import { z } from 'zod'

// Today's date as YYYY-MM-DD in the user's LOCAL timezone.
// (toISOString() would give the UTC date, which can be off by a day.)
export function todayLocal(): string {
  const d = new Date()
  const offsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offsetMs).toISOString().split('T')[0]
}

export const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Please choose a service'),
  date: z
    .string()
    .min(1, 'Please pick a date')
    // YYYY-MM-DD strings compare correctly as plain strings
    .refine((d) => d >= todayLocal(), 'Date cannot be in the past'),
  time: z.string().min(1, 'Please pick a time'),
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.string().trim().email('Please enter a valid email address'),
})

export type BookingFormValues = z.infer<typeof bookingSchema>