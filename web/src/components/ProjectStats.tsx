import React from 'react';
import { Building2, Lock } from 'lucide-react';
import type { ProjectItem } from '../types';

interface Props {
    data: ProjectItem[];
}

const COLORS = ['#58a6ff', '#238636', '#22d3ee', '#f1e05a', '#f56c6c'];

const ProjectStats: React.FC<Props> = ({ data }) => {
    const topProjects = data.slice(0, 8);

    return (
        <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-github-text">Top Projects</h2>
                <div className="flex gap-3 text-xs text-github-secondary">
                    <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-cyan-400" /> Org
                    </span>
                    <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-red-400" /> Private
                    </span>
                </div>
            </div>

            {/* List view for better readability */}
            <div className="space-y-3">
                {topProjects.map((project, index) => {
                    const maxCount = topProjects[0]?.count || 1;
                    const percentage = (project.count / maxCount) * 100;

                    return (
                        <div key={project.fullName || project.repo} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-white font-medium truncate max-w-[200px]">
                                        {project.owner && project.isOrg ? (
                                            <span className="text-cyan-400">{project.owner}/</span>
                                        ) : null}
                                        {project.repo}
                                    </span>
                                    {project.isPrivate && <Lock className="w-3 h-3 text-red-400" />}
                                    {project.isOrg && <Building2 className="w-3 h-3 text-cyan-400" />}
                                </div>
                                <span className="text-github-secondary text-sm">{project.count} commits</span>
                            </div>
                            <div className="w-full bg-github-border rounded-full h-2">
                                <div
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: COLORS[index % COLORS.length],
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {data.length > 8 && (
                <p className="text-github-secondary text-xs mt-4 text-center">
                    + {data.length - 8} more repositories
                </p>
            )}
        </div>
    );
};

export default ProjectStats;
