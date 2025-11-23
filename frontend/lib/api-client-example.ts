/**
 * REAL DATA IMPLEMENTATION GUIDE
 * * Currently, the app uses static mock data (arrays inside components).
 * To use real data from your backend (Prisma/NeonDB), follow these steps:
 */

import { useEffect, useState } from "react"
import { getTournaments } from "./api" // Import from your existing api.ts

// ------------------------------------------------------------
// EXAMPLE: Replacing Mock Data in tournaments/page.tsx
// ------------------------------------------------------------

// 1. Define the type based on your Prisma schema or API response
interface Tournament {
  id: string
  name: string // Corresponds to 'title' in current mock
  startTime: string
  // Add other fields...
}

export function useRealTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Call the function from lib/api.ts
        const response = await getTournaments()

        if (response.success && response.data) {
          setTournaments(response.data)
        }
      } catch (err) {
        console.error("Failed to fetch tournaments:", err)
        setError("Failed to load tournaments")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { tournaments, loading, error }
}

// ------------------------------------------------------------
// HOW TO USE IN COMPONENT
// ------------------------------------------------------------

/*
export default function TournamentsPage() {
  // REPLACE THIS:
  // const mockTournaments = [...] 
  
  // WITH THIS:
  const { tournaments, loading, error } = useRealTournaments()

  if (loading) return <Spinner />
  if (error) return <div>Error: {error}</div>

  return (
    // Render your UI using 'tournaments' instead of 'mockTournaments'
    // Map fields accordingly: tournament.name -> title
  )
}
*/