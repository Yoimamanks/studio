from flask import Flask, request, jsonify
import logging
import os
from dotenv import load_dotenv
from flask_cors import CORS # Import CORS

# Import your custom modules
from scrape import scrape_website
from parse import parse_content
from api import query_openrouter

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.route('/')
def index():
    return jsonify({"message": "ZScraper Flask AI Backend is running!"})

@app.route('/ask', methods=['POST'])
def ask_route():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    url = data.get('url')
    question = data.get('question')
    model_key = data.get('model') # e.g., 'gemini', 'ollama', 'deepseek'

    if not url:
        return jsonify({"error": "URL not provided"}), 400
    if not question:
        return jsonify({"error": "Question not provided"}), 400
    if not model_key:
        return jsonify({"error": "Model not selected"}), 400

    logger.info(f"Received /ask request: URL='{url}', Question='{question[:50]}...', Model='{model_key}'")

    try:
        # Step 1: Scrape website
        logger.info(f"Attempting to scrape URL: {url}")
        html_content = scrape_website(url)
        if html_content is None:
            logger.error(f"Failed to scrape website: {url}")
            return jsonify({"error": "Failed to scrape the website. The URL might be inaccessible or block scraping."}), 500
        logger.info(f"Successfully scraped URL. Content length: {len(html_content)}")

        # Step 2: Parse content
        logger.info("Parsing scraped HTML content...")
        parsed_data = parse_content(html_content)
        if not parsed_data or (not parsed_data.get('paragraphs') and not parsed_data.get('titles')):
             logger.warning(f"Parsing resulted in little to no content for URL: {url}")
        # We proceed even if content is sparse, AI can state that.
        logger.info("Successfully parsed HTML content.")


        # Step 3: Query AI model via OpenRouter
        logger.info(f"Querying AI model '{model_key}' via OpenRouter...")
        # Ensure model_key is lowercase as expected by api.py's MODEL_CONFIG
        ai_answer = query_openrouter(question, parsed_data, model_key.lower())
        logger.info(f"Received answer from AI model '{model_key}'.")

        return jsonify({"answer": ai_answer})

    except Exception as e:
        logger.error(f"An unexpected error occurred in /ask route: {str(e)}", exc_info=True)
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    # Set host to '0.0.0.0' to be accessible externally if needed, e.g., in Docker
    app.run(debug=os.environ.get("FLASK_DEBUG", "True").lower() == "true", host='0.0.0.0', port=port)
