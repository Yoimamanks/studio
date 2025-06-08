# **App Name**: ZScraper

## Core Features:

- Dark-Themed Dashboard: Display a dark-themed dashboard with a 'Try Now' button leading to the login page. Also show a GIF to explain the app's functionality.
- Navigation Bar: Provide a navbar with options for 'History', 'New Chat', and 'Logout'.
- Web Scraping and AI Query: Enable users to input a URL, scrape the content, and ask questions to AI models based on the data obtained from the webpage.
- LLM Selection: Allow users to choose from multiple LLMs (Ollama, Deepseek, Gemini) via a dropdown menu.
- Web Scraping: Scrape content from a URL submitted by the user.
- AI Question Answering: Accept a user's question, along with the scraped data from the specified URL, and then send it to the specified LLM using the OpenRouter API for processing and respond to the user's question with the response from the selected LLM. The AI tool chooses whether to include information from the context (the scraped webpage data) in its output.
- Firebase Authentication: Use Firebase Authentication for user registration and login.

## Style Guidelines:

- Background color: Dark gray (#1e1e2f) to establish a modern and immersive dark theme.
- Primary color: Electric purple (#BE64FF) to provide a striking and eye-catching accent on the dark background. The high saturation gives the app a bold presence.
- Accent color: Violet (#6471FF). Using a hue shifted ~30 degrees 'left' toward blue, and with lower brightness and saturation, will ensure that it contrasts well with the primary purple.
- Background color for panels and containers: Dark gray (#2e2e3e) for visual hierarchy.
- Headline font: 'Space Grotesk', sans-serif, for headlines, and 'Inter', sans-serif, for body text.
- Use minimalist icons with a neon glow effect.
- Fixed navigation bar on the left for easy access to core features.
- Subtle transitions and animations when scraping data and displaying AI responses.