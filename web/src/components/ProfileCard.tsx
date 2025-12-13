import React from 'react';
import { GitCommit, FolderGit2, Clock, MapPin } from 'lucide-react';

interface Props {
    username: string;
    displayName?: string;
    totalContributions: number;
    totalRepos: number;
    joinYear?: number;
    location?: string;
    avatarUrl?: string;
}

const ProfileCard: React.FC<Props> = ({
    username,
    displayName,
    totalContributions,
    totalRepos,
    joinYear,
    location,
    avatarUrl,
}) => {
    const currentYear = new Date().getFullYear();
    const yearsOnGitHub = joinYear ? currentYear - joinYear : undefined;

    return (
        <div className="flex items-start gap-4">
            {/* Avatar */}
            {avatarUrl && (
                <img
                    src={avatarUrl}
                    alt={username}
                    className="w-16 h-16 rounded-full border-2 border-white/10"
                />
            )}

            {/* Info */}
            <div className="flex-1">
                <h2 className="text-xl font-bold text-github-accent mb-2">
                    {username}
                    {displayName && displayName !== username && (
                        <span className="text-github-secondary font-normal ml-1">({displayName})</span>
                    )}
                </h2>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-github-secondary">
                    <div className="flex items-center gap-1.5">
                        <GitCommit className="w-4 h-4" />
                        <span>{totalContributions.toLocaleString()} Contributions in {currentYear}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <FolderGit2 className="w-4 h-4" />
                        <span>{totalRepos} Public Repos</span>
                    </div>

                    {yearsOnGitHub && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>Joined GitHub {yearsOnGitHub} years ago</span>
                        </div>
                    )}

                    {location && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{location}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
