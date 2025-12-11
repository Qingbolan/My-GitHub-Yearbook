
import { Header } from './Header'
import { StatsGrid } from './StatsGrid'
import { ActivitySection } from './ActivitySection'
import { TechStackSection } from './TechStackSection'
import { RepoSection } from './RepoSection'
import { Footer } from './Footer'
import { ProcessedYearbookStats } from '../../types'
import { forwardRef } from 'react'

interface YearbookCardProps {
    stats: ProcessedYearbookStats
    username: string
    yearStr: string
    title?: string | null
    isCustomRange: boolean
    resolvedStart?: string
    resolvedEnd?: string
    isScreenshot?: boolean
}

export const YearbookCard = forwardRef<HTMLDivElement, YearbookCardProps>(({
    stats,
    username,
    yearStr,
    title = null,
    isCustomRange,
    resolvedStart,
    resolvedEnd,
    isScreenshot = false
}, ref) => {
    return (
        <div
            id="yearbook-card"
            ref={ref}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden mb-6"
        >
            <Header
                stats={stats}
                title={title}
                username={username}
                yearStr={yearStr}
                isCustomRange={isCustomRange}
                resolvedStart={resolvedStart}
                resolvedEnd={resolvedEnd}
            />

            <StatsGrid stats={stats} />

            <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#21262d]">
                <ActivitySection stats={stats} isCustomRange={isCustomRange} />
                <TechStackSection stats={stats} />
                <RepoSection stats={stats} isScreenshot={isScreenshot} />
            </div>

            <Footer />
        </div>
    )
})

YearbookCard.displayName = 'YearbookCard'
