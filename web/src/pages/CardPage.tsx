import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Github, Code, Terminal, Calendar } from 'lucide-react';
import type { AppData, Commit } from '../types';
import { Analyzer } from '../utils/analyzer';
import ContributionGraph from '../components/ContributionGraph';

const CardPage: React.FC = () => {
    const { username, start, end } = useParams<{ username: string; start: string; end: string }>();
    const [rawData, setRawData] = useState<{ commits: Commit[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/data.json')
            .then(res => res.json())
            .then(data => {
                setRawData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load data", err);
                setLoading(false);
            });
    }, []);

    const appData: AppData | null = useMemo(() => {
        if (!rawData || !username || !start || !end) return null;

        const analyzer = new Analyzer(rawData.commits);
        const filteredAnalyzer = analyzer
            .filterByAuthor(username)
            .filterByDateRange(start, end);

        return filteredAnalyzer.generateAppData();
    }, [rawData, username, start, end]);

    if (loading) return <div className="p-4 text-github-secondary">Loading...</div>;
    if (!appData) return <div className="p-4 text-red-500">No data found</div>;

    return (
        <div className="bg-github-card border border-github-border rounded-xl p-6 w-full h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-github-dark rounded-full border border-github-border">
                        <Github className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-none">{username}</h1>
                        <p className="text-xs text-github-secondary mt-1">{start} to {end}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-github-accent">{appData.summary.total_commits}</div>
                    <div className="text-xs text-github-secondary uppercase">Commits</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-github-dark p-3 rounded-lg border border-github-border text-center">
                    <Code className="w-4 h-4 text-github-accent mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{appData.summary.top_repo.substring(0, 15)}{appData.summary.top_repo.length > 15 ? '...' : ''}</div>
                    <div className="text-[10px] text-github-secondary uppercase">Top Repo</div>
                </div>
                <div className="bg-github-dark p-3 rounded-lg border border-github-border text-center">
                    <Terminal className="w-4 h-4 text-github-success mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{appData.summary.total_repos}</div>
                    <div className="text-[10px] text-github-secondary uppercase">Repos</div>
                </div>
                <div className="bg-github-dark p-3 rounded-lg border border-github-border text-center">
                    <Calendar className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{appData.summary.peak_month.split(' ')[0]}</div>
                    <div className="text-[10px] text-github-secondary uppercase">Peak</div>
                </div>
            </div>

            <div className="flex-grow">
                <ContributionGraph data={appData.timeline} />
            </div>
        </div>
    );
};

export default CardPage;
