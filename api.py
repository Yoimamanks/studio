import requests
import json
import os
from typing import Dict, Any
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    # This will be an issue if the key isn't set when Flask starts.
    # For robustness, one might check this before each call or handle it gracefully.
    logger.warning("OPENROUTER_API_KEY environment variable not set. API calls will likely fail.")

MODEL_CONFIG = {
    'gemini': {
        'model': 'google/gemini-pro-1.5', # Using a generally available model
        'name': 'Gemini',
        'color': 'blue'
    },
    'deepseek': {
        'model': 'deepseek/deepseek-chat', # Using a generally available model
        'name': 'DeepSeek',
        'color': 'indigo'
    },
    'ollama': { # Mapping 'ollama' from frontend
        'model': 'meta-llama/llama-3-8b-instruct:free', # Using a Llama model for Ollama selection
        'name': 'Ollama (Llama 3 8B via OpenRouter)',
        'color': 'purple'
    }
}

def query_openrouter(prompt: str, context_data: Dict[str, Any], model_key: str) -> str:
    """Query OpenRouter API with the given prompt and context for a specific model_key."""
    if not OPENROUTER_API_KEY:
        return "Error: OPENROUTER_API_KEY is not configured in the backend."

    try:
        model_key = model_key.lower() # Ensure consistency
        if model_key not in MODEL_CONFIG:
            logger.error(f"Unknown model key: {model_key}")
            return f"Error: Unknown model '{model_key}' selected."
        
        formatted_web_content = format_context(context_data)
        
        full_prompt = (
            "Answer the following question based on the provided webpage content. "
            "If the question cannot be answered using ONLY the provided webpage content, "
            "state that the information is not found in the provided context.\n\n"
            f"Webpage content:\n{formatted_web_content}\n\n"
            f"Question: {prompt}"
        )
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("SITE_URL", "http://localhost:9002"), # Placeholder for site URL
            "X-Title": os.getenv("APP_NAME", "ZScraper") # Placeholder for app name
        }
        
        payload = {
            "model": MODEL_CONFIG[model_key]['model'],
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI assistant. Your task is to answer questions based *solely* on the provided webpage content. Do not use any external knowledge. If the answer is not found in the content, explicitly say so."
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            "temperature": 0.5,
            "max_tokens": 1500 # Increased slightly for potentially longer answers
        }
        
        logger.info(f"Querying {MODEL_CONFIG[model_key]['name']} (model: {MODEL_CONFIG[model_key]['model']}) with prompt: {prompt[:100]}...")
        
        api_url = "https://openrouter.ai/api/v1/chat/completions"
        response = requests.post(
            url=api_url,
            headers=headers,
            data=json.dumps(payload),
            timeout=60 # Increased timeout for potentially longer processing
        )
        response.raise_for_status() # Will raise HTTPError for bad responses (4xx or 5xx)
        
        data = response.json()
        
        if data.get('choices') and len(data['choices']) > 0 and data['choices'][0].get('message'):
            return data['choices'][0]['message']['content']
        else:
            logger.error(f"Unexpected response structure from OpenRouter for model {model_key}: {data}")
            return "Error: Received an unexpected response from the AI model."
            
    except requests.exceptions.HTTPError as http_err:
        logger.error(f"HTTP error occurred for {model_key}: {http_err} - Response: {http_err.response.text}")
        return f"API Error: Failed to communicate with the AI model ({http_err.response.status_code}). Please try again."
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed for {model_key}: {str(e)}")
        return f"API Error: Could not connect to the AI model provider. {str(e)}"
    except Exception as e:
        logger.error(f"Error processing {model_key} response: {type(e).__name__} - {str(e)}")
        return f"Processing Error: An unexpected error occurred while handling the AI response. {str(e)}"

def format_context(context: Dict[str, Any]) -> str:
    """Format the scraped content into a readable string for AI context"""
    formatted_parts = []
    
    if context.get('titles'):
        formatted_parts.append("Titles found on the page:\n" + "\n".join(f"- {title}" for title in context['titles']))
    
    if context.get('paragraphs'):
        formatted_parts.append("Main textual content:\n" + "\n\n".join(context['paragraphs']))
    
    if context.get('links'):
        # Limit the number of links to avoid excessive context
        limited_links = context['links'][:10]
        formatted_parts.append("Some links found on the page (text: URL):\n" + "\n".join(
            f"- {link.get('text', 'N/A')}: {link.get('url', 'N/A')}" for link in limited_links
        ))
    
    if context.get('tables'):
        formatted_parts.append("Tables found on the page:")
        for i, table in enumerate(context['tables'][:3], 1): # Limit number of tables
            table_str = [f"Table {i}:"]
            if table.get('headers'):
                table_str.append("Headers: " + " | ".join(table['headers']))
            if table.get('rows'):
                # Limit rows per table
                for row_idx, row_data in enumerate(table['rows'][:5]):
                    table_str.append(f"Row {row_idx+1}: " + " | ".join(row_data))
            formatted_parts.append("\n".join(table_str))
            
    if not formatted_parts:
        return "No structured content was extracted from the webpage."
        
    return "\n\n---\n\n".join(formatted_parts)

