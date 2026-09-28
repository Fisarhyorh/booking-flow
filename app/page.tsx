'use client'

import { useEffect, useState } from 'react'
import { supabase, Service } from '@/lib/supabase'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
]

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadServices() {
      const { data, error } = await supabase.from('services').select('*')
      if (error) {
        setError(error.message)
      } else {
        setServices(data ?? [])
        if (data && data.length > 0) setServiceId(data[0].id)
      }
    }
    loadServices()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    // Note: no .select() after insert. The bookings table has no public
    // read policy (it holds names/emails), so asking for the row back would fail.
    const { error } = await supabase.from('bookings').insert({
      service_id: serviceId,
      name,
      email,
      booking_date: date,
      booking_time: time,
    })

    if (error) {
      // 23505 = unique violation, i.e. someone already booked that slot
      if (error.code === '23505') {
        setError('That time slot was just taken. Please pick another.')
      } else {
        setError(error.message)
      }
    } else {
      setSuccess(true)
      setName('')
      setEmail('')
      setDate('')
      setTime('')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-10">
      <h1 className="text-2xl font-semibold mb-6">Book an appointment</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          Booking confirmed!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Service</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Time</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            required
          >
            <option value="">Select a time</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gray-900 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
        >
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </form>
    </div>
  )
}