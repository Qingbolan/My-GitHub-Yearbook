import React from 'react';
import { Star, GitFork, Lock, Building2, ExternalLink } from 'lucide-react';
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
    'Shell': '#89e051',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Vue': '#41b883',
    'Dart': '#00B4AB',
    'C#': '#178600',
};

const RepoCard: React.FC<Props> = ({ repos }) => {
    // Get top 6 repos with most stars or commits
    const topRepos = [...repos]
        .filter(r => r.repo !== 'Private Contributions' && r.repo !== 'Other Private Repos')
        .sort((a, b) => (b.stars || 0) - (a.stars || 0) || b.count - a.count)
        .slice(0, 6);

    if (topRepos.length === 0) {
        return null;
    }

    const totalStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks || 0), 0);

    return (
        <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-github-text">Top Repositories</h2>
                <div className="flex gap-4 text-sm text-github-secondary">
                    <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {totalStars.toLocaleString()} stars
                    </span>
                    <span className="flex items-center gap-1">
                        <GitFork className="w-4 h-4 text-github-secondary" />
                        {totalForks.toLocaleString()} forks
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topRepos.map((repo) => (
                    <a
                        key={repo.fullName || repo.repo}
                        href={repo.url || `https://github.com/${repo.fullName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-github-dark rounded-lg border border-github-border hover:border-github-accent transition-all duration-200 group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                                {repo.isPrivate && <Lock className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                                {repo.isOrg && <Building2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                                <span className="text-github-accent font-medium truncate group-hover:underline">
                                    {repo.repo}
                                </span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-github-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>

                        {repo.description && (
                            <p className="text-xs text-github-secondary mb-3 line-clamp-2">
                                {repo.description}
                            </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-github-secondary">
                            {repo.language && (
                                <span className="flex items-center gap-1">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#8b949e' }}
                                    />
                                    {repo.language}
                                </span>
                            )}
                            {(repo.stars ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    {repo.stars?.toLocaleString()}
                                </span>
                            )}
                            {(repo.forks ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <GitFork className="w-3 h-3" />
                                    {repo.forks?.toLocaleString()}
                                </span>
                            )}
                            <span className="text-github-text font-medium ml-auto">
                                {repo.count} commits
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default RepoCard;
