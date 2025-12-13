import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TimelineItem } from '../types';

interface Props {
    data: TimelineItem[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeekdayChart: React.FC<Props> = ({ data }) => {
    const weekdayData = useMemo(() => {
        const counts = new Array(7).fill(0);

        data.forEach(item => {
            const date = new Date(item.date);
            const dayIndex = date.getDay();
            counts[dayIndex] += item.count;
        });

        return WEEKDAYS.map((day, index) => ({
            day,
            dayIndex: index,
            count: counts[index],
            isWeekend: index === 0 || index === 6,
        }));
    }, [data]);

    const maxCount = Math.max(...weekdayData.map(d => d.count));

    return (
        <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-github-text">Commits by Day of Week</h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdayData} layout="vertical">
                        <XAxis type="number" stroke="#8b949e" />
                        <YAxis
                            type="category"
                            dataKey="day"
                            stroke="#8b949e"
                            width={40}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#161b22',
                                borderColor: '#30363d',
                                color: '#c9d1d9',
                                borderRadius: '8px',
                            }}
                            formatter={(value: number) => [`${value} commits`, 'Commits']}
                        />
                        <Bar
                            dataKey="count"
                            radius={[0, 4, 4, 0]}
                        >
                            {weekdayData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isWeekend ? '#f56c6c' : '#58a6ff'}
                                    opacity={0.3 + (entry.count / maxCount) * 0.7}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs text-github-secondary">
                <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-github-accent" />
                    Weekday
                </span>
                <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-red-400" />
                    Weekend
                </span>
            </div>
        </div>
    );
};

export default WeekdayChart;
