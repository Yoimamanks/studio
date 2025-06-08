from flask import Flask, request, jsonify
import logging
from scrape import scrape_website
from parse import parse_content
from api import query_ai_models
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL not provided"}), 400

    html_content = scrape_website(url)

    if not html_content:
        return jsonify({"error": "Failed to scrape website"}), 500

    parsed_data = parse_content(html_content)

    return jsonify(parsed_data)

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    question = data.get('question')
    content = data.get('content') # This should be the parsed data
    model = data.get('model', 'gemini')  # Default model is gemini

    if not question:
        return jsonify({"error": "Question not provided"}), 400
    if not content:
        return jsonify({"error": "Content not provided"}), 400

    # Assuming 'content' is the parsed data dictionary as returned by parse_content
    # query_ai_models expects the parsed data and the model name
    answer = query_ai_models(question, content, model)

    return jsonify({"answer": answer})

if __name__ == '__main__':
    app.run(debug=True)