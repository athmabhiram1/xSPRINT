"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Court {
    id: string
    name: string
    utilization: number
}

interface Match {
    id: string
    round: number
    playerA: string
    playerB: string
    court: string
    startTime: string
    duration: number
    status: 'scheduled' | 'ongoing' | 'completed'
}

interface TimeSlot {
    time: string
    matches: { [courtId: string]: Match | null }
}

export default function ScheduleOptimizerPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [courts, setCourts] = useState<Court[]>([
        { id: '1', name: 'Court 1', utilization: 85 },
        { id: '2', name: 'Court 2', utilization: 92 },
        { id: '3', name: 'Court 3', utilization: 78 },
        { id: '4', name: 'Court 4', utilization: 65 },
    ])

    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
        {
            time: '09:00',
            matches: {
                '1': { id: 'm1', round: 1, playerA: 'Player A', playerB: 'Player B', court: '1', startTime: '09:00', duration: 45, status: 'completed' },
                '2': { id: 'm2', round: 1, playerA: 'Player C', playerB: 'Player D', court: '2', startTime: '09:00', duration: 45, status: 'completed' },
                '3': { id: 'm3', round: 1, playerA: 'Player E', playerB: 'Player F', court: '3', startTime: '09:00', duration: 45, status: 'ongoing' },
                '4': null,
            }
        },
        {
            time: '10:00',
            matches: {
                '1': { id: 'm4', round: 2, playerA: 'Player G', playerB: 'Player H', court: '1', startTime: '10:00', duration: 45, status: 'scheduled' },
                '2': { id: 'm5', round: 2, playerA: 'Player I', playerB: 'Player J', court: '2', startTime: '10:00', duration: 45, status: 'scheduled' },
                '3': null,
                '4': { id: 'm6', round: 1, playerA: 'Player K', playerB: 'Player L', court: '4', startTime: '10:00', duration: 45, status: 'scheduled' },
            }
        },
        {
            time: '11:00',
            matches: {
                '1': null,
                '2': { id: 'm7', round: 2, playerA: 'Player M', playerB: 'Player N', court: '2', startTime: '11:00', duration: 45, status: 'scheduled' },
                '3': { id: 'm8', round: 2, playerA: 'Player O', playerB: 'Player P', court: '3', startTime: '11:00', duration: 45, status: 'scheduled' },
                '4': null,
            }
        },
        {
            time: '12:00',
            matches: {
                '1': { id: 'm9', round: 3, playerA: 'Player Q', playerB: 'Player R', court: '1', startTime: '12:00', duration: 45, status: 'scheduled' },
                '2': null,
                '3': null,
                '4': { id: 'm10', round: 2, playerA: 'Player S', playerB: 'Player T', court: '4', startTime: '12:00', duration: 45, status: 'scheduled' },
            }
        },
    ])

    const [draggedMatch, setDraggedMatch] = useState<Match | null>(null)

    const getUtilizationColor = (utilization: number) => {
        if (utilization >= 90) return 'bg-red-500'
        if (utilization >= 75) return 'bg-yellow-500'
        if (utilization >= 50) return 'bg-green-500'
        return 'bg-blue-500'
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
            case 'ongoing': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
            case 'scheduled': return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
            default: return 'bg-gray-100 dark:bg-gray-800'
        }
    }

    const handleDragStart = (match: Match) => {
        setDraggedMatch(match)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = (timeSlot: string, courtId: string) => {
        if (!draggedMatch) return

        // Update the schedule
        setTimeSlots(prev => prev.map(slot => {
            // Remove from old position
            const newMatches = { ...slot.matches }
            Object.keys(newMatches).forEach(key => {
                if (newMatches[key]?.id === draggedMatch.id) {
                    newMatches[key] = null
                }
            })

            // Add to new position
            if (slot.time === timeSlot) {
                newMatches[courtId] = { ...draggedMatch, court: courtId, startTime: timeSlot }
            }

            return { ...slot, matches: newMatches }
        }))

        setDraggedMatch(null)
    }

    const avgUtilization = courts.reduce((sum, court) => sum + court.utilization, 0) / courts.length

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container-max">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-gradient mb-2">Schedule Optimizer</h1>
                    <p className="text-muted-foreground text-lg">
                        Visualize court schedules, optimize utilization, and drag-and-drop to reschedule matches
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="glass-card">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 gradient-primary rounded-lg">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Courts</p>
                                    <p className="text-2xl font-bold">{courts.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 gradient-secondary rounded-lg">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Scheduled Matches</p>
                                    <p className="text-2xl font-bold">
                                        {timeSlots.reduce((sum, slot) =>
                                            sum + Object.values(slot.matches).filter(m => m !== null).length, 0
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 gradient-accent rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Utilization</p>
                                    <p className="text-2xl font-bold">{avgUtilization.toFixed(0)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-500 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed</p>
                                    <p className="text-2xl font-bold">
                                        {timeSlots.reduce((sum, slot) =>
                                            sum + Object.values(slot.matches).filter(m => m?.status === 'completed').length, 0
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Court Utilization Heatmap */}
                <Card className="glass-card mb-8">
                    <CardHeader>
                        <CardTitle>Court Utilization Heatmap</CardTitle>
                        <CardDescription>Real-time utilization across all courts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {courts.map(court => (
                                <div key={court.id} className="card-3d p-4 rounded-lg border border-border">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold">{court.name}</h3>
                                        <Badge variant={court.utilization >= 90 ? 'destructive' : 'default'}>
                                            {court.utilization}%
                                        </Badge>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full ${getUtilizationColor(court.utilization)} transition-all duration-500`}
                                            style={{ width: `${court.utilization}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {court.utilization >= 90 ? 'Overutilized' :
                                            court.utilization >= 75 ? 'High usage' :
                                                court.utilization >= 50 ? 'Optimal' : 'Underutilized'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Gantt Chart Schedule */}
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Schedule Gantt Chart</CardTitle>
                                <CardDescription>Drag and drop matches to reschedule</CardDescription>
                            </div>
                            <Select value={selectedDate} onValueChange={setSelectedDate}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={new Date().toISOString().split('T')[0]}>Today</SelectItem>
                                    <SelectItem value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}>Tomorrow</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert className="mb-6">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Drag & Drop Enabled</AlertTitle>
                            <AlertDescription>
                                Click and drag matches to different time slots or courts to reschedule
                            </AlertDescription>
                        </Alert>

                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* Header Row */}
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                    <div className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Time
                                    </div>
                                    {courts.map(court => (
                                        <div key={court.id} className="font-semibold text-sm text-center">
                                            {court.name}
                                        </div>
                                    ))}
                                </div>

                                {/* Time Slots */}
                                {timeSlots.map((slot, idx) => (
                                    <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
                                        <div className="flex items-center font-medium text-sm">
                                            {slot.time}
                                        </div>
                                        {courts.map(court => {
                                            const match = slot.matches[court.id]
                                            return (
                                                <div
                                                    key={court.id}
                                                    className={`min-h-[80px] rounded-lg border-2 border-dashed transition-all ${match ? 'border-transparent' : 'border-border hover:border-primary/50'
                                                        }`}
                                                    onDragOver={handleDragOver}
                                                    onDrop={() => handleDrop(slot.time, court.id)}
                                                >
                                                    {match ? (
                                                        <div
                                                            draggable
                                                            onDragStart={() => handleDragStart(match)}
                                                            className={`p-3 rounded-lg border-2 cursor-move hover:scale-105 transition-transform ${getStatusColor(match.status)}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <Badge variant="outline" className="text-xs">R{match.round}</Badge>
                                                                <Badge variant={
                                                                    match.status === 'completed' ? 'default' :
                                                                        match.status === 'ongoing' ? 'secondary' : 'outline'
                                                                } className="text-xs">
                                                                    {match.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs font-medium truncate">{match.playerA}</p>
                                                            <p className="text-xs text-muted-foreground">vs</p>
                                                            <p className="text-xs font-medium truncate">{match.playerB}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                                            Empty
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex gap-4">
                            <Button className="glow-primary">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Save Schedule
                            </Button>
                            <Button variant="outline">
                                Auto-Optimize
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
