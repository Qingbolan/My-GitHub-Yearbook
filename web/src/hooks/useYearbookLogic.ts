import { useState, useEffect, useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { getYearbookStats, type YearbookStats } from '../services/api'

// Core hook that takes direct arguments
export function useYearbookStats(
    username: string | undefined,
    yearStr: string | undefined,
    start?: string,
    end?: string
) {
    const [data, setData] = useState<YearbookStats | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Helper to resolve period keywords
    let resolvedStart = start
    let resolvedEnd = end

    // Default to current year if no year/start provided
    let resolvedYear = yearStr ? parseInt(yearStr) : new Date().getFullYear()

    if (yearStr && ['pastyear', 'pastmonth', 'pastweek'].includes(yearStr.toLowerCase())) {
        const today = new Date()
        const d = new Date()
        if (yearStr === 'pastyear') d.setDate(d.getDate() - 365)
        else if (yearStr === 'pastmonth') d.setDate(d.getDate() - 30)
        else if (yearStr === 'pastweek') d.setDate(d.getDate() - 7)

        resolvedStart = d.toISOString().split('T')[0]
        resolvedEnd = today.toISOString().split('T')[0]
        resolvedYear = today.getFullYear()
    }

    const year = resolvedStart ? parseInt(resolvedStart.slice(0, 4)) : resolvedYear

    useEffect(() => {
        if (!username) return
        setLoading(true)
        setError('')
        getYearbookStats(username, year, undefined, resolvedStart, resolvedEnd)
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [username, year, resolvedStart, resolvedEnd])

    const stats = useMemo(() => {
        if (!data) return null
        const repos = data.repositoryContributions || []
        const timeline = data.dailyContributions || []
        const total = data.totalContributions || data.totalCommits

        // Weekly activity
        const weekMap = new Map<number, number>()
        const oneWeekMs = 604800000
        const startDateRef = resolvedStart ? new Date(resolvedStart) : new Date(`${year}-01-01`)
        const endDateRef = resolvedEnd ? new Date(resolvedEnd) : new Date(`${year}-12-31`)
        const isCustom = !!(resolvedStart && resolvedEnd && !(resolvedStart.endsWith('-01-01') && resolvedEnd.endsWith('-12-31')))
        const totalDays = Math.max(1, Math.floor((endDateRef.getTime() - startDateRef.getTime()) / 86400000) + 1)
        const weeksCount = isCustom ? Math.max(1, Math.ceil(totalDays / 7)) : 52

        timeline.forEach(d => {
            const date = new Date(d.date)
            const diffTime = endDateRef.getTime() - date.getTime()
            const weeksAgo = Math.floor(diffTime / oneWeekMs)
            const weekIndex = (weeksCount - 1) - weeksAgo
            if (weekIndex >= 0 && weekIndex < weeksCount) {
                weekMap.set(weekIndex, (weekMap.get(weekIndex) || 0) + d.count)
            }
        })

        const weeks = Array(weeksCount).fill(0)
        weekMap.forEach((count, idx) => { weeks[idx] = count })
        const maxW = Math.max(...weeks, 1)

        // Day of week distribution
        const dayOfWeek = [0, 0, 0, 0, 0, 0, 0]
        timeline.forEach(d => {
            const day = new Date(d.date).getDay()
            dayOfWeek[day] += d.count
        })
        const maxDay = Math.max(...dayOfWeek, 1)

        // Most productive day
        const maxDayEntry = timeline.reduce((max, d) => d.count > (max?.count || 0) ? d : max, timeline[0])

        const privateRepos = repos.filter(r => r.isPrivate)
        const publicRepos = repos.filter(r => !r.isPrivate && !r.repo.includes('Private'))

        return {
            total,
            commits: data.totalCommits,
            prs: data.pullRequests,
            reviews: data.pullRequestReviews,
            issues: data.issues,
            repoCount: repos.length,
            publicRepoCount: data.publicRepoCount,
            privateRepoCount: data.privateRepoCount,
            totalRepoCount: data.totalRepoCount,
            stars: repos.reduce((s, r) => s + (r.stars || 0), 0),
            forks: repos.reduce((s, r) => s + (r.forks || 0), 0),
            longest: data.longestStreak,
            current: data.currentStreak,
            activeDays: data.activeDays,
            weeks,
            maxW,
            weeksCount,
            dayOfWeek,
            maxDay,
            maxDayEntry,
            avgPerDay: (total / Math.max(data.activeDays, 1)).toFixed(1),
            bio: data.bio,
            company: data.company,
            location: data.location,
            followers: data.followers,
            following: data.following,
            avatarUrl: data.avatarUrl,
            organizations: data.organizations,
            languageStats: data.languageStats || [],
            contributedRepos: repos,
            privateRepos,
            publicRepos,
            cached: data.cached,
        }
    }, [data, resolvedStart, resolvedEnd, year])

    const displayYearStr = resolvedStart?.slice(0, 4) || String(resolvedYear)
    const isCustomRange = !!(resolvedStart && resolvedEnd && !(resolvedStart.endsWith('-01-01') && resolvedEnd.endsWith('-12-31')))

    return {
        resolvedStart,
        resolvedEnd,
        yearStr: displayYearStr,
        isCustomRange,
        data,
        loading,
        error,
        stats,
    }
}


// Router wrapper for existing pages
export function useYearbookLogic() {
    const { username, year: yearParam, start, end } = useParams<{ username: string; year?: string; start?: string; end?: string }>()
    const location = useLocation()

    // Calculate display title from query param or year param
    let explicitTitle = new URLSearchParams(location.search).get('title')

    if (!explicitTitle && yearParam && ['pastyear', 'pastmonth', 'pastweek'].includes(yearParam.toLowerCase())) {
        explicitTitle = yearParam.replace('past', 'Past ').replace(/^\w/, c => c.toUpperCase())
    }

    const isScreenshot = useMemo(() => {
        const params = new URLSearchParams(location.search)
        return params.get('screenshot') === '1'
    }, [location.search])

    const embed = useMemo(() => {
        const params = new URLSearchParams(location.search)
        return params.get('embed') === '1'
    }, [location.search])

    // Use the core hook
    const logic = useYearbookStats(username, yearParam, start, end)

    return {
        username,
        title: explicitTitle,
        isScreenshot,
        embed,
        start,
        end,
        ...logic
    }
}
