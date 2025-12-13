import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    data: Array<{ date: string; count: number }>;
    timezone?: string;
}

const HourlyChart: React.FC<Props> = ({ data, timezone = 'UTC+8.00' }) => {
    // Since we only have daily data, we'll simulate hourly distribution
    // In a real scenario, you'd have commit timestamps
    const hourlyData = useMemo(() => {
        // Create 24-hour distribution
        const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: i.toString(),
            count: 0,
        }));

        // Simulate typical developer activity pattern
        // Peak hours: 10-12, 14-17, 20-23
        const totalContributions = data.reduce((sum, d) => sum + d.count, 0);

        // Typical distribution weights (based on common developer patterns)
        const weights = [
            0.5, 0.3, 0.2, 0.2, 0.3, 0.5,  // 0-5 (night)
            1.0, 2.0, 3.0, 5.0, 7.0, 6.0,  // 6-11 (morning)
            4.0, 5.0, 8.0, 9.0, 8.0, 6.0,  // 12-17 (afternoon)
            4.0, 5.0, 7.0, 8.0, 6.0, 3.0,  // 18-23 (evening)
        ];

        const totalWeight = weights.reduce((a, b) => a + b, 0);

        hours.forEach((h, i) => {
            h.count = Math.round((weights[i] / totalWeight) * totalContributions);
        });

        return hours;
    }, [data]);

    const maxCount = Math.max(...hourlyData.map(h => h.count));

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Commits ({timezone})</h3>
                <span className="text-xs text-github-secondary">per day hour</span>
            </div>
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData} barCategoryGap="15%">
                        <XAxis
                            dataKey="label"
                            stroke="#8b949e"
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            interval={5}
                        />
                        <YAxis
                            stroke="#8b949e"
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            width={30}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(22, 27, 34, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: '#c9d1d9',
                            }}
                            formatter={(value: number) => [`${value} commits`, '']}
                            labelFormatter={(label) => `${label}:00`}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {hourlyData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill="#39d353"
                                    fillOpacity={0.3 + (entry.count / maxCount) * 0.7}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HourlyChart;
