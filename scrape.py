import requests
from urllib.parse import urlparse, urljoin
import logging
from bs4 import BeautifulSoup # For basic sitemap check

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def scrape_website(url: str, timeout: int = 15) -> str | None:
    """Scrape a website and return its HTML content."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.48 ZScraper/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'DNT': '1', # Do Not Track
        }
        
        parsed_url = urlparse(url)
        if not parsed_url.scheme:
            url = 'https://' + url # Default to https
        
        logger.info(f"Attempting to fetch URL: {url}")
        
        # Basic robots.txt check (very simplified, not fully compliant)
        try:
            robots_url = urljoin(url, "/robots.txt")
            robots_resp = requests.get(robots_url, headers=headers, timeout=5, allow_redirects=True)
            if robots_resp.status_code == 200:
                if "Disallow: /" in robots_resp.text and "User-agent: *" in robots_resp.text: # Very naive check
                    logger.warning(f"robots.txt at {robots_url} disallows all scraping. Proceeding with caution.")
                # A real implementation would parse robots.txt properly
        except Exception as e_robots:
            logger.info(f"Could not fetch or parse robots.txt for {url}: {e_robots}")

        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        response.raise_for_status() # Raises an HTTPError if the HTTP request returned an unsuccessful status code
        
        content_type = response.headers.get('content-type', '').lower()
        if 'text/html' not in content_type:
            logger.warning(f"URL {url} does not return HTML content. Content-Type: {content_type}")
            # For non-HTML, maybe return a summary or handle differently later
            if 'application/json' in content_type:
                return f"<html><body><pre>{response.text}</pre></body></html>" # Wrap JSON in pre for parsing
            elif 'text/plain' in content_type:
                 return f"<html><body><pre>{response.text}</pre></body></html>" # Wrap plain text
            return None # Or handle as error
        
        # Basic check for client-side rendering indication (very heuristic)
        soup_check = BeautifulSoup(response.content, 'html.parser')
        body_text_sample = soup_check.body.get_text(strip=True, limit=500) if soup_check.body else ""
        if len(body_text_sample) < 100 and ("javascript" in response.text.lower() or "react" in response.text.lower() or "vue" in response.text.lower() or "angular" in response.text.lower()):
            logger.warning(f"URL {url} might heavily rely on client-side JavaScript for rendering. Scraped content might be incomplete.")

        logger.info(f"Successfully fetched HTML from {url}. Content length: {len(response.text)}")
        return response.text
    
    except requests.exceptions.HTTPError as http_err:
        logger.error(f"HTTP error for {url}: {http_err}")
        return None
    except requests.exceptions.ConnectionError as conn_err:
        logger.error(f"Connection error for {url}: {conn_err}")
        return None
    except requests.exceptions.Timeout as timeout_err:
        logger.error(f"Timeout error for {url}: {timeout_err}")
        return None
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Generic request error for {url}: {req_err}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error while scraping {url}: {type(e).__name__} - {str(e)}")
        return None

