'use client';

import { Trophy, Medal } from 'lucide-react';

interface PodiumCardProps {
    rank: 1 | 2 | 3;
    playerName: string;
    clubName: string;
    wins: number;
    losses: number;
    points: number;
}

const rankConfig = {
    1: {
        gradient: 'from-yellow-500 via-amber-500 to-yellow-600',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-100',
        icon: Trophy,
        label: 'Champion',
        bgOpacity: 'bg-yellow-500/10',
    },
    2: {
        gradient: 'from-slate-400 via-gray-400 to-slate-500',
        borderColor: 'border-slate-400/30',
        textColor: 'text-slate-100',
        icon: Medal,
        label: 'Runner-Up',
        bgOpacity: 'bg-slate-400/10',
    },
    3: {
        gradient: 'from-orange-600 via-amber-700 to-orange-700',
        borderColor: 'border-orange-600/30',
        textColor: 'text-orange-100',
        icon: Medal,
        label: 'Third Place',
        bgOpacity: 'bg-orange-600/10',
    },
};

export function PodiumCard({ rank, playerName, clubName, wins, losses, points }: PodiumCardProps) {
    const config = rankConfig[rank];
    const Icon = config.icon;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border ${config.borderColor} ${config.bgOpacity} backdrop-blur-sm p-6 transition-all hover:scale-105 hover:shadow-2xl group`}
        >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

            {/* Content */}
            <div className="relative z-10">
                {/* Rank badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${config.gradient} shadow-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                            {config.label}
                        </span>
                    </div>
                    <div className={`text-4xl font-black ${config.textColor} opacity-20`}>
                        #{rank}
                    </div>
                </div>

                {/* Player info */}
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{playerName}</h3>
                    <p className="text-sm text-slate-300">{clubName}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Wins</p>
                        <p className="text-lg font-bold text-green-400">{wins}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Losses</p>
                        <p className="text-lg font-bold text-red-400">{losses}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Points</p>
                        <p className={`text-lg font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                            {points}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
