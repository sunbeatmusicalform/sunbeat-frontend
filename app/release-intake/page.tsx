"use client"

import React, { useState } from "react"

export default function ReleaseIntake() {
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [email, setEmail] = useState("")
  const [genre, setGenre] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus("Submitting...")

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          email,
          genre,
          notes,
        }),
      })

      const raw = await res.text()

      // tenta entender se veio JSON
      let data: any = null
      try {
        data = JSON.parse(raw)
      } catch {
        // raw não é json
      }

      if (!res.ok) {
        const msg =
          data?.error ||
          data?.detail ||
          data?.message ||
          raw ||
          "Submission failed"
        throw new Error(`Request failed (${res.status}): ${msg}`)
      }

      setStatus("Success ✅")
      // opcional: limpar
      // setTitle(""); setArtist(""); setEmail(""); setGenre(""); setNotes("")
    } catch (err: any) {
      setStatus(`Error ❌ ${err?.message ?? "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900/60 border border-gray-800 p-8 rounded-xl w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6">Release Intake</h1>

        <input
          type="text"
          placeholder="Release Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
          required
        />

        <input
          type="text"
          placeholder="Artist Name"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
          required
        />

        <input
          type="email"
          placeholder="Contact Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
          required
        />

        <input
          type="text"
          placeholder="Primary Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full mb-3 p-3 rounded bg-black border border-gray-700"
        />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-black border border-gray-700 min-h-[120px]"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white text-black p-3 rounded font-semibold disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>

        {status && (
          <p className="mt-4 text-center text-gray-300 break-words">
            {status}
          </p>
        )}
      </form>
    </main>
  )
}