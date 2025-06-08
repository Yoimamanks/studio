from bs4 import BeautifulSoup, NavigableString, Tag
import re
import logging

logger = logging.getLogger(__name__)

def get_text_from_element(element, max_length=5000):
    """Extracts text from an element, trying to maintain some structure, up to max_length."""
    texts = []
    current_length = 0
    for child in element.children:
        if isinstance(child, NavigableString):
            text = child.strip()
            if text:
                if current_length + len(text) > max_length:
                    texts.append(text[:max_length - current_length] + "...")
                    break
                texts.append(text)
                current_length += len(text)
        elif isinstance(child, Tag):
            # Recursively get text, but ensure it's not too deep or repetitive
            if child.name not in ['script', 'style', 'meta', 'link', 'noscript', 'iframe']:
                sub_text = get_text_from_element(child, max_length=max_length - current_length)
                if sub_text:
                    if current_length + len(sub_text) > max_length:
                         # This part might be tricky, as sub_text itself could be truncated
                        texts.append(sub_text[:max_length - current_length] + "...")
                        break
                    texts.append(sub_text)
                    current_length += len(sub_text)
        if current_length >= max_length:
            break
    return "\n".join(texts).strip()


def parse_content(html_content: str, max_content_length: int = 50000) -> Dict[str, Any]:
    """Parse HTML content into structured data, limiting total content size."""
    if not html_content:
        return {
            'titles': [], 'paragraphs': [], 'links': [], 'tables': [], 'error': 'No HTML content provided'
        }
        
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove unwanted tags
    for element_type in ['script', 'style', 'nav', 'footer', 'aside', 'iframe', 'noscript', 'header', 'form', 'button', 'input', 'textarea', 'select']:
        for element in soup.find_all(element_type):
            element.decompose()

    # Remove elements that are likely ads or irrelevant
    for selector in [".ad", "#ad", "[class*='advert']", "[id*='advert']", "[class*='banner']", "[id*='banner']", 
                     "[class*='cookie']", "[id*='cookie']", "[class*='popup']", "[id*='popup']", 
                     "[class*='social']", "[id*='social']", "[class*='share']", "[id*='share']",
                     "[aria-hidden='true']"]:
        try:
            for element in soup.select(selector):
                element.decompose()
        except Exception as e:
            logger.warning(f"Error during selector-based decomposition ({selector}): {e}")


    current_total_length = 0
    
    titles = []
    try:
        for tag in soup.find_all(re.compile('^h[1-4]$')): # Focus on H1-H4
            text = tag.get_text(separator=' ', strip=True)
            if text and (current_total_length + len(text) < max_content_length):
                titles.append(text)
                current_total_length += len(text)
            elif text:
                titles.append(text[:max_content_length - current_total_length] + "...")
                current_total_length = max_content_length
                break
    except Exception as e:
        logger.error(f"Error parsing titles: {e}")

    paragraphs = []
    try:
        # Try to get meaningful content blocks. This can be very complex.
        # A simple approach: look for main content containers if identifiable.
        main_content_selectors = ['main', 'article', '[role="main"]', '.content', '#content', '.post-body', '.entry-content']
        content_area = None
        for selector in main_content_selectors:
            content_area = soup.select_one(selector)
            if content_area:
                break
        
        target_soup = content_area if content_area else soup

        for p in target_soup.find_all(['p', 'div']): # Also consider divs which might contain text
            # Heuristic: skip divs with too many children or specific classes indicating non-content
            if p.name == 'div':
                if len(p.find_all(True)) > 10 or p.get('class') and any(cls in ['menu', 'sidebar', 'related'] for cls in p.get('class', [])):
                    continue
            
            text = p.get_text(separator=' ', strip=True)
            # Filter out very short or navigation-like texts
            if text and len(text) > 50 and (current_total_length + len(text) < max_content_length):
                paragraphs.append(text)
                current_total_length += len(text)
            elif text and len(text) > 50:
                paragraphs.append(text[:max_content_length - current_total_length] + "...")
                current_total_length = max_content_length
                break
            if current_total_length >= max_content_length:
                break
    except Exception as e:
        logger.error(f"Error parsing paragraphs: {e}")

    # If no good paragraphs found, do a simpler pass
    if not paragraphs and current_total_length < max_content_length:
        try:
            all_text = soup.get_text(separator='\n', strip=True)
            potential_paragraphs = [line for line in all_text.split('\n') if len(line) > 100] # Heuristic for paragraph
            for text in potential_paragraphs:
                if current_total_length + len(text) < max_content_length:
                    paragraphs.append(text)
                    current_total_length += len(text)
                else:
                    paragraphs.append(text[:max_content_length - current_total_length] + "...")
                    current_total_length = max_content_length
                    break
                if current_total_length >= max_content_length:
                    break
        except Exception as e:
            logger.error(f"Error during fallback paragraph parsing: {e}")


    links = []
    # Links are less critical for context size, so keep them minimal or skip if space is tight
    # This part is omitted to save context space for primary content (titles, paragraphs)

    tables = []
    # Tables can be very large, parse them minimally or omit if space is critical
    # This part is omitted to save context space

    if not titles and not paragraphs:
        logger.warning("Could not extract significant titles or paragraphs.")
        # Fallback to just a snippet of body text if everything else fails
        body_text = soup.body.get_text(separator=' ', strip=True) if soup.body else ""
        if body_text and (current_total_length + len(body_text) < max_content_length):
            paragraphs.append(body_text[:max_content_length - current_total_length])
        elif body_text:
             paragraphs.append(body_text[:max_content_length - current_total_length]  + "..." if current_total_length < max_content_length else "")


    return {
        'titles': titles[:5], # Limit number of titles
        'paragraphs': paragraphs[:10], # Limit number of paragraphs
        'links': [], # Omitting for brevity
        'tables': []  # Omitting for brevity
    }

from typing import Dict, Any # Added for type hinting at the top
