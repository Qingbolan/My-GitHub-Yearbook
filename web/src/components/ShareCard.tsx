import React, { useRef, useState } from 'react';
import { Share2, Download, Check, Twitter, Copy } from 'lucide-react';
import type { SummaryStats } from '../types';

interface Props {
    username: string;
    summary: SummaryStats;
    year: string;
}

const ShareCard: React.FC<Props> = ({ username, summary, year }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const shareUrl = window.location.href;
    const shareText = `Check out my ${year} GitHub Yearbook! ${summary.total_commits.toLocaleString()} contributions across ${summary.total_repos} repos.`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareToTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    };

    const downloadCard = async () => {
        if (!cardRef.current) return;

        try {
            // Dynamic import for html2canvas (need to add this dependency)
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#0d1117',
                scale: 2,
            });
            const link = document.createElement('a');
            link.download = `github-yearbook-${username}-${year}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to download card:', err);
            // Fallback: just copy the URL
            copyToClipboard();
        }
    };

    return (
        <div className="relative">
            {/* Share Button */}
            <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-github-card border border-github-border rounded-lg hover:border-github-accent transition-colors text-github-text"
            >
                <Share2 className="w-4 h-4" />
                Share Yearbook
            </button>

            {/* Share Menu */}
            {showShareMenu && (
                <div className="absolute top-full mt-2 right-0 bg-github-card border border-github-border rounded-lg shadow-xl z-50 p-4 w-80">
                    {/* Preview Card */}
                    <div
                        ref={cardRef}
                        className="mb-4 p-4 bg-gradient-to-br from-github-dark via-github-card to-github-dark rounded-lg border border-github-border"
                    >
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-1">
                                {year} <span className="text-transparent bg-clip-text bg-gradient-to-r from-github-accent to-cyan-500">Yearbook</span>
                            </div>
                            <div className="text-github-secondary text-sm mb-3">@{username}</div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="text-xl font-bold text-github-accent">{summary.total_commits.toLocaleString()}</div>
                                    <div className="text-xs text-github-secondary">Commits</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-green-500">{summary.total_repos}</div>
                                    <div className="text-xs text-github-secondary">Repos</div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-cyan-400 truncate">{summary.top_repo}</div>
                                    <div className="text-xs text-github-secondary">Top Repo</div>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-github-secondary">
                                github-yearbook.vercel.app
                            </div>
                        </div>
                    </div>

                    {/* Share Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center gap-3 px-3 py-2 bg-github-dark rounded-lg hover:bg-github-border transition-colors text-left"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4 text-github-secondary" />
                            )}
                            <span className="text-github-text text-sm">
                                {copied ? 'Copied!' : 'Copy Link'}
                            </span>
                        </button>

                        <button
                            onClick={shareToTwitter}
                            className="w-full flex items-center gap-3 px-3 py-2 bg-github-dark rounded-lg hover:bg-github-border transition-colors text-left"
                        >
                            <Twitter className="w-4 h-4 text-blue-400" />
                            <span className="text-github-text text-sm">Share on Twitter</span>
                        </button>

                        <button
                            onClick={downloadCard}
                            className="w-full flex items-center gap-3 px-3 py-2 bg-github-dark rounded-lg hover:bg-github-border transition-colors text-left"
                        >
                            <Download className="w-4 h-4 text-github-secondary" />
                            <span className="text-github-text text-sm">Download Card</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {showShareMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShareMenu(false)}
                />
            )}
        </div>
    );
};

export default ShareCard;
