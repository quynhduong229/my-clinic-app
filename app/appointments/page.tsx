"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

type Appointment = {
  id: string
  date: string
  status: string
  notes: string | null
  patient_id: string
  doctor_id: string | null
  clinic_id: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const router = useRouter()

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "open") // only open appointments
      .order("date", { ascending: true })

    if (error) console.error(error)
    else if (data) setAppointments(data)

    setLoading(false)
  }

  useEffect(() => {
    const id = localStorage.getItem("doctorId")
    if (!id) {
      setLoading(false)
      return
    }
    setDoctorId(id)
    fetchAppointments()
  }, [])

  const pickAppointment = async (appointmentId: string) => {
    if (!doctorId) return
    const { error } = await supabase
      .from("appointments")
      .update({ doctor_id: doctorId, status: "booked" })
      .eq("id", appointmentId)

    if (error) console.error(error)
    else {
      // Refresh the appointments list to show only remaining open slots
      fetchAppointments()
    }
  }

  const handleDoneBooking = () => {
    router.push("/doctors")
  }

  if (loading) return <p className="p-6">Loading appointments...</p>

  if (!doctorId)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-red-500 mb-4">Please login first.</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => router.push("/login")}
        >
          Login
        </button>
        <br/>
        <p className="text-red-500 mb-4">Test clinic name:</p>
        <p className="text-red-500 mb-4">Smile Dental Care</p>
        <p className="text-red-500 mb-4">Bright Smiles Clinic</p>
        <p className="text-red-500 mb-4">Healthy Teeth Center</p>

        <p className="text-red-500 mb-4">Test doctor name:</p>
        <p className="text-red-500 mb-4">Dr. Alice Smith</p>
        <p className="text-red-500 mb-4">Dr. John Doe</p>
        <p className="text-red-500 mb-4">Dr. Sarah Lee</p>
        

      </div>
    )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Appointments</h1>

      {appointments.length === 0 ? (
        <p className="text-center text-gray-500">No appointments available.</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {appointments.map((a) => (
            <li key={a.id} className="p-4 border rounded-lg shadow">
              <p><strong>Date:</strong> {new Date(a.date).toLocaleString()}</p>
              <p><strong>Patient ID:</strong> {a.patient_id}</p>
              <p><strong>Clinic ID:</strong> {a.clinic_id}</p>
              <p><strong>Status:</strong> {a.status}</p>
              {a.notes && <p><strong>Notes:</strong> {a.notes}</p>}

              <button
                className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => pickAppointment(a.id)}
              >
                Pick this appointment
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={handleDoneBooking}
      >
        Show my Booking
      </button>
    </div>
  )
}
