import React from 'react';

export function MatchCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="h-6 w-16 bg-muted rounded-full"></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-muted rounded"></div>
          <div className="h-5 w-12 bg-muted rounded"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-muted rounded"></div>
          <div className="h-5 w-12 bg-muted rounded"></div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="h-4 w-full bg-muted rounded"></div>
      </div>
    </div>
  );
}

export function TournamentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card animate-pulse">
      <div className="h-52 bg-muted"></div>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-muted rounded"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 bg-muted rounded-lg"></div>
          <div className="h-10 bg-muted rounded-lg"></div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-24 bg-muted rounded"></div>
          <div className="h-9 w-20 bg-muted rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {['Rank', 'Player', 'Club', 'Played', 'W-L', 'Points'].map((header, i) => (
                <th key={i} className="px-6 py-4 text-left">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4">
                  <div className="h-5 w-8 bg-muted rounded"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-5 w-32 bg-muted rounded"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-5 w-24 bg-muted rounded"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-5 w-8 bg-muted rounded mx-auto"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-5 w-16 bg-muted rounded mx-auto"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-5 w-12 bg-muted rounded ml-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FixtureBracketSkeleton() {
  return (
    <div className="space-y-6">
      {[4, 2, 1].map((count, roundIndex) => (
        <div key={roundIndex} className="space-y-3">
          <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-24 bg-muted rounded mb-2"></div>
          <div className="h-8 w-16 bg-muted rounded"></div>
        </div>
        <div className="h-12 w-12 bg-muted rounded-full"></div>
      </div>
    </div>
  );
}

export function ScheduleListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-muted rounded"></div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-muted rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-4 w-24 bg-muted rounded mb-2"></div>
          <div className="h-10 w-full bg-muted rounded-lg"></div>
        </div>
      ))}
      <div className="h-10 w-32 bg-muted rounded-lg mt-6"></div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-card border-b border-border animate-pulse"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-12 w-64 bg-muted rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="h-96 bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
