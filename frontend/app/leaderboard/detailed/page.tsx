'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { apiGet } from '@/lib/apiClient';
import { Loader2, Trophy, BarChart3, Users, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function DetailedLeaderboardContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState<string>('Tournament');
  const { toast } = useToast();

  const eventIdParam = searchParams.get('eventId');

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
      router.push('/leaderboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!eventIdParam) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Event ID is required',
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [leaderboardRes, analyticsRes] = await Promise.all([
          apiGet<any>(`/api/events/${eventIdParam}/leaderboard/detailed`).catch(() => null),
          apiGet<any>(`/api/events/${eventIdParam}/analytics`).catch(() => null)
        ]);

        if (leaderboardRes) {
          setLeaderboard(Array.isArray(leaderboardRes) ? leaderboardRes : []);
        }

        if (analyticsRes) {
          setAnalytics(analyticsRes);
          setEventName(analyticsRes.eventName || 'Tournament');
        }

      } catch (err: any) {
        console.error('Failed to fetch detailed leaderboard:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load detailed leaderboard.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (eventIdParam) {
      fetchData();
    }
  }, [eventIdParam, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading detailed leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{eventName} - Detailed Analytics</h1>
          <p className="text-muted-foreground">Comprehensive statistics and performance metrics</p>
        </section>

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-primary" size={20} />
                <p className="text-sm text-muted-foreground">Total Matches</p>
              </div>
              <p className="text-2xl font-bold">{analytics.totalMatches || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-green-600" size={20} />
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{analytics.completedMatches || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-yellow-600" size={20} />
                <p className="text-sm text-muted-foreground">Same Club Matches</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{analytics.sameClubMatchCount || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="text-red-600" size={20} />
                <p className="text-sm text-muted-foreground">Rest Violations</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{analytics.restTimeViolationCount || 0}</p>
            </div>
          </div>
        )}

        {analytics?.courtUtilization && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Court Utilization</h2>
            <div className="space-y-4">
              {Object.entries(analytics.courtUtilization).map(([courtId, util]: [string, any]) => (
                <div key={courtId}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Court {courtId.slice(0, 8)}</span>
                    <span className="text-sm text-muted-foreground">{util.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${util.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold">Detailed Standings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-medium">
                <tr>
                  <th className="px-6 py-4 text-left">Rank</th>
                  <th className="px-6 py-4 text-left">Player</th>
                  <th className="px-6 py-4 text-left">Club</th>
                  <th className="px-6 py-4 text-center">Matches</th>
                  <th className="px-6 py-4 text-center">W-L</th>
                  <th className="px-6 py-4 text-center">Sets</th>
                  <th className="px-6 py-4 text-center">Point Diff</th>
                  <th className="px-6 py-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.map((entry: any) => (
                  <tr key={entry.playerId} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold">#{entry.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">{entry.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{entry.club}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{entry.matchesPlayed || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-green-600">{entry.wins || 0}</span>
                      <span className="mx-1">-</span>
                      <span className="text-red-600">{entry.losses || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {entry.setsWon || 0}-{entry.setsLost || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {entry.pointDiff > 0 ? '+' : ''}{entry.pointDiff || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-primary">
                      {entry.points || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function DetailedLeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <DetailedLeaderboardContent />
    </Suspense>
  );
}

