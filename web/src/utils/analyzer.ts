import type { AppData, Commit, SummaryStats, TimelineItem, ProjectItem, KeywordItem } from '../types';

export class Analyzer {
    public commits: Commit[];

    constructor(commits: Commit[]) {
        this.commits = commits;
    }

    filterByAuthor(username: string): Analyzer {
        if (!username) return this;
        const filtered = this.commits.filter(c =>
            c.author.toLowerCase().includes(username.toLowerCase())
        );
        return new Analyzer(filtered);
    }

    filterByDateRange(start: string, end: string): Analyzer {
        if (!start || !end) return this;
        const filtered = this.commits.filter(c => {
            const commitDate = c.date.substring(0, 10); // YYYY-MM-DD
            return commitDate >= start && commitDate <= end;
        });
        return new Analyzer(filtered);
    }

    getSummaryStats(): SummaryStats {
        const total_commits = this.commits.length;
        const repos = new Set(this.commits.map(c => c.repo));
        const total_repos = repos.size;

        let total_lines_added = 0;
        let total_lines_deleted = 0;
        this.commits.forEach(c => {
            total_lines_added += c.insertions;
            total_lines_deleted += c.deletions;
        });

        if (total_commits === 0) {
            return {
                total_commits: 0,
                total_repos: 0,
                top_repo: 'N/A',
                peak_month: 'N/A',
                text: 'No commits found for this criteria.',
                total_lines_added: 0,
                total_lines_deleted: 0
            };
        }

        // Top Repo
        const repoCounts: Record<string, number> = {};
        this.commits.forEach(c => {
            repoCounts[c.repo] = (repoCounts[c.repo] || 0) + 1;
        });
        const top_repo = Object.entries(repoCounts).sort((a, b) => b[1] - a[1])[0][0];

        // Peak Month
        const monthCounts: Record<string, number> = {};
        this.commits.forEach(c => {
            const month = c.date.substring(0, 7); // YYYY-MM
            monthCounts[month] = (monthCounts[month] || 0) + 1;
        });
        const peakMonthKey = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0][0];
        const peak_month = new Date(peakMonthKey + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

        return {
            total_commits,
            total_repos,
            top_repo,
            peak_month,
            text: `In ${this.commits[0]?.date.substring(0, 4) || 'selected period'}, I made ${total_commits} commits across ${total_repos} repositories. ${top_repo} was my main focus. ${peak_month} was my peak month.`,
            total_lines_added,
            total_lines_deleted
        };
    }

    getTimelineStats(): TimelineItem[] {
        const dailyCounts: Record<string, number> = {};
        this.commits.forEach(c => {
            const date = c.date.substring(0, 10); // YYYY-MM-DD
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });

        return Object.entries(dailyCounts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    getProjectStats(): ProjectItem[] {
        const repoCounts: Record<string, number> = {};
        this.commits.forEach(c => {
            repoCounts[c.repo] = (repoCounts[c.repo] || 0) + 1;
        });

        return Object.entries(repoCounts)
            .map(([repo, count]) => ({ repo, count }))
            .sort((a, b) => b.count - a.count);
    }

    getLanguageStats(): Record<string, number> {
        const extMap: Record<string, string> = {
            '.py': 'Python', '.go': 'Go', '.rs': 'Rust', '.js': 'JavaScript',
            '.ts': 'TypeScript', '.tsx': 'TypeScript', '.jsx': 'JavaScript',
            '.sh': 'Shell', '.tex': 'LaTeX', '.md': 'Markdown', '.cpp': 'C++',
            '.c': 'C', '.java': 'Java', '.html': 'HTML', '.css': 'CSS',
            '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML'
        };

        const langStats: Record<string, number> = {};

        this.commits.forEach(c => {
            if (c.file_stats) {
                // Use per-file stats if available
                Object.entries(c.file_stats).forEach(([file, stats]) => {
                    const ext = '.' + file.split('.').pop();
                    if (extMap[ext]) {
                        const lang = extMap[ext];
                        // Sum of insertions + deletions as "activity" or just insertions?
                        // Usually LOC refers to lines added, but activity is both.
                        // Let's use insertions for "LOC" contribution, or sum.
                        // The user asked for "code line statistics", usually means volume of code written.
                        // I'll use insertions + deletions as a measure of activity, or just insertions.
                        // Let's use insertions for now as it represents "new code".
                        langStats[lang] = (langStats[lang] || 0) + stats.insertions;
                    }
                });
            } else {
                // Fallback to file counts if no file_stats
                c.files.forEach(file => {
                    const ext = '.' + file.split('.').pop();
                    if (extMap[ext]) {
                        const lang = extMap[ext];
                        langStats[lang] = (langStats[lang] || 0) + 1;
                    }
                });
            }
        });

        return langStats;
    }

    getKeywords(topN: number = 50): KeywordItem[] {
        const stopwords = new Set(['merge', 'pull', 'request', 'branch', 'commit', 'fix', 'feat', 'chore', 'update', 'add', 'remove', 'delete', 'the', 'and', 'for', 'with', 'to', 'in', 'of', 'a', 'an']);
        const wordCounts: Record<string, number> = {};

        this.commits.forEach(c => {
            const words = c.message.toLowerCase().match(/\w+/g) || [];
            words.forEach(w => {
                if (w.length > 2 && !stopwords.has(w)) {
                    wordCounts[w] = (wordCounts[w] || 0) + 1;
                }
            });
        });

        return Object.entries(wordCounts)
            .map(([text, value]) => ({ text, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, topN);
    }

    generateAppData(): AppData {
        return {
            summary: this.getSummaryStats(),
            timeline: this.getTimelineStats(),
            projects: this.getProjectStats(),
            languages: this.getLanguageStats(),
            keywords: this.getKeywords()
        };
    }
}
