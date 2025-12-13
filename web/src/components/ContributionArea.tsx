import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
    data: Array<{ date: string; count: number }>;
    title?: string;
}

const ContributionArea: React.FC<Props> = ({ data, title = 'contributions in the last year' }) => {
    // Aggregate by week for smoother visualization
    const weeklyData = useMemo(() => {
        const weekMap = new Map<string, { date: string; count: number; label: string }>();

        data.forEach(item => {
            const date = new Date(item.date);
            // Get the start of the week
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            const weekKey = startOfWeek.toISOString().split('T')[0];

            if (weekMap.has(weekKey)) {
                weekMap.get(weekKey)!.count += item.count;
            } else {
                weekMap.set(weekKey, {
                    date: weekKey,
                    count: item.count,
                    label: startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                });
            }
        });

        return Array.from(weekMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    // Format X-axis labels to show month/year
    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);
        return `${month}/${year}`;
    };

    const totalContributions = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-github-secondary">{title}</span>
                <span className="text-xs text-github-secondary font-medium">
                    {totalContributions.toLocaleString()} total
                </span>
            </div>
            <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <defs>
                            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#39d353" stopOpacity={0.6} />
                                <stop offset="50%" stopColor="#26a641" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#0e4429" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke="#8b949e"
                            tick={{ fontSize: 9 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatXAxis}
                            interval="preserveStartEnd"
                            minTickGap={50}
                        />
                        <YAxis
                            stroke="#8b949e"
                            tick={{ fontSize: 9 }}
                            tickLine={false}
                            axisLine={false}
                            width={25}
                            tickFormatter={(v) => v > 0 ? v : ''}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(22, 27, 34, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: '#c9d1d9',
                                fontSize: '12px',
                            }}
                            formatter={(value: number) => [`${value} contributions`, '']}
                            labelFormatter={(label) => {
                                const d = new Date(label);
                                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#39d353"
                            strokeWidth={1.5}
                            fill="url(#greenGradient)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#39d353', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ContributionArea;
