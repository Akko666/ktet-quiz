const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const quizContainer = document.getElementById('quiz-container');
const resultsContainer = document.getElementById('results-container');
const scoreElement = document.getElementById('score');
const totalQuestionsElement = document.getElementById('total-questions');

let currentQuestionIndex = 0;
let score = 0;
let questions = [];

async function startQuiz() {
    try {
        const response = await fetch('data/questions.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        questions = await response.json();
        totalQuestionsElement.textContent = questions.length;
        showQuestion();
    } catch (error) {
        questionElement.textContent = 'Failed to load questions. Please try again later.';
        console.error('There was a problem with the fetch operation:', error);
    }
}

function showQuestion() {
    resetState();
    const question = questions[currentQuestionIndex];
    questionElement.textContent = question.question;

    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-btn');
        button.dataset.index = index;
        button.addEventListener('click', selectAnswer);
        optionsContainer.appendChild(button);
    });
}

function resetState() {
    while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
    }
    nextBtn.classList.add('hidden');
}

function selectAnswer(e) {
    const selectedButton = e.target;
    const selectedIndex = parseInt(selectedButton.dataset.index);
    const correctIndex = questions[currentQuestionIndex].answerIndex;

    if (selectedIndex === correctIndex) {
        selectedButton.classList.add('correct');
        score++;
    } else {
        selectedButton.classList.add('incorrect');
    }

    Array.from(optionsContainer.children).forEach(button => {
        if (parseInt(button.dataset.index) === correctIndex) {
            button.classList.add('correct');
        }
        button.disabled = true;
    });

    nextBtn.classList.remove('hidden');
}

function showResults() {
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    scoreElement.textContent = score;
}

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
});

startQuiz();