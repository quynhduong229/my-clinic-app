"use client"

import { useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function NewAppointmentPage() {
  const router = useRouter()
  const [patientId, setPatientId] = useState("")
  const [clinicId, setClinicId] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [date, setDate] = useState("")
  const [notes, setNotes] = useState("")

  const createAppointment = async () => {
    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinicId,
      patient_id: patientId,
      doctor_id: doctorId || null,
      date,
      notes
    })

    if (error) alert(error.message)
    else router.push("/appointments")
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">New Appointment</h1>
      <form onSubmit={(e) => { e.preventDefault(); createAppointment() }} className="space-y-3">
        <input type="text" placeholder="Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} className="border p-2 w-full" />
        <input type="text" placeholder="Clinic ID" value={clinicId} onChange={(e) => setClinicId(e.target.value)} className="border p-2 w-full" />
        <input type="text" placeholder="Doctor ID (optional)" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="border p-2 w-full" />
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2 w-full" />
        <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="border p-2 w-full" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create</button>
      </form>
    </div>
  )
}
