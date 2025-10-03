# Changelog

### UI Overhaul & Bug Fixes
- **Premium Quiz UI:** Overhauled the quiz interface with a modern, card-based design, improved typography, and a new color scheme.
- **Engaging Animations:** Added animations for question and option display, and a shake animation for incorrect answers to enhance user experience.
- **Malayalam Questions:** Added a new set of preset questions for the "Malayalam" category.
- **Bug Fix (Next Batch):** Corrected an issue where the "Next Batch" feature was not loading a full set of 15 questions.
- **Bug Fix (Next Question):** Fixed a critical bug where the "Next Question" button was unresponsive.

### Scorecard & AI Generation
- Modified quiz flow to show the scorecard after every 15-question batch.
- Added a "Next Batch" button to the scorecard to allow users to continue with more questions from the same category.
- Fixed a bug where the "Next Batch" button was not appearing correctly.
- Implemented more robust error handling for the server-side AI question generation to prevent crashes.
- Corrected an issue where categories without preset questions failed to trigger the AI generation.

### Recent Refinements & Fixes
- **Build Process:** Migrated from Tailwind CDN to a proper `npm run build` process for production-ready CSS.
- **API & Routing:** Overhauled `vercel.json` to fix 404 errors for the API, syllabus pages, and static assets during deployment.
- **Code Organization:** Refactored all JavaScript from `index.html` into a separate `public/js/main.js` file.
- **UI Consistency:** Restyled all syllabus-related pages to match the main application's header, footer, and design.
- **Bug Fix:** Prevented the app from attempting to generate a quiz when a syllabus link is clicked.
- **Development Workflow:** Established `npm start` (`vercel dev`) as the correct local development command.

### Pre-loaded Questions
- **Data:** Added ~95 pre-written questions for the "Child Development & Pedagogy" category into `data/questions.json`.
- **Logic:** Updated `public/main.js` to implement a hybrid question-loading strategy. The app now first attempts to load questions from the local `questions.json`. If no questions are found for the selected category, it falls back to the AI generation API.

### Syllabus Feature
- Consolidated the syllabus display into a single "KTET Syllabus" card on the home page.
- Created a new selection page (`pages/syllabus-selection.html`) for choosing between Category 1 and 2.

### Architecture
- Unified the project into a Single-Page Application (SPA) within `index.html`.
- Removed redundant files (`quiz.html`, old CSS/JS).

### Features
- Connected the frontend to the `/api/generate` endpoint to dynamically fetch AI-generated questions.
- Implemented dynamic view management (Home, Loading, Quiz, Results).

### UI/UX
- Added immediate correct/incorrect answer feedback during the quiz.
- Implemented a progress bar and question counter.

### Deployment
- Configured `vercel.json` to define the project as a static site with serverless functions, fixing deployment.