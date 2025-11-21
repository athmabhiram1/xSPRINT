"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const courts = ["Court 1", "Court 2", "Court 3", "Court 4"]
const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"]

const schedule = {
  "Court 1": [
    { time: "9:00 AM", match: "Saina vs Jwala", category: "Women's Singles" },
    { time: "11:00 AM", match: "REST", category: "Buffer" },
    { time: "12:00 PM", match: "Sindhu vs Srikanth", category: "Mixed" },
  ],
  "Court 2": [
    { time: "10:00 AM", match: "Prakash vs Chirag", category: "Men's Doubles" },
    { time: "2:00 PM", match: "Ashwini vs Tanvi", category: "Women's Doubles" },
  ],
  "Court 3": [
    { time: "8:00 AM", match: "Qualifying Round A", category: "Open" },
    { time: "3:00 PM", match: "Qualifying Round B", category: "Open" },
  ],
}

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container-max py-16">
        <div className="mb-8">
          <h1 className="mb-2">Court Schedule</h1>
          <p className="text-muted-foreground">Multi-court tournament schedule for Elite Badminton Championship</p>
        </div>

        {/* Schedule Grid */}
        <div className="overflow-x-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: "auto repeat(4, 1fr)" }}>
            {/* Header */}
            <div className="font-semibold text-sm p-3 bg-muted rounded-l-lg">Time</div>
            {courts.map((court) => (
              <div key={court} className="font-semibold text-sm p-3 bg-muted text-center">
                {court}
              </div>
            ))}

            {/* Time Slots */}
            {timeSlots.map((time, idx) => (
              <div key={time}>
                <div className="font-semibold text-sm p-3 bg-muted text-center">{time}</div>
                {courts.map((court) => {
                  const match = schedule[court as keyof typeof schedule]?.find((m) => m.time === time)
                  return (
                    <div
                      key={`${court}-${time}`}
                      className={`p-3 text-sm text-center border border-border rounded ${
                        match?.category === "Buffer"
                          ? "bg-yellow-100 text-yellow-900"
                          : match
                            ? "bg-primary/10 text-primary font-semibold"
                            : "bg-muted"
                      }`}
                    >
                      {match ? (
                        <div>
                          <p className="font-semibold">{match.match}</p>
                          <p className="text-xs">{match.category}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">-</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
