
"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([])
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([])
  const [nameInput, setNameInput] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const [doctorRes, clinicRes] = await Promise.all([
        supabase.from("doctors").select("id,name"),
        supabase.from("clinics").select("id,name"),
      ])

      if (doctorRes.error) console.error(doctorRes.error)
      if (clinicRes.error) console.error(clinicRes.error)

      if (doctorRes.data) setDoctors(doctorRes.data)
      if (clinicRes.data) setClinics(clinicRes.data)
    }

    fetchData()
  }, [])

  const handleLogin = () => {
    if (!nameInput.trim()) return alert("Please enter a name")

    const doctor = doctors.find(
      (d) => d.name.toLowerCase() === nameInput.toLowerCase()
    )
    const clinic = clinics.find(
      (c) => c.name.toLowerCase() === nameInput.toLowerCase()
    )

    if (doctor) {
      localStorage.setItem("doctorId", doctor.id)
      router.push("/appointments")
    } else if (clinic) {
      localStorage.setItem("clinicId", clinic.id)
      router.push("/clinic-dashboard")
    } else {
      alert("No doctor or clinic found with that name")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      <input
        type="text"
        placeholder="Enter your name..."
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        className="mb-4 p-2 border rounded w-64"
      />

      <button
        onClick={handleLogin}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Login
      </button>
    </div>
  )
}

