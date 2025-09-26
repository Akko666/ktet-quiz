# Changelog

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