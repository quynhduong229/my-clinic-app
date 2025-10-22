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

type Patient = {
  id: string
  name: string
}

type Doctor = {
  id: string
  name: string
  specialty: string | null
}

export default function ClinicDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [inNetworkDoctors, setInNetworkDoctors] = useState<Doctor[]>([])
  const [outNetworkDoctors, setOutNetworkDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [newPatientName, setNewPatientName] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [newDate, setNewDate] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [assigningDoctorFor, setAssigningDoctorFor] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const id = localStorage.getItem("clinicId")
    if (!id) {
      router.push("/login")
      return
    }
    setClinicId(id)
    fetchAppointments(id)
    fetchPatients(id)
    fetchDoctors(id)
  }, [])

  // --- Fetch appointments ---
  const fetchAppointments = async (id: string) => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("clinic_id", id)
      .order("date", { ascending: true })

    if (error) console.error("Error fetching appointments:", error)
    else if (data) setAppointments(data)
    setLoading(false)
  }

  // --- Fetch patients ---
  const fetchPatients = async (id: string) => {
    const { data, error } = await supabase
      .from("patients")
      .select("id,name")
      .eq("clinic_id", id)
      .order("name", { ascending: true })

    if (error) console.error("Error fetching patients:", error)
    else if (data) setPatients(data)
  }

  // --- Fetch doctors and categorize ---
  const fetchDoctors = async (clinicId: string) => {
    // 1️⃣ Get all doctor_ids assigned to appointments for this clinic
    const { data: apptData, error: apptError } = await supabase
      .from("appointments")
      .select("doctor_id")
      .eq("clinic_id", clinicId)
      .not("doctor_id", "is", null)

    if (apptError) {
      console.error("Error fetching appointments for doctors:", apptError)
      return
    }

    const inNetworkIds = Array.from(new Set(apptData?.map(a => a.doctor_id)))

    // 2️⃣ Get all doctors
    const { data: allDoctors, error: doctorsError } = await supabase
      .from("doctors")
      .select("id,name,specialty")

    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError)
      return
    }

    // 3️⃣ Split into in-network and out-of-network
    const inNetwork = allDoctors?.filter(d => inNetworkIds.includes(d.id)) || []
    const outNetwork = allDoctors?.filter(d => !inNetworkIds.includes(d.id)) || []

    setInNetworkDoctors(inNetwork)
    setOutNetworkDoctors(outNetwork)
  }

  // --- Add new patient ---
  const addPatient = async () => {
    if (!newPatientName) return alert("Please enter a patient name")
    if (!clinicId) return alert("Clinic ID not found — please log in again.")

    const { data, error } = await supabase
      .from("patients")
      .insert([{ name: newPatientName, clinic_id: clinicId }])
      .select()

    if (error) console.error("Error adding patient:", error)
    else if (data && data.length > 0) {
      setPatients(prev => [...prev, ...data])
      setSelectedPatient(data[0].id)
      setNewPatientName("")
    }
  }

  // --- Create appointment ---
  const createAppointment = async () => {
    if (!selectedPatient || !newDate || !clinicId) return alert("Select patient & date")

    const { error } = await supabase
      .from("appointments")
      .insert({
        clinic_id: clinicId,
        patient_id: selectedPatient,
        date: new Date(newDate).toISOString(),
        status: "open",
        notes: newNotes || null,
      })

    if (error) console.error("Error creating appointment:", error)
    else {
      fetchAppointments(clinicId)
      setNewDate("")
      setNewNotes("")
      setSelectedPatient("")
    }
  }

  // --- Assign doctor ---
  const assignDoctorToAppointment = async (appointmentId: string, doctorId: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ doctor_id: doctorId, status: "booked" })
      .eq("id", appointmentId)

    if (error) console.error(error)
    else {
      fetchAppointments(clinicId!)
      fetchDoctors(clinicId!)
      setAssigningDoctorFor(null)
    }
  }

  const toggleAssignDoctor = (appointmentId: string) => {
    setAssigningDoctorFor(assigningDoctorFor === appointmentId ? null : appointmentId)
  }

  const goHome = () => {
    localStorage.removeItem("clinicId")
    router.push("/login")
  }

  if (loading) return <p className="p-6">Loading...</p>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clinic Dashboard</h1>

      {/* --- Create Appointment --- */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Create New Appointment</h2>
        <div className="flex flex-col gap-2 mb-4">
          <label>Patient:</label>
          <select
            value={selectedPatient}
            onChange={e => setSelectedPatient(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select a patient</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <label>Date & Time:</label>
          <input
            type="datetime-local"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="p-2 border rounded"
          />

          <label>Notes (optional):</label>
          <input
            type="text"
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            className="p-2 border rounded"
          />

          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={createAppointment}
          >
            Create Appointment
          </button>
        </div>

        {/* --- Add New Patient --- */}
        <h2 className="text-xl font-semibold mb-2">Add New Patient</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Patient name"
            value={newPatientName}
            onChange={e => setNewPatientName(e.target.value)}
            className="p-2 border rounded flex-1"
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={addPatient}
          >
            Add Patient
          </button>
        </div>
      </section>

      {/* --- Appointments List --- */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments yet.</p>
        ) : (
          <ul className="space-y-4">
            {appointments.map(a => {
              const patient = patients.find(p => p.id === a.patient_id)
              const doctor = inNetworkDoctors.concat(outNetworkDoctors).find(d => d.id === a.doctor_id)
              return (
                <li key={a.id} className="p-4 border rounded shadow">
                  <p><strong>Date:</strong> {new Date(a.date).toLocaleString()}</p>
                  <p><strong>Patient:</strong> {patient?.name ?? a.patient_id}</p>
                  <p><strong>Doctor:</strong> {doctor?.name ?? "Not assigned"}</p>
                  <p><strong>Status:</strong> {a.status}</p>
                  {a.notes && <p><strong>Notes:</strong> {a.notes}</p>}

                  <button
                    className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => toggleAssignDoctor(a.id)}
                  >
                    Add Doctor
                  </button>

                  {assigningDoctorFor === a.id && (
                    <div className="mt-2 p-2 border rounded ">
                      <h4 className="font-semibold mb-1">In-network Doctors</h4>
                      {inNetworkDoctors.map(d => (
                        <div key={d.id} className="flex justify-between items-center mb-1">
                          <span>{d.name}</span>
                          <button
                            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            onClick={() => assignDoctorToAppointment(a.id, d.id)}
                          >
                            Assign
                          </button>
                        </div>
                      ))}

                      <h4 className="font-semibold mt-2 mb-1">Out-of-network Doctors</h4>
                      {outNetworkDoctors.map(d => (
                        <div key={d.id} className="flex justify-between items-center mb-1">
                          <span>{d.name}</span>
                          <button
                            className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            onClick={() => assignDoctorToAppointment(a.id, d.id)}
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <button
        className="mt-6 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        onClick={goHome}
      >
        Go Back to Home (Login)
      </button>
    </div>
  )
}
