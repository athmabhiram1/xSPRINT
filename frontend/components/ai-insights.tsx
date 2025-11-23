"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, Zap, Target, BrainCircuit } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Insights {
    summary: string
    keyStats: string[]
    predictions: string[]
}

export function AIInsights({ tournamentId }: { tournamentId: string }) {
    const [insights, setInsights] = useState<Insights | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/ai/insights/${tournamentId}`)
                const data = await res.json()
                if (data.success) {
                    setInsights(data.data)
                }
            } catch (error) {
                console.error("Failed to fetch AI insights", error)
            } finally {
                setLoading(false)
            }
        }

        fetchInsights()
    }, [tournamentId])

    if (loading) {
        return (
            <div className="w-full h-[250px] rounded-2xl bg-muted/50 animate-pulse border border-border/50" />
        )
    }

    if (!insights) return null

    return (
        <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>

            <Card className="relative bg-black/90 border-white/10 text-white overflow-hidden backdrop-blur-xl rounded-2xl">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <CardHeader className="pb-2 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
                                <BrainCircuit className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                                    Tournament Intelligence
                                </CardTitle>
                                <p className="text-xs text-purple-300/80 font-medium tracking-wide uppercase">Powered by Gemini AI</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10 px-3 py-1">
                            <Sparkles className="w-3 h-3 mr-1.5" /> Live Analysis
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    {/* Summary Section */}
                    <div className="relative">
                        <p className="text-sm md:text-base text-gray-300 leading-relaxed font-light">
                            {insights.summary}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Key Stats */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Key Statistics
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {insights.keyStats.map((stat, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        <span className="text-xs font-medium text-gray-200">{stat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Predictions */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                                <Target className="w-4 h-4" /> AI Predictions
                            </h4>
                            <ul className="space-y-2">
                                {insights.predictions.map((pred, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                        <Zap className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                                        <span>{pred}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
