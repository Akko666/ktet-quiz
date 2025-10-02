
document.addEventListener('DOMContentLoaded', () => {
    // --- VIEW ELEMENTS ---
    const mainContent = document.getElementById('main-content');
    const homeView = document.getElementById('home-view');
    const quizView = document.getElementById('quiz-view');
    const loadingView = document.getElementById('loading-view');
    const resultsView = document.getElementById('results-view');

    // --- UI ELEMENTS ---
    const categoryButtons = document.querySelectorAll('.start-category-quiz');
    const questionContainer = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    const feedbackMessage = document.getElementById('feedback-message');
    const nextBtnQuiz = document.getElementById('next-btn-quiz');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const scoreText = document.getElementById('score-text');
    const reloadBtn = document.getElementById('reload-btn');
    const homeLink = document.getElementById('home-link');
    const startQuizNav = document.getElementById('start-quiz-nav');
    const backHomeBtn = document.getElementById('back-home-btn');
    const errorDisplay = document.getElementById('error-display');
    const errorDetails = document.getElementById('error-details');

    // --- QUIZ STATE ---
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let currentCategory = '';
    let isPreset = false; // Flag to track if questions are from the preset JSON

    // --- INITIALIZATION ---
    showView('home');
    setupCarousel();

    // --- EVENT LISTENERS ---
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            selectCategory(category);
        });
    });

    nextBtnQuiz.addEventListener('click', handleNextQuestion);
    reloadBtn.addEventListener('click', () => location.reload());
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView('home');
    });
    startQuizNav.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('categories-section').scrollIntoView({ behavior: 'smooth' });
    });
    backHomeBtn.addEventListener('click', () => showView('home'));

    // --- VIEW MANAGEMENT ---
    function showView(viewName) {
        homeView.classList.add('hidden');
        quizView.classList.add('hidden');
        loadingView.classList.add('hidden');
        resultsView.classList.add('hidden');
        errorDisplay.classList.add('hidden');

        switch (viewName) {
            case 'home':
                homeView.classList.remove('hidden');
                break;
            case 'quiz':
                quizView.classList.remove('hidden');
                break;
            case 'loading':
                loadingView.classList.remove('hidden');
                break;
            case 'results':
                resultsView.classList.remove('hidden');
                break;
            case 'error':
                loadingView.classList.remove('hidden');
                errorDisplay.classList.remove('hidden');
                document.getElementById('loading-spinner').classList.add('hidden');
                break;
        }
    }

    // --- CATEGORY AND QUESTION FETCHING ---
    function selectCategory(category) {
        currentCategory = category;
        score = 0;
        currentQuestionIndex = 0;
        questions = [];
        console.log(`Category selected: ${category}`);
        fetchPresetQuestions(category);
    }

    async function fetchPresetQuestions(category) {
        showView('loading');
        try {
            const response = await fetch('/data/questions.json');
            if (!response.ok) throw new Error('Failed to load question data.');
            const data = await response.json();
            const categoryData = data.categories.find(c => c.name === category);

            if (categoryData && categoryData.questions.length > 0) {
                console.log(`Found ${categoryData.questions.length} preset questions.`);
                isPreset = true;
                questions = categoryData.questions;
                startQuiz();
            } else {
                console.log('No preset questions found. Generating from AI.');
                isPreset = false;
                generateAIQuestions(category);
            }
        } catch (error) {
            console.error('Error fetching preset questions:', error);
            showError('Could not load initial quiz data. Please check your connection and try again.');
        }
    }

    async function generateAIQuestions(topic) {
        showView('loading');
        console.log(`Generating AI questions for topic: ${topic}`);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic, count: 10 }) // Fetch a batch of 10
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || `API Error: ${response.statusText}`);
            }

            const data = await response.json();
            questions = data.questions;
            console.log(`Successfully generated ${questions.length} AI questions.`);
            startQuiz();

        } catch (error) {
            console.error('Error generating AI questions:', error);
            showError(error.message);
        }
    }
    
    function startQuiz() {
        if (!questions || questions.length === 0) {
            showError("No questions were found for this category. Please try another one.");
            return;
        }
        currentQuestionIndex = 0;
        score = 0;
        showView('quiz');
        displayQuestion();
    }

    // --- QUIZ LOGIC ---
    function displayQuestion() {
        if (currentQuestionIndex >= questions.length) {
            console.warn("displayQuestion called with invalid index. This shouldn't happen.");
            return;
        }

        const question = questions[currentQuestionIndex];
        questionContainer.textContent = question.question;
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const li = document.createElement('li');
            li.textContent = option;
            li.classList.add('quiz-option', 'p-4', 'border-2', 'rounded-lg', 'cursor-pointer', 'hover:bg-purple-100', 'transition-colors');
            li.dataset.index = index;
            li.addEventListener('click', handleOptionClick);
            optionsContainer.appendChild(li);
        });

        updateProgress();
        nextBtnQuiz.disabled = true;
        feedbackMessage.classList.add('hidden');
    }

    function handleOptionClick(e) {
        const selectedOption = e.currentTarget;
        const selectedAnswerIndex = parseInt(selectedOption.dataset.index);
        const question = questions[currentQuestionIndex];
        const correctAnswerIndex = question.correctIndex;

        // Disable all options after one is clicked
        Array.from(optionsContainer.children).forEach(child => {
            child.removeEventListener('click', handleOptionClick);
            child.classList.add('cursor-not-allowed');
        });

        // Mark selected option
        selectedOption.classList.add('selected');

        // Check if correct and apply styles
        if (selectedAnswerIndex === correctAnswerIndex) {
            score++;
            selectedOption.classList.add('correct');
            feedbackMessage.textContent = "Correct! " + question.explanation;
            feedbackMessage.className = 'mt-4 text-center font-semibold text-green-700';
        } else {
            selectedOption.classList.add('incorrect');
            optionsContainer.children[correctAnswerIndex].classList.add('correct');
            feedbackMessage.textContent = "Incorrect. " + question.explanation;
            feedbackMessage.className = 'mt-4 text-center font-semibold text-red-700';
        }

        feedbackMessage.classList.remove('hidden');
        nextBtnQuiz.disabled = false;
    }

    function handleNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            // End of the current batch of questions
            if (isPreset) {
                console.log("Finished preset questions. Fetching AI questions now.");
                isPreset = false; // Important: switch mode
                generateAIQuestions(currentCategory); // Fetch a new batch
            } else {
                console.log("Finished AI questions. Showing results.");
                showResults();
            }
        }
    }

    function showResults() {
        showView('results');
        scoreText.textContent = `${score} / ${questions.length}`;
    }

    function updateProgress() {
        progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
        const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }
    
    function showError(message) {
        showView('error');
        errorDetails.textContent = message;
    }

    // --- HOME PAGE CAROUSEL ---
    function setupCarousel() {
        const carouselItems = document.querySelectorAll('.carousel-item');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtnCarousel = document.getElementById('next-btn-carousel');
        let currentSlide = 0;

        function showSlide(index) {
            carouselItems.forEach((item, i) => {
                item.style.opacity = i === index ? '1' : '0';
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % carouselItems.length;
            showSlide(currentSlide);
        }

        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
            showSlide(currentSlide);
        });

        nextBtnCarousel.addEventListener('click', nextSlide);

        setInterval(nextSlide, 5000); // Auto-play every 5 seconds
        showSlide(0);
    }
});
