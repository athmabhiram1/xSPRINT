'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PodiumCard } from '@/components/leaderboard/PodiumCard';
import { apiGet } from '@/lib/apiClient';
import { getSocket } from '@/lib/socketClient';
import { Loader2, Trophy, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Standing {
  rank: number;
  playerId: string;
  name: string;
  club: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  setDiff?: number;
  pointDiff?: number;
}

interface Event {
  id: string;
  name: string;
  status?: string;
}

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('Tournament');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const eventIdParam = searchParams.get('eventId');

  useEffect(() => {
    const socket = getSocket();

    const handleLeaderboardUpdate = (data: { eventId: string }) => {
      setRefreshTrigger(prev => prev + 1);
      toast({
        title: "Leaderboard Updated",
        description: "New match results have been recorded.",
        duration: 3000,
      });
    };

    socket.on('LEADERBOARD_UPDATED', handleLeaderboardUpdate);

    return () => {
      socket.off('LEADERBOARD_UPDATED', handleLeaderboardUpdate);
    };
  }, [toast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let targetEventId = eventIdParam;

        if (!targetEventId) {
          try {
            const eventsResponse = await apiGet<Event[]>('/api/events');
            const events = Array.isArray(eventsResponse) ? eventsResponse : [];
            
            const active = events.find(e => e.status === 'IN_PROGRESS') || events[0];
            if (active) {
              targetEventId = active.id;
              setEventName(active.name);
            }
          } catch (err) {
            console.warn('Failed to fetch events list', err);
          }
        }

        if (!targetEventId) {
          setError('No active tournament event found.');
          setLoading(false);
          return;
        }

        const response = await apiGet<any>(`/api/events/${targetEventId}/leaderboard/basic`);

        const data = response?.standings || response || [];
        
        const mappedStandings: Standing[] = data.map((item: any) => ({
          rank: item.rank || 0,
          playerId: item.playerId || item.id || '',
          name: item.name || item.playerName || 'Unknown',
          club: item.club || item.clubName || 'Unattached',
          matchesPlayed: item.matchesPlayed || (item.wins || 0) + (item.losses || 0),
          wins: item.wins || 0,
          losses: item.losses || 0,
          points: item.points || 0,
          setDiff: item.setDiff,
          pointDiff: item.pointDiff,
        }));

        setStandings(mappedStandings);

        if (eventIdParam && !eventName && response?.eventName) {
          setEventName(response.eventName);
        }

      } catch (err: any) {
        console.error('Failed to fetch standings:', err);
        setError('Failed to load leaderboard data. Please try again later.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load standings data.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventIdParam, toast, refreshTrigger]);

  const topThree = standings.filter(s => s.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = standings.filter(s => s.rank > 3).sort((a, b) => a.rank - b.rank);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 shadow-2xl mb-12 border border-white/10">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-white space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Live Rankings
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200">
                {eventName} Leaderboard
              </h1>
              <p className="text-lg text-slate-300 max-w-xl">
                Track champions, podium finishes, and live movement across events in real time.
              </p>
            </div>
            <div className="w-48 h-48 md:w-64 md:h-64 relative flex-shrink-0">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <Trophy className="w-32 h-32 text-primary/50" />
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading standings...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground max-w-md">{error}</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border border-dashed">
            <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Standings Yet</h3>
            <p className="text-muted-foreground">
              Matches haven't started or no results have been recorded for this event.
            </p>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Podium
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  {topThree.find(s => s.rank === 2) && (
                    <div className="order-2 md:order-1">
                      <PodiumCard {...topThree.find(s => s.rank === 2)! as any} />
                    </div>
                  )}
                  {topThree.find(s => s.rank === 1) && (
                    <div className="order-1 md:order-2 md:-mt-12 z-10">
                      <PodiumCard {...topThree.find(s => s.rank === 1)! as any} />
                    </div>
                  )}
                  {topThree.find(s => s.rank === 3) && (
                    <div className="order-3">
                      <PodiumCard {...topThree.find(s => s.rank === 3)! as any} />
                    </div>
                  )}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/30">
                  <h2 className="text-lg font-semibold">Full Standings</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-medium">
                      <tr>
                        <th className="px-6 py-4 text-left tracking-wider">Rank</th>
                        <th className="px-6 py-4 text-left tracking-wider">Player</th>
                        <th className="px-6 py-4 text-left tracking-wider">Club</th>
                        <th className="px-6 py-4 text-center tracking-wider">Played</th>
                        <th className="px-6 py-4 text-center tracking-wider">W-L</th>
                        <th className="px-6 py-4 text-right tracking-wider">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rest.map((player) => (
                        <tr key={player.playerId} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-muted-foreground">
                              #{player.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-foreground">{player.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                            {player.club}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {player.matchesPlayed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-green-600 font-medium">{player.wins}</span>
                            <span className="text-muted-foreground mx-1">-</span>
                            <span className="text-red-600 font-medium">{player.losses}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-primary">
                            {player.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading xSPRINT Leaderboard...</p>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
