
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
    const scoreRing = document.getElementById('score-ring');
    const scorePercentage = document.getElementById('score-percentage');
    const scoreDetails = document.getElementById('score-details');
    const reloadBtn = document.getElementById('reload-btn');
    const nextBatchBtn = document.getElementById('next-batch-btn');
    const homeLink = document.getElementById('home-link');
    const startQuizNav = document.getElementById('start-quiz-nav');
    const backHomeBtn = document.getElementById('back-home-btn');
    const errorDisplay = document.getElementById('error-display');
    const errorDetails = document.getElementById('error-details');

    // --- QUIZ STATE ---
    let allPresetQuestions = [];
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let currentCategory = '';
    let isPreset = true;
    let presetQuestionOffset = 0;
    const QUESTION_BATCH_SIZE = 15;

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

    nextBatchBtn.addEventListener('click', () => {
        score = 0;
        currentQuestionIndex = 0;
        loadNextPresetBatch();
    });

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

        // Reset score card animation and hide next batch button
        if (viewName !== 'results') {
            reloadBtn.classList.remove('opacity-100');
            reloadBtn.classList.add('opacity-0');
            nextBatchBtn.style.display = 'none';
            if (scoreRing) {
                const radius = scoreRing.r.baseVal.value;
                const circumference = 2 * Math.PI * radius;
                scoreRing.style.strokeDasharray = circumference;
                scoreRing.style.strokeDashoffset = circumference;
            }
            if(scorePercentage) scorePercentage.textContent = "0%";
        }

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
        allPresetQuestions = [];
        presetQuestionOffset = 0;
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
                allPresetQuestions = categoryData.questions;
                presetQuestionOffset = 0;
                loadNextPresetBatch();
            } else {
                console.log(`No preset questions for "${category}". Falling back to AI.`);
                isPreset = false;
                generateAIQuestions(category);
            }
        } catch (error) {
            console.error('Error fetching preset questions:', error);
            showError('Could not load initial quiz data. Please check your connection and try again.');
        }
    }

    function loadNextPresetBatch() {
        const nextBatch = allPresetQuestions.slice(presetQuestionOffset, presetQuestionOffset + QUESTION_BATCH_SIZE);
        presetQuestionOffset += QUESTION_BATCH_SIZE;

        if (nextBatch.length > 0) {
            questions = nextBatch;
            startQuiz();
        } else {
            console.log("Finished all preset questions. Showing results.");
            showScoreCard();
        }
    }

    async function generateAIQuestions(topic) {
        showView('loading');
        console.log(`Generating AI questions for topic: ${topic}`);
        const aiQuestions = await fetchAIQuestions(topic);
        questions = aiQuestions;
        console.log(`Successfully generated ${questions.length} AI questions.`);
        startQuiz();
    }

    async function fetchAIQuestions(topic) {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic, count: 15 })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw errorData;
            }

            const data = await response.json();
            return data.questions || [];
        } catch (error) {
            console.error('Error generating AI questions:', error);
            showError(error);
            return [];
        }
    }
    
    function startQuiz() {
        if (!questions || questions.length === 0) {
            showError("No questions were found for this category. Please try another one.");
            return;
        }
        currentQuestionIndex = 0;
        score = 0; // Reset score for each new batch
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

        Array.from(optionsContainer.children).forEach(child => {
            child.removeEventListener('click', handleOptionClick);
            child.classList.add('cursor-not-allowed');
        });

        selectedOption.classList.add('selected');

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
            showScoreCard();
        }
    }



    function showScoreCard() {
        showView('results');
        triggerScorecardAnimation();
        const totalQuestions = questions.length;
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

        // Animate percentage text
        let currentPercentage = 0;
        const interval = setInterval(() => {
            if (currentPercentage >= percentage) {
                clearInterval(interval);
                 if(currentPercentage === 0) scorePercentage.textContent = "0%";
            } else {
                currentPercentage++;
                scorePercentage.textContent = `${currentPercentage}%`;
            }
        }, 15);

        // Animate circle
        const radius = scoreRing.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        scoreRing.style.strokeDasharray = circumference;
        scoreRing.style.strokeDashoffset = circumference; // Start with full circle
        // Trigger reflow to apply start styles before transition
        void scoreRing.offsetWidth;
        scoreRing.style.strokeDashoffset = offset;

        scoreDetails.textContent = `You scored ${score} out of ${totalQuestions}`;

        // Show/hide next batch button
        console.log('Checking for next batch:', {
            isPreset,
            presetQuestionOffset,
            totalPresetQuestions: allPresetQuestions.length
        });
        if (isPreset && presetQuestionOffset < allPresetQuestions.length) {
            console.log('Showing next batch button.');
            nextBatchBtn.style.display = 'block';
        } else {
            console.log('Hiding next batch button.');
            nextBatchBtn.style.display = 'none';
        }

        // Fade in button after animation
        setTimeout(() => {
            reloadBtn.classList.remove('opacity-0');
            reloadBtn.classList.add('opacity-100');
        }, 1500);
    }

    function triggerScorecardAnimation() {
        const emojis = ['🎉', '🎊', '🥳', '🎈', '⭐', '🏆', '💯'];
        const resultsView = document.getElementById('results-view');

        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const emoji = document.createElement('span');
                emoji.classList.add('flying-emoji');
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.left = `${Math.random() * 100}vw`;
                emoji.style.animationDuration = `${Math.random() * 2 + 3}s`; // 3-5 seconds
                resultsView.appendChild(emoji);

                // Remove the emoji after the animation is done
                setTimeout(() => {
                    emoji.remove();
                }, 5000);
            }, Math.random() * 2000); // Stagger the emojis
        }
    }

    function updateProgress() {
        const totalInBatch = questions.length;
        const currentInBatch = currentQuestionIndex + 1;
        progressText.textContent = `Question ${currentInBatch} of ${totalInBatch}`;

        let overallPercentage = (currentInBatch / totalInBatch) * 100;
        if (isPreset) {
            const questionsAnswered = presetQuestionOffset - QUESTION_BATCH_SIZE + currentInBatch;
            overallPercentage = (questionsAnswered / allPresetQuestions.length) * 100;
        }
        progressBar.style.width = `${overallPercentage}%`;
    }
    
    function showError(error) {
        showView('error');
        let message = 'An unexpected error occurred. Please try again later.';

        if (typeof error === 'string') {
            message = error;
        } else if (error && error.error) {
            message = error.error;
            if (error.details) {
                if (error.error === 'API Key Not Configured') {
                    message = 'The AI quiz feature is not configured. The OPENROUTER_API_KEY is missing. Please set it in your Vercel project settings.';
                } else if (error.error === 'Gateway Timeout') {
                    message = 'The AI is taking too long to respond. This might be due to high traffic. Please try again later.';
                } else {
                    message += `\n\nDetails: ${error.details}`;
                }
            }
        } else if (error && error.message) {
            message = error.message;
        }

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
