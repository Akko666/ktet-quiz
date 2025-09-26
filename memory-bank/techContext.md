# Technical Context: KTET Quiz

## 1. Frontend

- **HTML:** The structure of the web pages is built with standard HTML5.
- **CSS:** Styling is handled by separate CSS files for general layout and the quiz interface.
- **JavaScript:** The core quiz logic, including loading questions and handling user interactions, is implemented in JavaScript.

## 2. Data

- **JSON:** Quiz questions and answers are stored in a static JSON file (`data/questions.json`).

## 3. Backend & Deployment

- **Backend:** The backend is implemented as a **Vercel Serverless Function** (`api/generate.js`). This is a Node.js environment.
- **API:** The serverless function acts as a secure API endpoint. It calls the **OpenRouter AI API** to dynamically generate quiz questions. It is configured to use various models like Mistral, Gemma, or Gemini, with API keys managed via Vercel environment variables.
- **Deployment:** The application is designed for deployment on the **Vercel** platform, as confirmed by `vercel.json`.

## 4. Dependencies

- **`package.json`:** This file is present to define project scripts but does not list any production `dependencies`. The backend API function relies on the built-in `fetch` API in the Node.js environment provided by Vercel.
