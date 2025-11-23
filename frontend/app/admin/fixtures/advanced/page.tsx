"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Users, Zap, AlertCircle, CheckCircle, RotateCcw, Eye } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Format = 'knockout' | 'roundrobin' | 'swiss' | 'double_elimination' | 'groups_then_playoff'
type SeedingStrategy = 'registration_order' | 'elo_rating' | 'historical_performance' | 'random' | 'manual'

interface FormatOption {
    value: Format
    label: string
    description: string
    icon: React.ReactNode
    recommended: string
}

const formats: FormatOption[] = [
    {
        value: 'knockout',
        label: 'Knockout',
        description: 'Single elimination bracket - lose once and you\'re out',
        icon: <Trophy className="w-5 h-5" />,
        recommended: 'Best for 8-32 players'
    },
    {
        value: 'roundrobin',
        label: 'Round Robin',
        description: 'Everyone plays everyone - most fair format',
        icon: <Users className="w-5 h-5" />,
        recommended: 'Best for 4-12 players'
    },
    {
        value: 'swiss',
        label: 'Swiss System',
        description: 'Pair players with similar records - no eliminations',
        icon: <Zap className="w-5 h-5" />,
        recommended: 'Best for 16+ players'
    },
    {
        value: 'double_elimination',
        label: 'Double Elimination',
        description: 'Two losses to be eliminated - more forgiving',
        icon: <Trophy className="w-5 h-5" />,
        recommended: 'Best for 8-16 players'
    },
    {
        value: 'groups_then_playoff',
        label: 'Groups + Playoff',
        description: 'Round robin groups followed by knockout playoffs',
        icon: <Users className="w-5 h-5" />,
        recommended: 'Best for 16-32 players'
    }
]

const seedingStrategies = [
    { value: 'registration_order', label: 'Registration Order', description: 'First come, first seeded' },
    { value: 'elo_rating', label: 'ELO Rating', description: 'Based on player ratings' },
    { value: 'historical_performance', label: 'Historical Performance', description: 'Based on past results' },
    { value: 'random', label: 'Random', description: 'Completely random seeding' },
    { value: 'manual', label: 'Manual', description: 'Manually assign seeds' }
]

export default function AdvancedFixturesPage() {
    const [selectedFormat, setSelectedFormat] = useState<Format>('knockout')
    const [seedingStrategy, setSeedingStrategy] = useState<SeedingStrategy>('registration_order')
    const [swissRounds, setSwissRounds] = useState(5)
    const [groups, setGroups] = useState(4)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handlePreview = async () => {
        setLoading(true)
        setError(null)

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Mock preview data
            setPreview({
                format: selectedFormat,
                matches: Array(16).fill(null).map((_, i) => ({ id: i, round: Math.floor(i / 4) + 1 })),
                fairnessScore: Math.floor(Math.random() * 20) + 75,
                metrics: {
                    totalPlayers: 16,
                    sameClubCollisions: Math.floor(Math.random() * 3),
                    byes: selectedFormat === 'knockout' ? 0 : undefined
                },
                warnings: []
            })
        } catch (err: any) {
            setError(err.message || 'Failed to generate preview')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = async () => {
        setLoading(true)
        setError(null)

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))
            alert('Fixtures generated successfully!')
            setPreview(null)
        } catch (err: any) {
            setError(err.message || 'Failed to generate fixtures')
        } finally {
            setLoading(false)
        }
    }

    const handleRollback = async () => {
        if (!confirm('Are you sure you want to rollback to the previous fixture state?')) return

        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            alert('Fixtures rolled back successfully!')
            setPreview(null)
        } catch (err: any) {
            setError(err.message || 'Failed to rollback')
        } finally {
            setLoading(false)
        }
    }

    const getFairnessColor = (score: number) => {
        if (score >= 80) return 'text-green-500'
        if (score >= 70) return 'text-yellow-500'
        return 'text-red-500'
    }

    const getFairnessRating = (score: number) => {
        if (score >= 80) return 'Excellent'
        if (score >= 70) return 'Good'
        if (score >= 60) return 'Fair'
        return 'Needs Improvement'
    }

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container-max">
                <div className="mb-8">
                    <h1 className="text-gradient mb-2">Advanced Fixture Generator</h1>
                    <p className="text-muted-foreground text-lg">
                        Create optimized tournament brackets with advanced seeding and fairness scoring
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Format Selector */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Tournament Format</CardTitle>
                                <CardDescription>Choose the format that best suits your tournament</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formats.map((format) => (
                                        <button
                                            key={format.value}
                                            onClick={() => setSelectedFormat(format.value)}
                                            className={`card-3d p-4 rounded-lg border-2 transition-all text-left ${selectedFormat === format.value
                                                    ? 'border-primary bg-primary/5 glow-primary'
                                                    : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${selectedFormat === format.value ? 'gradient-primary text-white' : 'bg-muted'
                                                    }`}>
                                                    {format.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-1">{format.label}</h3>
                                                    <p className="text-sm text-muted-foreground mb-2">{format.description}</p>
                                                    <Badge variant="secondary" className="text-xs">{format.recommended}</Badge>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Seeding Configuration */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Seeding Strategy</CardTitle>
                                <CardDescription>How should players be seeded in the bracket?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Strategy</Label>
                                    <Select value={seedingStrategy} onValueChange={(v) => setSeedingStrategy(v as SeedingStrategy)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {seedingStrategies.map((strategy) => (
                                                <SelectItem key={strategy.value} value={strategy.value}>
                                                    <div>
                                                        <div className="font-medium">{strategy.label}</div>
                                                        <div className="text-xs text-muted-foreground">{strategy.description}</div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedFormat === 'swiss' && (
                                    <div className="space-y-2">
                                        <Label>Number of Rounds</Label>
                                        <Select value={swissRounds.toString()} onValueChange={(v) => setSwissRounds(parseInt(v))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[3, 4, 5, 6, 7, 8].map((n) => (
                                                    <SelectItem key={n} value={n.toString()}>{n} Rounds</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedFormat === 'groups_then_playoff' && (
                                    <div className="space-y-2">
                                        <Label>Number of Groups</Label>
                                        <Select value={groups.toString()} onValueChange={(v) => setGroups(parseInt(v))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[2, 4, 6, 8].map((n) => (
                                                    <SelectItem key={n} value={n.toString()}>{n} Groups</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                onClick={handlePreview}
                                disabled={loading}
                                className="glow-primary flex-1"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Eye className="mr-2 h-5 w-5" />
                                        Preview Fixtures
                                    </>
                                )}
                            </Button>

                            {preview && (
                                <Button
                                    size="lg"
                                    onClick={handleRollback}
                                    variant="outline"
                                    disabled={loading}
                                >
                                    <RotateCcw className="mr-2 h-5 w-5" />
                                    Rollback
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="space-y-6">
                        {/* Fairness Gauge */}
                        {preview && (
                            <Card className="glass-card animate-fade-in">
                                <CardHeader>
                                    <CardTitle>Fairness Score</CardTitle>
                                    <CardDescription>Quality assessment of the generated fixtures</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center">
                                        <div className={`text-6xl font-bold mb-2 ${getFairnessColor(preview.fairnessScore)}`}>
                                            {preview.fairnessScore}
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-4">out of 100</div>
                                        <Badge variant={preview.fairnessScore >= 80 ? 'default' : 'secondary'} className="mb-4">
                                            {getFairnessRating(preview.fairnessScore)}
                                        </Badge>

                                        <div className="space-y-2 text-sm text-left mt-6">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Total Players:</span>
                                                <span className="font-medium">{preview.metrics.totalPlayers}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Same-Club Matches:</span>
                                                <span className="font-medium">{preview.metrics.sameClubCollisions}</span>
                                            </div>
                                            {preview.metrics.byes !== undefined && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">BYEs:</span>
                                                    <span className="font-medium">{preview.metrics.byes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Warnings */}
                        {preview && preview.warnings && preview.warnings.length > 0 && (
                            <Alert variant="destructive" className="animate-slide-up">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Warnings</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc list-inside space-y-1">
                                        {preview.warnings.map((warning: string, i: number) => (
                                            <li key={i}>{warning}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Success Message */}
                        {preview && preview.fairnessScore >= 70 && (
                            <Alert className="animate-slide-up border-green-500">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertTitle>Ready to Generate</AlertTitle>
                                <AlertDescription>
                                    The fixtures look good! Click the button below to commit them to the database.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Generate Button */}
                        {preview && (
                            <Button
                                size="lg"
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full glow-accent"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Generate Fixtures
                                    </>
                                )}
                            </Button>
                        )}

                        {/* Error */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
