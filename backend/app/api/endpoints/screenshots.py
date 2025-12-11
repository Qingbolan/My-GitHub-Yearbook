from pathlib import Path
from urllib.parse import quote
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import RedirectResponse
from playwright.async_api import async_playwright

from app.services.yearbook import YearbookService

router = APIRouter()

@router.get("/embed/{username}/{period}")
async def get_embed(username: str, period: str):
    """Redirect to embeddable frontend view."""
    try:
        start, end = YearbookService.parse_period(period)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    display_title = period
    if period in ["pastyear", "pastmonth", "pastweek"]:
        display_title = period.replace("past", "Past ").title()
        
    return RedirectResponse(f"/yearbook/{username}/{start}/{end}?embed=1&screenshot=1&title={quote(display_title)}")


@router.get("/card/{username}/{start}/{end}")
async def get_stats_card(
    username: str,
    start: str,
    end: str,
    width: int = 1280,
    view: str | None = None,
):
    """Generate PNG card (screenshot of frontend) for yearbook stats."""
    return await generate_screenshot(username, start, end, width, view=view)


@router.get("/card/{username}/{year}")
async def get_stats_card_year(
    username: str,
    year: str,
    width: int = 1280,
    view: str | None = None,
):
    """Generate PNG card for a specific year (alias to screenshot period)."""
    # Treat year as a "period"
    return await get_screenshot(username, year, width, view)


@router.get("/screenshot/{username}/{period}")
async def get_screenshot(
    username: str,
    period: str,
    width: int = 1280,
    view: str | None = None,
):
    """Generate PNG screenshot for a period."""
    try:
        start, end = YearbookService.parse_period(period)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    display_title = None
    if period in ["pastyear", "pastmonth", "pastweek"]:
        display_title = period.replace("past", "Past ").title()
        
    return await generate_screenshot(username, start, end, width, title=display_title, view=view)


async def generate_screenshot(username: str, start: str, end: str, width: int = 1280, title: str | None = None, view: str | None = None):
    """Shared screenshot generation logic."""
    # Extract year from start date (rough approximation for cache key)
    year = int(start[:4])
    cache_dir = Path("backend/cache")
    cache_dir.mkdir(parents=True, exist_ok=True)
    # Include title and view in cache key
    title_suffix = f"_{title}" if title else ""
    view_suffix = f"_{view}" if view else ""
    cache_file = cache_dir / f"{username}_{year}_{start}_{end}_{width}{title_suffix}{view_suffix}.png"

    # Check cache (30 minute TTL)
    if cache_file.exists():
        mtime = datetime.fromtimestamp(cache_file.stat().st_mtime)
        if datetime.now() - mtime < timedelta(minutes=30):
            return Response(
                content=cache_file.read_bytes(),
                media_type="image/png",
                headers={
                    "Cache-Control": "public, max-age=1800",
                    "Content-Type": "image/png",
                }
            )

    # Use running dev server for rendering to avoid CORS issues with file://
    # This requires 'npm run dev' to be running on port 5173
    file_url = f"http://localhost:5173/yearbook/{username}/{start}/{end}?screenshot=1"
    if title:
        file_url += f"&title={quote(title)}"
    if view:
        file_url += f"&view={quote(view)}"

    # Use Playwright to render the page
    print(f"Generating screenshot for URL: {file_url}")
    async with async_playwright() as p:
        try:
            print("Launching browser...")
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        except Exception as e:
            print(f"Failed to launch browser: {e}")
            raise HTTPException(status_code=500, detail=f"Browser launch failed: {str(e)}")

        try:
            # Create context with appropriate viewport
            context = await browser.new_context(
                viewport={"width": width, "height": 1200}, # Taller viewport for full content
                device_scale_factor=2,
            )
            page = await context.new_page()
            
            # Go to page and wait for network idle to ensure data is fetching
            print("Navigating to page...")
            await page.goto(file_url, wait_until="networkidle", timeout=60000)
            print("Navigation complete. Waiting for selector...")
            
            # Wait for the specific target element to be ready
            # We target #screenshot-target which wraps Card + Map
            await page.wait_for_selector("#screenshot-target", state="attached", timeout=60000)
            print("Selector found. Waiting for animation...")
            
            # Brief pause to ensure all charts/maps are fully rendered/animated
            await page.wait_for_timeout(2000)
            
            element = await page.query_selector("#screenshot-target")
            if not element:
                print("Element not found after wait.")
                raise HTTPException(status_code=500, detail="Card element not found in frontend page.")
            
            print("Taking screenshot...")
            png_bytes = await element.screenshot(type="png")
            print("Screenshot taken.")
            
            # Save to cache
            cache_file.write_bytes(png_bytes)
            
            return Response(
                content=png_bytes,
                media_type="image/png",
                headers={
                    "Cache-Control": "public, max-age=1800",
                    "Content-Type": "image/png",
                }
            )
        except Exception as e:
            print(f"Error generating screenshot step: {e}")
            # print stack trace
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to generate card: {str(e)}")
        finally:
            await browser.close()
