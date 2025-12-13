import React, { useMemo } from 'react';
import { Flame, Calendar, TrendingUp, Activity } from 'lucide-react';
import type { TimelineItem } from '../types';

interface Props {
    data: TimelineItem[];
    startDate?: string;
    endDate?: string;
}

interface StreakInfo {
    longestStreak: number;
    longestStreakStart: string;
    longestStreakEnd: string;
    currentStreak: number;
    totalActiveDays: number;
    avgCommitsPerActiveDay: number;
}

const StreakStats: React.FC<Props> = ({ data, startDate, endDate }) => {
    const streakInfo = useMemo((): StreakInfo => {
        if (data.length === 0) {
            return {
                longestStreak: 0,
                longestStreakStart: '',
                longestStreakEnd: '',
                currentStreak: 0,
                totalActiveDays: 0,
                avgCommitsPerActiveDay: 0,
            };
        }

        // Sort by date
        const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
        const dateSet = new Set(sortedData.filter(d => d.count > 0).map(d => d.date));
        const activeDays = sortedData.filter(d => d.count > 0);

        let longestStreak = 0;
        let longestStreakStart = '';
        let longestStreakEnd = '';
        let currentStreak = 0;
        let tempStreak = 0;
        let tempStreakStart = '';

        // Calculate streaks
        const today = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || sortedData[0]?.date;

        if (!start) {
            return {
                longestStreak: 0,
                longestStreakStart: '',
                longestStreakEnd: '',
                currentStreak: 0,
                totalActiveDays: 0,
                avgCommitsPerActiveDay: 0,
            };
        }

        let prevDate: Date | null = null;

        activeDays.forEach(day => {
            const currentDate = new Date(day.date);

            if (prevDate) {
                const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                        longestStreakEnd = prevDate.toISOString().split('T')[0];
                        longestStreakStart = tempStreakStart;
                    }
                    tempStreak = 1;
                    tempStreakStart = day.date;
                }
            } else {
                tempStreak = 1;
                tempStreakStart = day.date;
            }

            prevDate = currentDate;
        });

        // Check the last streak
        if (tempStreak > longestStreak && prevDate !== null) {
            longestStreak = tempStreak;
            longestStreakEnd = (prevDate as Date).toISOString().split('T')[0];
            longestStreakStart = tempStreakStart;
        }

        // Calculate current streak (from today backwards)
        const todayDate = new Date(today);
        currentStreak = 0;
        for (let i = 0; i <= 365; i++) {
            const checkDate = new Date(todayDate);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            if (dateSet.has(dateStr)) {
                currentStreak++;
            } else if (i > 0) {
                break;
            }
        }

        const totalCommits = activeDays.reduce((sum, d) => sum + d.count, 0);

        return {
            longestStreak,
            longestStreakStart,
            longestStreakEnd,
            currentStreak,
            totalActiveDays: activeDays.length,
            avgCommitsPerActiveDay: activeDays.length > 0 ? Math.round(totalCommits / activeDays.length * 10) / 10 : 0,
        };
    }, [data, startDate, endDate]);

    const formatDateRange = (start: string, end: string) => {
        if (!start || !end) return '';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    };

    return (
        <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg">
            <h2 className="text-xl font-bold mb-6 text-github-text flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Streak Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Longest Streak */}
                <div className="text-center p-4 bg-github-dark rounded-lg border border-github-border">
                    <div className="flex justify-center mb-2">
                        <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="text-3xl font-bold text-white">{streakInfo.longestStreak}</div>
                    <div className="text-xs text-github-secondary mt-1">Longest Streak</div>
                    {streakInfo.longestStreakStart && (
                        <div className="text-xs text-github-secondary mt-1">
                            {formatDateRange(streakInfo.longestStreakStart, streakInfo.longestStreakEnd)}
                        </div>
                    )}
                </div>

                {/* Current Streak */}
                <div className="text-center p-4 bg-github-dark rounded-lg border border-github-border">
                    <div className="flex justify-center mb-2">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-white">{streakInfo.currentStreak}</div>
                    <div className="text-xs text-github-secondary mt-1">Current Streak</div>
                </div>

                {/* Active Days */}
                <div className="text-center p-4 bg-github-dark rounded-lg border border-github-border">
                    <div className="flex justify-center mb-2">
                        <Calendar className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-white">{streakInfo.totalActiveDays}</div>
                    <div className="text-xs text-github-secondary mt-1">Active Days</div>
                </div>

                {/* Avg Commits */}
                <div className="text-center p-4 bg-github-dark rounded-lg border border-github-border">
                    <div className="flex justify-center mb-2">
                        <Activity className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div className="text-3xl font-bold text-white">{streakInfo.avgCommitsPerActiveDay}</div>
                    <div className="text-xs text-github-secondary mt-1">Avg/Active Day</div>
                </div>
            </div>
        </div>
    );
};

export default StreakStats;
