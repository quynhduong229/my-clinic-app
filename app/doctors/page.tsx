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

export default function DoctorPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const id = localStorage.getItem("doctorId")
    if (!id) {
      router.push("/login")
      return
    }
    setDoctorId(id)

    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", id) // only show this doctor’s appointments
        .order("date", { ascending: true })

      if (error) console.error(error)
      else if (data) setAppointments(data)

      setLoading(false)
    }

    fetchAppointments()
  }, [])

  const cancelBooking = async (appointmentId: string) => {
    if (!doctorId) return
    const { error } = await supabase
      .from("appointments")
      .update({ doctor_id: null, status: "open" })
      .eq("id", appointmentId)
      .eq("doctor_id", doctorId) // extra safety check

    if (error) console.error("Error cancelling booking:", error)
    else
      setAppointments((prev) =>
        prev.filter((a) => a.id !== appointmentId)
      )
  }

  const goHome = () => {
    localStorage.removeItem("doctorId")
    router.push("/login")
  }

  if (loading) return <p className="p-6">Loading appointments...</p>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Booked Appointments</h1>

      {appointments.length === 0 ? (
        <p>No appointments booked yet.</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {appointments.map((a) => (
            <li
              key={a.id}
              className="p-4 border rounded-lg shadow hover:shadow-lg transition"
            >
              <p>
                <strong>Date:</strong>{" "}
                {new Date(a.date).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p><strong>Patient ID:</strong> {a.patient_id}</p>
              <p><strong>Clinic ID:</strong> {a.clinic_id}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`font-semibold ${
                    a.status === "booked" ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {a.status}
                </span>
              </p>
              {a.notes && <p><strong>Notes:</strong> {a.notes}</p>}

              <button
                className="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => cancelBooking(a.id)}
              >
                Cancel Booking
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-4">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => router.push("/appointments")}
        >
          Go Back to Appointments
        </button>

        <button
          className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          onClick={goHome}
        >
          Go Back to Home (Login)
        </button>
      </div>
    </div>
  )
}
