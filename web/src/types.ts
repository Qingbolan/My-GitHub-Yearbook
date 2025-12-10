export interface SummaryStats {
    total_commits: number;
    total_repos: number;
    top_repo: string;
    peak_month: string;
    text: string;
    total_lines_added?: number;
    total_lines_deleted?: number;
    avg_commits_per_day?: number;
    longest_streak?: number;
    current_streak?: number;
}

// 星期分布统计
export interface WeekdayStats {
    day: string;
    dayIndex: number;
    count: number;
}

// 时间段分布统计
export interface HourlyStats {
    hour: number;
    label: string;
    count: number;
}

// 仓库详细信息
export interface RepoDetails {
    name: string;
    fullName: string;
    description?: string;
    stars: number;
    forks: number;
    language?: string;
    isPrivate: boolean;
    isOrg: boolean;
    url?: string;
}

export interface TimelineItem {
    date: string;
    count: number;
}

export interface ProjectItem {
    repo: string;
    fullName?: string;
    owner?: string;
    count: number;
    isPrivate?: boolean;
    isOrg?: boolean;
}

export interface KeywordItem {
    text: string;
    value: number;
}

export interface Commit {
    repo: string;
    hash: string;
    date: string;
    author: string;
    message: string;
    files: string[];
    file_stats?: Record<string, { insertions: number; deletions: number }>;
    insertions: number;
    deletions: number;
    source: string;
}

export interface AppData {
    summary: SummaryStats;
    timeline: TimelineItem[];
    projects: ProjectItem[];
    languages: Record<string, number>;
    keywords: KeywordItem[];
    weekdayStats?: WeekdayStats[];
    hourlyStats?: HourlyStats[];
    repoDetails?: RepoDetails[];
}
