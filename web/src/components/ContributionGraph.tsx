import React, { useMemo } from 'react';
import type { TimelineItem } from '../types';

interface Props {
    data: TimelineItem[];
    startDate?: string;
    endDate?: string;
}

// GitHub-style contribution graph rendered as SVG
const ContributionGraph: React.FC<Props> = ({ data, startDate: startDateProp, endDate: endDateProp }) => {
    // Build a map from date string to count for O(1) lookup
    const dateMap = useMemo(() => {
        const map = new Map<string, number>();
        data.forEach(d => {
            map.set(d.date, d.count);
        });
        return map;
    }, [data]);

    // Calculate date range
    const { startDate, endDate } = useMemo(() => {
        if (startDateProp && endDateProp) {
            const [startYear, startMonth, startDay] = startDateProp.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDateProp.split('-').map(Number);
            return {
                startDate: new Date(startYear, startMonth - 1, startDay),
                endDate: new Date(endYear, endMonth - 1, endDay),
            };
        }

        if (data.length === 0) {
            const today = new Date();
            return {
                startDate: new Date(today.getFullYear(), 0, 1),
                endDate: today,
            };
        }

        const dates = data.map(d => {
            const [year, month, day] = d.date.split('-').map(Number);
            return new Date(year, month - 1, day);
        });
        return {
            startDate: new Date(Math.min(...dates.map(d => d.getTime()))),
            endDate: new Date(Math.max(...dates.map(d => d.getTime()))),
        };
    }, [data, startDateProp, endDateProp]);

    // Build weeks array like GitHub's contribution graph
    // GitHub shows weeks as columns (Sunday at top, Saturday at bottom)
    const { weeks, monthLabels, totalContributions } = useMemo(() => {
        const weeks: Array<Array<{ date: string; count: number; dayOfWeek: number }>> = [];
        let currentWeek: Array<{ date: string; count: number; dayOfWeek: number }> = [];
        let total = 0;
        const months: Array<{ label: string; weekIndex: number }> = [];
        let lastMonth = -1;

        // Start from the Sunday of the week containing startDate
        const current = new Date(startDate);
        const dayOfWeek = current.getDay();
        current.setDate(current.getDate() - dayOfWeek);

        while (current <= endDate) {
            const dateStr = current.toISOString().split('T')[0];
            const count = dateMap.get(dateStr) || 0;
            const dow = current.getDay();

            // Track month labels (at the start of each month)
            const month = current.getMonth();
            if (month !== lastMonth && current >= startDate) {
                months.push({
                    label: current.toLocaleString('en-US', { month: 'short' }),
                    weekIndex: weeks.length,
                });
                lastMonth = month;
            }

            // Only count contributions within the actual date range
            if (current >= startDate && current <= endDate) {
                total += count;
            }

            currentWeek.push({
                date: dateStr,
                count: current >= startDate && current <= endDate ? count : -1, // -1 means outside range
                dayOfWeek: dow,
            });

            // If Saturday, push week and start new one
            if (dow === 6) {
                weeks.push(currentWeek);
                currentWeek = [];
            }

            current.setDate(current.getDate() + 1);
        }

        // Push remaining days
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return { weeks, monthLabels: months, totalContributions: total };
    }, [startDate, endDate, dateMap]);

    // Color scale matching GitHub's
    const getColor = (count: number): string => {
        if (count < 0) return 'transparent'; // Outside date range
        if (count === 0) return '#161b22';
        if (count >= 10) return '#39d353';
        if (count >= 5) return '#26a641';
        if (count >= 2) return '#006d32';
        return '#0e4429';
    };

    const cellSize = 11;
    const cellGap = 3;
    const weekdayLabelWidth = 30;
    const monthLabelHeight = 15;

    const svgWidth = weekdayLabelWidth + weeks.length * (cellSize + cellGap);
    const svgHeight = monthLabelHeight + 7 * (cellSize + cellGap);

    // Debug log
    console.log('ContributionGraph:', {
        dataLength: data.length,
        weeksCount: weeks.length,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalContributions,
        sampleDates: data.slice(0, 5).map(d => `${d.date}:${d.count}`),
    });

    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-github-text">Contribution Activity</h2>
                <span className="text-sm text-github-secondary">
                    {totalContributions.toLocaleString()} contributions
                </span>
            </div>
            <div className="w-full overflow-x-auto">
                <svg width={svgWidth} height={svgHeight} className="contribution-graph">
                    {/* Month labels */}
                    {monthLabels.map((m, i) => (
                        <text
                            key={i}
                            x={weekdayLabelWidth + m.weekIndex * (cellSize + cellGap)}
                            y={10}
                            fontSize="10"
                            fill="#8b949e"
                        >
                            {m.label}
                        </text>
                    ))}

                    {/* Weekday labels */}
                    {[1, 3, 5].map((dow) => (
                        <text
                            key={dow}
                            x={0}
                            y={monthLabelHeight + dow * (cellSize + cellGap) + cellSize - 2}
                            fontSize="9"
                            fill="#8b949e"
                        >
                            {weekdayLabels[dow]}
                        </text>
                    ))}

                    {/* Contribution cells */}
                    {weeks.map((week, weekIndex) =>
                        week.map((day) => (
                            <rect
                                key={day.date}
                                x={weekdayLabelWidth + weekIndex * (cellSize + cellGap)}
                                y={monthLabelHeight + day.dayOfWeek * (cellSize + cellGap)}
                                width={cellSize}
                                height={cellSize}
                                rx={2}
                                ry={2}
                                fill={getColor(day.count)}
                                stroke={day.count === 0 ? '#30363d' : 'none'}
                                strokeWidth={day.count === 0 ? 1 : 0}
                            >
                                <title>
                                    {day.count < 0
                                        ? 'Outside date range'
                                        : `${day.date}: ${day.count} contribution${day.count !== 1 ? 's' : ''}`}
                                </title>
                            </rect>
                        ))
                    )}
                </svg>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-github-secondary">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }} />
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#0e4429' }} />
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#006d32' }} />
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#26a641' }} />
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#39d353' }} />
                </div>
                <span>More</span>
            </div>
        </div>
    );
};

export default ContributionGraph;
