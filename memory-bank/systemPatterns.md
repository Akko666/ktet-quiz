# System Patterns: KTET Quiz

## 1. Architecture

The application uses a client-server architecture with a static frontend and a serverless backend.

- **Static Frontend:** The HTML, CSS, and JavaScript files are served as static assets. The core quiz logic runs client-side.
- **Dual-Mode Data Fetching:** The application can fetch quiz questions in two ways:
    1.  **Static:** From a local JSON file (`data/questions.json`).
    2.  **Dynamic:** By calling a serverless backend API (`/api/generate`).
- **Serverless Backend (Backend-for-Frontend):** The Vercel Serverless Function (`api/generate.js`) acts as a secure proxy. It receives requests from the frontend, securely adds an API key (which is hidden from the client), calls the external OpenRouter AI service to generate questions, and then relays the response back to the client. This pattern prevents the exposure of sensitive API keys on the frontend.

## 2. Design Patterns

- **Single Page Application (SPA) feel:** While not a full-fledged SPA, the quiz portion of the application likely operates on a single page (`quiz.html`), dynamically updating the content with JavaScript.
- **Separation of Concerns:** The project demonstrates a clear separation of concerns:
    - **HTML:** Structure
    - **CSS:** Presentation
    - **JavaScript:** Behavior
    - **JSON:** Data
