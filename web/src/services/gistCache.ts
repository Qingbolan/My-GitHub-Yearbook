/**
 * GitHub Gist Cache Service
 *
 * Caches commit statistics in a GitHub Gist to avoid repeated API calls.
 * Each user gets their own cache Gist based on their token.
 */

const GIST_DESCRIPTION = 'GitHub Yearbook Cache - DO NOT DELETE';
const CACHE_FILENAME = 'yearbook-cache.json';
const CACHE_VERSION = '1.0';

export interface CommitFileStats {
  filename: string;
  additions: number;
  deletions: number;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  files: CommitFileStats[];
}

export interface YearbookCache {
  version: string;
  userId: string;
  username: string;
  lastUpdated: string;
  // repoFullName -> commitHash -> stats
  commits: Record<string, Record<string, CommitStats>>;
}

interface GistFile {
  filename: string;
  content: string;
  raw_url?: string;
  size?: number;
}

interface GistResponse {
  id: string;
  url: string;
  html_url: string;
  description: string;
  files: Record<string, GistFile>;
}

let cachedGistId: string | null = null;
let cachedData: YearbookCache | null = null;

/**
 * Find existing cache Gist or create a new one
 */
export async function findOrCreateCacheGist(token: string): Promise<string> {
  // Return cached ID if available
  if (cachedGistId) {
    return cachedGistId;
  }

  // Search for existing cache Gist
  const response = await fetch('https://api.github.com/gists?per_page=100', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list gists: ${response.status}`);
  }

  const gists: GistResponse[] = await response.json();
  const existingGist = gists.find(g => g.description === GIST_DESCRIPTION);

  if (existingGist) {
    cachedGistId = existingGist.id;
    return existingGist.id;
  }

  // Create new cache Gist
  const newCache: YearbookCache = {
    version: CACHE_VERSION,
    userId: '',
    username: '',
    lastUpdated: new Date().toISOString(),
    commits: {},
  };

  const createResponse = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        [CACHE_FILENAME]: {
          content: JSON.stringify(newCache, null, 2),
        },
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create cache gist: ${createResponse.status} - ${error}`);
  }

  const newGist: GistResponse = await createResponse.json();
  cachedGistId = newGist.id;
  cachedData = newCache;

  console.log('Created new cache Gist:', newGist.html_url);
  return newGist.id;
}

/**
 * Read cache data from Gist
 */
export async function readCache(token: string): Promise<YearbookCache | null> {
  // Return cached data if available
  if (cachedData) {
    return cachedData;
  }

  try {
    const gistId = await findOrCreateCacheGist(token);

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to read cache gist:', response.status);
      return null;
    }

    const gist: GistResponse = await response.json();
    const cacheFile = gist.files[CACHE_FILENAME];

    if (!cacheFile) {
      console.warn('Cache file not found in gist');
      return null;
    }

    // If file is truncated, fetch raw content
    let content = cacheFile.content;
    if (!content && cacheFile.raw_url) {
      const rawResponse = await fetch(cacheFile.raw_url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      content = await rawResponse.text();
    }

    const cache: YearbookCache = JSON.parse(content);

    // Version check - if version mismatch, return null to rebuild cache
    if (cache.version !== CACHE_VERSION) {
      console.log('Cache version mismatch, rebuilding...');
      return null;
    }

    cachedData = cache;
    return cache;
  } catch (e) {
    console.error('Error reading cache:', e);
    return null;
  }
}

/**
 * Write cache data to Gist
 */
export async function writeCache(token: string, cache: YearbookCache): Promise<void> {
  try {
    const gistId = await findOrCreateCacheGist(token);

    cache.lastUpdated = new Date().toISOString();

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [CACHE_FILENAME]: {
            content: JSON.stringify(cache),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to write cache:', response.status, error);
      return;
    }

    cachedData = cache;
    console.log('Cache updated successfully');
  } catch (e) {
    console.error('Error writing cache:', e);
  }
}

/**
 * Get cached commits for a specific repo
 */
export function getCachedCommits(
  cache: YearbookCache | null,
  repoFullName: string
): Record<string, CommitStats> {
  if (!cache || !cache.commits[repoFullName]) {
    return {};
  }
  return cache.commits[repoFullName];
}

/**
 * Update cache with new commit data
 */
export function updateCacheData(
  cache: YearbookCache,
  repoFullName: string,
  commitHash: string,
  stats: CommitStats
): void {
  if (!cache.commits[repoFullName]) {
    cache.commits[repoFullName] = {};
  }
  cache.commits[repoFullName][commitHash] = stats;
}

/**
 * Clear the cache (delete and recreate)
 */
export async function clearCache(token: string): Promise<void> {
  if (cachedGistId) {
    try {
      await fetch(`https://api.github.com/gists/${cachedGistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.error('Error deleting cache gist:', e);
    }
  }

  cachedGistId = null;
  cachedData = null;
}

/**
 * Get cache statistics
 */
export function getCacheStats(cache: YearbookCache | null): {
  repoCount: number;
  commitCount: number;
  lastUpdated: string | null;
} {
  if (!cache) {
    return { repoCount: 0, commitCount: 0, lastUpdated: null };
  }

  const repoCount = Object.keys(cache.commits).length;
  const commitCount = Object.values(cache.commits).reduce(
    (sum, repo) => sum + Object.keys(repo).length,
    0
  );

  return {
    repoCount,
    commitCount,
    lastUpdated: cache.lastUpdated,
  };
}

/**
 * Reset in-memory cache (useful when token changes)
 */
export function resetMemoryCache(): void {
  cachedGistId = null;
  cachedData = null;
}
