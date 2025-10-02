# GEMINI.md - KTET Quiz Project

## Project Overview

This project is a web-based quiz application designed to help users prepare for the Kerala Teacher Eligibility Test (KTET).

**Core Functionality:**
- Users can select a quiz category from the home page.
- For categories with pre-existing questions, the quiz is loaded from a local JSON file (`/data/questions.json`).
- For categories without pre-existing questions, the application dynamically generates a new quiz by calling a server-side API.
- The quiz is presented in batches of 15 questions. After each batch, a scorecard is displayed with animations.
- Users have the option to continue to the next batch of questions or return to the home screen.

**Architecture:**
- **Frontend:** A static single-page application built with HTML, vanilla JavaScript, and styled with Tailwind CSS. The core UI and quiz logic are handled in `public/index.html` and `public/main.js`.
- **Backend:** A Vercel Serverless Function (`api/generate.js`) acts as a Backend-for-Frontend (BFF). It securely communicates with the OpenRouter AI API to generate quiz questions on-demand, using an API key stored as a Vercel environment variable.
- **Deployment:** The project is configured for deployment on Vercel, as specified in `vercel.json`.

## Building and Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
This command starts a local development server using `vercel dev`, which will also run the serverless function locally.
```bash
npm start
```
The application will be available at the URL provided in the console (usually `http://localhost:3000`).

### 3. Build for Production
This command uses Tailwind CSS to compile and minify the project's stylesheet.
```bash
npm run build
```

### 4. Deploy to Vercel
This command builds the project and deploys it to Vercel for production.
```bash
npm run deploy
```

## Development Conventions

- **Modular JavaScript:** The frontend logic is organized in `public/main.js` with clear separation of concerns for UI elements, state management, and application logic.
- **API Route:** The backend logic is contained within the `/api` directory, following Vercel's file-based routing for serverless functions.
- **Styling:** The project uses Tailwind CSS for styling. The main stylesheet is compiled from `public/input.css`.
- **Data Management:** Quiz questions can be managed in two ways:
    1.  **Preset:** By adding them to the `/data/questions.json` file under the appropriate category.
    2.  **AI-Generated:** By creating a new category card in `public/index.html`. The backend will automatically handle the AI generation for any category that doesn't have preset questions.
- **Error Handling:** The application includes error handling for both client-side and server-side operations, displaying user-friendly messages when issues occur.
