import os
import pandas as pd
from github import Github
from git import Repo
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class DataCollector:
    def __init__(self, config):
        self.config = config
        self.start_date = datetime.strptime(config['start_date'], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        self.end_date = datetime.strptime(config['end_date'], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        self.username = config.get('github_username', '').lower()
        self.commits = []

    def _is_author_match(self, author_name, author_email=None):
        """Check if the commit author matches the configured username."""
        if not self.username:
            return True  # No filter if username not set

        author_name_lower = author_name.lower() if author_name else ''
        author_email_lower = author_email.lower() if author_email else ''

        # Match by username in name or email
        return (self.username in author_name_lower or
                self.username in author_email_lower or
                author_name_lower in ['silan hu', 'silan.hu', 'qingbolan', 'silan'])

    def collect_all(self):
        self.collect_local()
        self.collect_remote()
        return pd.DataFrame(self.commits)

    def collect_local(self):
        local_repos = self.config.get('local_repos', [])
        for repo_path in local_repos:
            if not os.path.exists(repo_path):
                logger.warning(f"Local repo not found: {repo_path}")
                continue
            
            try:
                repo = Repo(repo_path)
                repo_name = os.path.basename(repo_path)
                logger.info(f"Scanning local repo: {repo_name}")
                
                for commit in repo.iter_commits():
                    commit_date = datetime.fromtimestamp(commit.committed_date, tz=timezone.utc)
                    if self.start_date <= commit_date <= self.end_date:
                        author_name = commit.author.name
                        author_email = commit.author.email if commit.author.email else ''

                        # Only include commits by the configured user
                        if not self._is_author_match(author_name, author_email):
                            continue

                        # Collect per-file stats
                        file_stats = {}
                        for file_path, stats in commit.stats.files.items():
                            file_stats[file_path] = {
                                'insertions': stats['insertions'],
                                'deletions': stats['deletions']
                            }

                        self.commits.append({
                            'repo': repo_name,
                            'hash': commit.hexsha,
                            'date': commit_date,
                            'author': author_name,
                            'message': commit.message.strip(),
                            'files': list(commit.stats.files.keys()),
                            'file_stats': file_stats,
                            'insertions': commit.stats.total['insertions'],
                            'deletions': commit.stats.total['deletions'],
                            'source': 'local'
                        })
            except Exception as e:
                logger.error(f"Error scanning local repo {repo_path}: {e}")

    def collect_remote(self):
        token = os.getenv(self.config.get('github_token_env'))
        if not token:
            logger.warning("No GitHub token found. Skipping remote collection.")
            return

        g = Github(token)
        try:
            user = g.get_user()
            logger.info(f"Scanning remote repos for user: {user.login}")
            
            # This can be slow, might need optimization or specific repo list
            for repo in user.get_repos():
                # Optimization: Skip if updated_at is before start_date
                if repo.updated_at.replace(tzinfo=timezone.utc) < self.start_date:
                    continue
                
                try:
                    # Get commits in date range, filter by author
                    commits = repo.get_commits(since=self.start_date, until=self.end_date)
                    for commit in commits:
                        author_name = commit.commit.author.name if commit.commit.author else ''
                        author_email = commit.commit.author.email if commit.commit.author else ''

                        # Only include commits by the configured user
                        if not self._is_author_match(author_name, author_email):
                            continue

                        # Collect per-file stats
                        file_stats = {}
                        for f in commit.files:
                            file_stats[f.filename] = {
                                'insertions': f.additions,
                                'deletions': f.deletions
                            }

                        self.commits.append({
                            'repo': repo.name,
                            'hash': commit.sha,
                            'date': commit.commit.author.date.replace(tzinfo=timezone.utc),
                            'author': author_name,
                            'message': commit.commit.message,
                            'files': [f.filename for f in commit.files],
                            'file_stats': file_stats,
                            'insertions': commit.stats.additions,
                            'deletions': commit.stats.deletions,
                            'source': 'remote'
                        })
                except Exception as e:
                    logger.warning(f"Error accessing repo {repo.name}: {e}")
        except Exception as e:
            logger.error(f"GitHub API Error: {e}")

    def deduplicate(self):
        # Convert to DF first then dedupe by hash
        df = pd.DataFrame(self.commits)
        if not df.empty:
            df = df.drop_duplicates(subset=['hash'])
        return df
