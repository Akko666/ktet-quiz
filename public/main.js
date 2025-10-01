document.addEventListener('DOMContentLoaded', () => {
    // --- VIEW ELEMENTS ---
    const homeView = document.getElementById('home-view');
    const quizView = document.getElementById('quiz-view');
    const loadingView = document.getElementById('loading-view');
    const resultsView = document.getElementById('results-view');

    // --- BUTTON & INTERACTIVE ELEMENTS ---
    const startQuizNavBtn = document.getElementById('start-quiz-nav');
    const categoryStartBtns = document.querySelectorAll('button.start-category-quiz');
    const nextBtnQuiz = document.getElementById('next-btn-quiz');
    const reloadBtn = document.getElementById('reload-btn');
    const homeLink = document.getElementById('home-link');
    const errorDisplay = document.getElementById('error-display');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorDetails = document.getElementById('error-details');
    const backHomeBtn = document.getElementById('back-home-btn');

    // --- QUIZ CONTENT ELEMENTS ---
    const questionEl = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const feedbackMessage = document.getElementById('feedback-message');
    const scoreText = document.getElementById('score-text');
    
    // --- STATE ---
    let quizData = [];
    let currentQuiz = 0;
    let score = 0;
    let carouselInterval = null;

    // --- DATA FETCHING ---
    async function getLocalQuestions() {
        try {
            const response = await fetch('/data/questions.json');
            if (!response.ok) {
                console.warn('Could not fetch local questions.json:', response.status);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Error reading local questions.json:', error);
            return null;
        }
    }

    async function fetchAIQuestions(category) {
        showView('loading');
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: "KTET Exam", topic: category, count: 10 })
            });

            const data = await response.json();
            if (!response.ok) {
                const errorMsg = data.error || `Request failed with status ${response.status}`;
                const errorDetailsText = data.details ? `Details: ${data.details}` : 'No additional details provided.';
                throw new Error(`${errorMsg}. ${errorDetailsText}`);
            }
            return data.questions;
        } catch (error) {
            console.error('Error fetching AI questions:', error);
            const isJsonError = error instanceof SyntaxError;
            const displayMessage = isJsonError ? "The server returned an unexpected response. This can happen if the API endpoint is not found (404)." : error.message;
            showError(displayMessage);
            return [];
        }
    }

    // --- QUIZ LOGIC ---
    async function startQuiz(category, clickedButton) {
        if (!category) {
            console.error("startQuiz called without a category.");
            showError("Cannot start quiz: no category selected.");
            return;
        }
        
        if (category === 'KTET Syllabus') {
            console.warn('Attempted to start a quiz for the syllabus. This is not a quiz category.');
            return; 
        }

        // --- UI Loading State ---
        const originalButtonContent = clickedButton.innerHTML;
        document.querySelectorAll('.start-category-quiz, #syllabus-link').forEach(el => {
            el.disabled = true;
            el.classList.add('cursor-not-allowed', 'opacity-75');
        });
        
        clickedButton.innerHTML = `
            <svg class="animate-spin h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating...</span>
        `;

        let questions = [];
        const localQuestionsData = await getLocalQuestions();

        if (localQuestionsData && localQuestionsData.categories[category] && localQuestionsData.categories[category].length > 0) {
            questions = localQuestionsData.categories[category];
        } else {
            questions = await fetchAIQuestions(category);
        }

        // --- Restore UI State ---
        document.querySelectorAll('.start-category-quiz, #syllabus-link').forEach(el => {
            el.disabled = false;
            el.classList.remove('cursor-not-allowed', 'opacity-75');
        });
        clickedButton.innerHTML = originalButtonContent;

        if (questions && questions.length > 0) {
            quizData = questions;
            currentQuiz = 0;
            score = 0;
            showView('quiz');
            loadQuiz();
        }
    }
    
    function loadQuiz() {
        if (currentQuiz >= quizData.length) {
            showResults();
            return;
        }
        const currentQuizData = quizData[currentQuiz];
        feedbackMessage.classList.add('hidden');
        questionEl.innerText = currentQuizData.question;
        optionsContainer.innerHTML = '';
        
        currentQuizData.options.forEach((optionText, index) => {
            const optionEl = document.createElement('div');
            optionEl.classList.add('quiz-option', 'p-4', 'border-2', 'rounded-lg', 'cursor-pointer', 'hover:bg-purple-50', 'transition-colors');
            optionEl.dataset.index = index;
            optionEl.innerHTML = `<span class="font-semibold mr-2">${String.fromCharCode(65 + index)}.</span> ${optionText}`;
            optionEl.addEventListener('click', () => selectAnswer(optionEl, currentQuizData));
            optionsContainer.appendChild(optionEl);
        });

        updateProgress();
        nextBtnQuiz.disabled = true;
    }

    function selectAnswer(selectedOptionEl, quizData) {
        if (optionsContainer.querySelector('.correct, .incorrect')) return;

        const selectedIndex = parseInt(selectedOptionEl.dataset.index, 10);
        const correctIndex = quizData.correctIndex;

        if (selectedIndex === correctIndex) {
            score++;
            selectedOptionEl.classList.add('correct');
            feedbackMessage.innerText = "Correct!";
            feedbackMessage.classList.add('text-green-600');
            feedbackMessage.classList.remove('text-red-600');
        } else {
            selectedOptionEl.classList.add('incorrect');
            const explanation = quizData.explanation || "Sorry, that's not correct.";
            feedbackMessage.innerText = explanation;
            feedbackMessage.classList.add('text-red-600');
            feedbackMessage.classList.remove('text-green-600');
            
            const correctOptionEl = optionsContainer.querySelector(`[data-index='${correctIndex}']`);
            if (correctOptionEl) correctOptionEl.classList.add('correct');
        }

        feedbackMessage.classList.remove('hidden');
        nextBtnQuiz.disabled = false;
    }

    function showResults() {
        showView('results');
        scoreText.innerText = `${score} / ${quizData.length}`;
    }
    
    function handleNextQuestion() {
        currentQuiz++;
        loadQuiz();
    }

    function updateProgress() {
        progressText.innerText = `Question ${currentQuiz + 1} of ${quizData.length}`;
        const progressPercentage = ((currentQuiz + 1) / quizData.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }

    // --- VIEW & STATE MANAGEMENT ---
    function showError(message) {
        showView('loading');
        loadingSpinner.classList.add('hidden');
        errorDisplay.classList.remove('hidden');
        errorDetails.textContent = message;
    }

    function showView(view) {
        if (carouselInterval) {
            clearInterval(carouselInterval);
            carouselInterval = null;
        }

        homeView.classList.add('hidden');
        quizView.classList.add('hidden');
        loadingView.classList.add('hidden');
        resultsView.classList.add('hidden');

        loadingSpinner.classList.remove('hidden');
        errorDisplay.classList.add('hidden');

        if (view === 'home') {
            homeView.classList.remove('hidden');
            startCarousel();
        } else if (view === 'quiz') {
            quizView.classList.remove('hidden');
        } else if (view === 'loading') {
            loadingView.classList.remove('hidden');
        } else if (view === 'results') {
            resultsView.classList.remove('hidden');
        }
    }

    // --- EVENT LISTENERS ---
    startQuizNavBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        const categoriesSection = document.getElementById('categories-section');
        categoriesSection.scrollIntoView({ behavior: 'smooth' });
    });

    const categoriesContainer = document.getElementById('categories-section');
    categoriesContainer.addEventListener('click', (e) => {
        if (e.target.closest('#syllabus-link')) {
            return;
        }

        const clickedButton = e.target.closest('button.start-category-quiz');

        if (!clickedButton) {
            return;
        }
        
        e.preventDefault();
        const category = clickedButton.dataset.category;
        startQuiz(category, clickedButton);
    });

    nextBtnQuiz.addEventListener('click', handleNextQuestion);
    reloadBtn.addEventListener('click', () => showView('home'));
    homeLink.addEventListener('click', (e) => { e.preventDefault(); showView('home'); });
    backHomeBtn.addEventListener('click', () => showView('home'));

    // --- CAROUSEL LOGIC ---
    const carouselItems = document.querySelectorAll('.carousel-item');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtnCarousel = document.getElementById('next-btn-carousel');
    let currentCarouselIndex = 0;

    function showCarouselItem(index) {
        carouselItems.forEach((item, i) => {
            item.style.opacity = i === index ? '1' : '0';
        });
    }

    function nextCarouselItem() {
        currentCarouselIndex = (currentCarouselIndex + 1) % carouselItems.length;
        showCarouselItem(currentCarouselIndex);
    }

    function startCarousel() {
        if (carouselInterval) clearInterval(carouselInterval);
        showCarouselItem(currentCarouselIndex);
        carouselInterval = setInterval(nextCarouselItem, 5000);
    }

    prevBtn.addEventListener('click', () => {
        currentCarouselIndex = (currentCarouselIndex - 1 + carouselItems.length) % carouselItems.length;
        startCarousel();
    });

    nextBtnCarousel.addEventListener('click', () => {
        nextCarouselItem();
        startCarousel();
    });

    // Initial start
    startCarousel();
});