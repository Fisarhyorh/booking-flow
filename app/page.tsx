'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase, Service } from '@/lib/supabase'
import { bookingSchema, BookingFormValues, todayLocal } from '@/lib/schema'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
]

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600 mt-1">{message}</p>
}

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([])
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<{
    serviceName: string
    date: string
    time: string
    name: string
    email: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { serviceId: '', date: '', time: '', name: '', email: '' },
  })

  const serviceId = watch('serviceId')
  const date = watch('date')

  // Load services once
  useEffect(() => {
    async function loadServices() {
      const { data, error } = await supabase.from('services').select('*')
      if (error) setServerError(error.message)
      else setServices(data ?? [])
    }
    loadServices()
  }, [])

  // Pre-select the first service once the options exist in the DOM
  useEffect(() => {
    if (services.length > 0 && !serviceId) setValue('serviceId', services[0].id)
  }, [services, serviceId, setValue])

  // Whenever service or date changes (or a conflict forces a refresh),
  // fetch which times are already taken and clear any selected time
  useEffect(() => {
    setValue('time', '')
    if (!serviceId || !date) {
      setBookedTimes([])
      return
    }

    let cancelled = false
    async function loadBookedTimes() {
      setLoadingSlots(true)
      const { data, error } = await supabase
        .from('booked_slots')
        .select('booking_time')
        .eq('service_id', serviceId)
        .eq('booking_date', date)

      if (cancelled) return
      if (error) {
        setServerError(error.message)
      } else {
        // Postgres returns "09:00:00", our slots are "09:00"
        setBookedTimes((data ?? []).map((r) => r.booking_time.slice(0, 5)))
      }
      setLoadingSlots(false)
    }
    loadBookedTimes()

    return () => {
      cancelled = true
    }
  }, [serviceId, date, refreshKey, setValue])

  // If the chosen date is today, times that have already passed are unavailable
  const now = new Date()
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`
  const isToday = date === todayLocal()

  async function onSubmit(values: BookingFormValues) {
    setServerError(null)

    const { error } = await supabase.from('bookings').insert({
      service_id: values.serviceId,
      name: values.name,
      email: values.email,
      booking_date: values.date,
      booking_time: values.time,
    })

    if (error) {
      if (error.code === '23505') {
        // Someone else grabbed it between page load and submit
        setServerError('That slot was just taken. Please choose another time.')
        setRefreshKey((k) => k + 1)
      } else {
        setServerError(error.message)
      }
      return
    }

    setConfirmation({
      serviceName: services.find((s) => s.id === values.serviceId)?.name ?? 'Appointment',
      date: values.date,
      time: values.time,
      name: values.name,
      email: values.email,
    })
    reset({ serviceId: values.serviceId, date: '', time: '', name: '', email: '' })
  }

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400'

  if (confirmation) {
    // Parse as local time by adding T00:00:00, otherwise the date can shift a day
    const prettyDate = new Date(confirmation.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return (
      <div className="max-w-md mx-auto p-6 mt-10">
        <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl mb-4">
          ✓
        </div>
        <h1 className="text-2xl font-semibold mb-1">You&apos;re booked, {confirmation.name}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your booking details are below. Save them for your records.
        </p>

        <div className="border border-gray-200 rounded-md divide-y divide-gray-200 text-sm">
          <div className="flex justify-between p-3">
            <span className="text-gray-500">Service</span>
            <span className="font-medium">{confirmation.serviceName}</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">{prettyDate}</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-gray-500">Time</span>
            <span className="font-medium">{confirmation.time}</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-gray-500">Contact</span>
            <span className="font-medium">{confirmation.email}</span>
          </div>
        </div>

        <button
          onClick={() => setConfirmation(null)}
          className="mt-6 w-full border border-gray-300 text-sm px-4 py-2 rounded-md"
        >
          Book another appointment
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-10">
      <h1 className="text-2xl font-semibold mb-6">Book an appointment</h1>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {serverError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm mb-1">Service</label>
          <select {...register('serviceId')} className={inputClass}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.serviceId?.message} />
        </div>

        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            min={todayLocal()}
            {...register('date')}
            className={inputClass}
          />
          <FieldError message={errors.date?.message} />
        </div>

        <div>
          <label className="block text-sm mb-1">
            Time {loadingSlots && <span className="text-gray-400">(checking availability…)</span>}
          </label>
          <select
            {...register('time')}
            className={inputClass}
            disabled={!date || loadingSlots}
          >
            <option value="">{date ? 'Select a time' : 'Pick a date first'}</option>
            {TIME_SLOTS.map((t) => {
              const booked = bookedTimes.includes(t)
              const passed = isToday && t <= nowHHMM
              return (
                <option key={t} value={t} disabled={booked || passed}>
                  {t}
                  {booked ? ' (booked)' : passed ? ' (passed)' : ''}
                </option>
              )
            })}
          </select>
          <FieldError message={errors.time?.message} />
        </div>

        <div>
          <label className="block text-sm mb-1">Name</label>
          <input type="text" {...register('name')} className={inputClass} />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" {...register('email')} className={inputClass} />
          <FieldError message={errors.email?.message} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-900 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
        >
          {isSubmitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </form>
    </div>
  )
}