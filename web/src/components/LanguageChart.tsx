import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { RepoContribution } from '../services/github';

interface Props {
    repos: RepoContribution[];
}

// GitHub-style language colors
const LANGUAGE_COLORS: Record<string, string> = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'C++': '#f34b7d',
    'C': '#555555',
    'Ruby': '#701516',
    'PHP': '#4F5D95',
    'Swift': '#F05138',
    'Kotlin': '#A97BFF',
    'Scala': '#c22d40',
    'Shell': '#89e051',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Vue': '#41b883',
    'Dart': '#00B4AB',
    'Jupyter Notebook': '#DA5B0B',
    'C#': '#178600',
};

const DEFAULT_COLORS = ['#58a6ff', '#238636', '#22d3ee', '#f1e05a', '#f56c6c', '#79c0ff', '#7ee787'];

const LanguageChart: React.FC<Props> = ({ repos }) => {
    const languageData = useMemo(() => {
        const langCounts: Record<string, { count: number; commits: number }> = {};

        repos.forEach(repo => {
            if (repo.language && repo.count > 0) {
                if (!langCounts[repo.language]) {
                    langCounts[repo.language] = { count: 0, commits: 0 };
                }
                langCounts[repo.language].count += 1;
                langCounts[repo.language].commits += repo.count;
            }
        });

        return Object.entries(langCounts)
            .map(([name, data]) => ({
                name,
                value: data.commits,
                repos: data.count,
                color: LANGUAGE_COLORS[name] || DEFAULT_COLORS[Object.keys(langCounts).indexOf(name) % DEFAULT_COLORS.length],
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [repos]);

    const totalCommits = languageData.reduce((sum, lang) => sum + lang.value, 0);

    if (languageData.length === 0) {
        return (
            <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-github-text">Languages</h2>
                <p className="text-github-secondary text-center py-8">No language data available</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-github-text">Top Languages</h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={languageData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {languageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#161b22',
                                borderColor: '#30363d',
                                color: '#c9d1d9',
                                borderRadius: '8px',
                            }}
                            formatter={(value: number, name: string) => [
                                `${value} commits (${((value / totalCommits) * 100).toFixed(1)}%)`,
                                name,
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Language legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {languageData.map((lang) => (
                    <div key={lang.name} className="flex items-center gap-1.5 text-xs">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: lang.color }}
                        />
                        <span className="text-github-secondary">{lang.name}</span>
                        <span className="text-github-text font-medium">
                            {((lang.value / totalCommits) * 100).toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LanguageChart;
