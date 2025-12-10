import os
import sys
import logging
import json
from src.utils import load_config
from src.collector import DataCollector
from src.analyzer import Analyzer
from src.visualizer import Visualizer


# Correct imports based on file structure
from src.report import ReportGenerator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting GitHub Yearbook Generator")
    
    # Load Config
    try:
        config = load_config()
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        return

    # Collect Data
    collector = DataCollector(config)
    logger.info("Collecting data (local + remote)...")
    collector.collect_all()  # collect_remote() safely no-ops when token missing
    
    # Get raw commits
    df = collector.deduplicate()
    logger.info(f"Collected {len(df)} unique commits.")
    
    if df.empty:
        logger.warning("No commits found. Check your config and repo paths.")
        commits = []
    else:
        # Convert DataFrame back to list of dicts for JSON export
        # Ensure dates are strings
        # We need to keep a copy of df for analysis before converting dates to strings if Analyzer expects datetime objects
        # Analyzer expects 'date' column to be datetime, which it converts in __init__ if not empty.
        # But collector.deduplicate() returns a DF. Let's check collector.py to be sure about the format.
        # Assuming df has 'date' as datetime or string that pandas can parse.
        
        # Create Analyzer instance
        analyzer = Analyzer(df)
        
        # Generate Stats
        stats = analyzer.get_summary_stats()
        monthly_stats = analyzer.timeline_stats()
        project_stats = analyzer.project_stats()
        lang_stats = analyzer.language_stats()
        keywords = analyzer.message_keywords()
        
        # Visualizations
        visualizer = Visualizer(config.get('output_dir', 'outputs'))
        visualizer.plot_timeline(monthly_stats)
        visualizer.plot_projects(project_stats)
        visualizer.plot_languages(lang_stats)
        visualizer.plot_wordcloud(keywords)
        visualizer.generate_social_card(stats)
        
        # Generate Report
        report_gen = ReportGenerator(config.get('output_dir', 'outputs'))
        summary_text = f"A year of code! You made {stats['total_commits']} commits across {stats['total_repos']} repositories. Your most active month was {stats['peak_month']}."
        
        start_date = config.get('start_date', 'N/A')
        end_date = config.get('end_date', 'N/A')
        
        report_path = report_gen.generate_html(stats, summary_text, start_date, end_date)
        logger.info(f"Report generated at {report_path}")

        # Prepare for JSON export
        df_export = df.copy()
        if not df_export.empty:
             df_export['date'] = df_export['date'].dt.strftime('%Y-%m-%d %H:%M:%S%z')
        commits = df_export.to_dict('records')

    # Export Raw Data
    logger.info("Exporting raw data to JSON...")
    
    export_data = {
        "generated_at": os.popen('date -u +"%Y-%m-%dT%H:%M:%SZ"').read().strip(),
        "commits": commits
    }

    output_path = os.path.join("web", "public", "data.json")
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(export_data, f, indent=2)
    
    logger.info(f"Raw data exported to {output_path}")

if __name__ == "__main__":
    main()
