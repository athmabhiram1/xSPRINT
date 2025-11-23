'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/apiClient';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useToast } from '@/components/ToastProvider';
import { AuthNavBar } from '@/components/AuthNavBar';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Lock, Unlock, AlertCircle, CheckCircle, Plus, Minus, Loader2 } from 'lucide-react';

interface Match {
    id: string;
    matchNumber: number;
    playerA: { name: string };
    playerB: { name: string };
    status: string;
    score?: any;
}

type Phase = 'code-validation' | 'scoring' | 'completed' | 'read-only';

export default function MatchScoringPage() {
    const router = useRouter();
    const params = useParams();
    const matchId = params.matchId as string;
    const { toast } = useToast();
    const handleApiError = useApiErrorHandler();

    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [phase, setPhase] = useState<Phase>('code-validation');

    // Code validation state
    const [matchCode, setMatchCode] = useState('');
    const [validating, setValidating] = useState(false);
    const [codeError, setCodeError] = useState('');

    // Scoring state
    const [sets, setSets] = useState<Array<{ playerA: string; playerB: string }>>([
        { playerA: '', playerB: '' },
    ]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMatch();
    }, [matchId]);

    const fetchMatch = async () => {
        try {
            const data = await apiGet<Match>(`/api/matches/${matchId}`);
            setMatch(data);

            // Determine phase based on match status
            if (data.status === 'COMPLETED') {
                setPhase('read-only');
            }
        } catch (error: any) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleValidateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setCodeError('');
        setValidating(true);

        try {
            await apiPost('/api/matches/validate-code', {
                matchId,
                matchCode,
            });

            toast({
                type: 'success',
                title: 'Code validated',
                message: 'You can now enter the match scores.',
            });

            setPhase('scoring');
        } catch (error: any) {
            const apiError = error;
            setCodeError(apiError.message || 'Invalid or expired code');

            if (apiError.message?.includes('expired')) {
                setCodeError('This match code has expired. Please request a new code.');
            } else if (apiError.message?.includes('umpire')) {
                setCodeError('This match is assigned to a different umpire.');
            }
        } finally {
            setValidating(false);
        }
    };

    const handleAddSet = () => {
        setSets([...sets, { playerA: '', playerB: '' }]);
    };

    const handleRemoveSet = (index: number) => {
        if (sets.length > 1) {
            setSets(sets.filter((_, i) => i !== index));
        }
    };

    const handleSetChange = (index: number, player: 'playerA' | 'playerB', value: string) => {
        const newSets = [...sets];
        newSets[index][player] = value;
        setSets(newSets);
    };

    const handleSubmitScore = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate all sets have scores
            const allFilled = sets.every((set) => set.playerA && set.playerB);
            if (!allFilled) {
                toast({
                    type: 'error',
                    title: 'Incomplete scores',
                    message: 'Please fill in all set scores.',
                });
                setSubmitting(false);
                return;
            }

            await apiPost('/api/matches/result', {
                matchId,
                matchCode,
                score: sets,
            });

            toast({
                type: 'success',
                title: 'Score submitted',
                message: 'Match result has been recorded successfully.',
            });

            // Redirect back to matches list
            setTimeout(() => {
                router.push('/umpire/matches');
            }, 1500);
        } catch (error: any) {
            handleApiError(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <AuthNavBar />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
                    <div className="max-w-3xl mx-auto">
                        <LoadingSkeleton variant="card" />
                    </div>
                </div>
            </>
        );
    }

    if (!match) {
        return (
            <>
                <AuthNavBar />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Match not found
                        </h2>
                        <button
                            onClick={() => router.push('/umpire/matches')}
                            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            Back to Matches
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AuthNavBar />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="max-w-3xl mx-auto px-4">
                    {/* Match Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Match #{match.matchNumber}
                            </h1>
                            <div className="text-lg text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">{match.playerA.name}</span>
                                <span className="mx-3 text-gray-400">vs</span>
                                <span className="font-semibold">{match.playerB.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Phase: Code Validation */}
                    {phase === 'code-validation' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                                    <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Enter Match Code
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Enter the match code to unlock scoring
                                </p>
                            </div>

                            <form onSubmit={handleValidateCode} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={matchCode}
                                        onChange={(e) => setMatchCode(e.target.value.toUpperCase())}
                                        placeholder="XXXX-XXXX"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-mono tracking-wider uppercase focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                        disabled={validating}
                                    />
                                </div>

                                {codeError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700 dark:text-red-300">{codeError}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={validating || !matchCode}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {validating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <Unlock className="w-5 h-5" />
                                            Validate Code
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Phase: Scoring */}
                    {phase === 'scoring' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Enter Match Scores
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Enter the score for each set
                                </p>
                            </div>

                            <form onSubmit={handleSubmitScore} className="space-y-6">
                                {sets.map((set, index) => (
                                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Set {index + 1}
                                            </h3>
                                            {sets.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSet(index)}
                                                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {match.playerA.name}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={set.playerA}
                                                    onChange={(e) => handleSetChange(index, 'playerA', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {match.playerB.name}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={set.playerB}
                                                    onChange={(e) => handleSetChange(index, 'playerB', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddSet}
                                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-3 text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Set
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Score'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Phase: Read-only (Already completed) */}
                    {phase === 'read-only' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                                    <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Match Completed
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    This match has already been scored
                                </p>
                            </div>

                            {match.score && (
                                <div className="space-y-3 mb-6">
                                    {match.score.map((set: any, index: number) => (
                                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                Set {index + 1}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                        {match.playerA.name}
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {set.playerA}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                        {match.playerB.name}
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {set.playerB}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => router.push('/umpire/matches')}
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Back to Matches
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
