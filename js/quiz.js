// Get references to HTML elements
const quiz = document.getElementById('quiz');
const answerEls = document.querySelectorAll('.answer');
const questionEl = document.getElementById('question');
const a_text = document.getElementById('a_text');
const b_text = document.getElementById('b_text');
const c_text = document.getElementById('c_text');
const d_text = document.getElementById('d_text');
const submitBtn = document.getElementById('submit');

let quizData = []; // This will hold our questions
let currentQuiz = 0;
let score = 0;

// Function to fetch quiz data from the JSON file
async function fetchQuizData() {
    try {
        const res = await fetch('../data/questions.json');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        quizData = await res.json();
        loadQuiz(); // Load the first quiz question
    } catch (error) {
        console.error("Could not fetch quiz data:", error);
        questionEl.innerHTML = "Failed to load quiz questions. Please try refreshing the page.";
    }
}

// Function to load the current quiz question and answers
function loadQuiz() {
    deselectAnswers();
    const currentQuizData = quizData[currentQuiz];
    questionEl.innerText = currentQuizData.question;
    a_text.innerText = currentQuizData.a;
    b_text.innerText = currentQuizData.b;
    c_text.innerText = currentQuizData.c;
    d_text.innerText = currentQuizData.d;
}

// Function to deselect all radio button answers
function deselectAnswers() {
    answerEls.forEach(answerEl => answerEl.checked = false);
}

// Function to get the selected answer's ID
function getSelected() {
    let answer;
    answerEls.forEach(answerEl => {
        if (answerEl.checked) {
            answer = answerEl.id;
        }
    });
    return answer;
}

// Event listener for the submit button
submitBtn.addEventListener('click', () => {
    const answer = getSelected();
    if (answer) {
        if (answer === quizData[currentQuiz].correct) {
            score++;
        }
        currentQuiz++;
        if (currentQuiz < quizData.length) {
            loadQuiz();
        } else {
            // Display final score
            quiz.innerHTML = `
                <h2>You answered ${score}/${quizData.length} questions correctly</h2>
                <button onclick="location.reload()">Reload Quiz</button>
            `;
        }
    }
});

// Start the process by fetching the quiz data
fetchQuizData();