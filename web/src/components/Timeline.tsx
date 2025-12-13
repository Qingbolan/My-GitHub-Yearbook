import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimelineItem } from '../types';

interface Props {
    data: TimelineItem[];
}

const Timeline: React.FC<Props> = ({ data }) => {
    // Aggregate by month for cleaner visualization
    const monthlyData = useMemo(() => {
        const monthMap = new Map<string, number>();

        data.forEach(item => {
            const month = item.date.substring(0, 7); // YYYY-MM
            monthMap.set(month, (monthMap.get(month) || 0) + item.count);
        });

        return Array.from(monthMap.entries())
            .map(([month, count]) => ({
                month,
                label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                count,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [data]);

    return (
        <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-github-text">Monthly Activity</h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <XAxis
                            dataKey="label"
                            stroke="#8b949e"
                            tick={{ fontSize: 11 }}
                            axisLine={{ stroke: '#30363d' }}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#8b949e"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#161b22',
                                borderColor: '#30363d',
                                color: '#c9d1d9',
                                borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#8b949e' }}
                            formatter={(value: number) => [`${value} contributions`, '']}
                            labelFormatter={(label) => label}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#58a6ff"
                            strokeWidth={2}
                            fill="url(#colorCount)"
                            dot={false}
                            activeDot={{ r: 5, fill: '#58a6ff', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Timeline;
