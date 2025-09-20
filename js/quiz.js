document.addEventListener('DOMContentLoaded', () => {
    const questionEl = document.getElementById('question');
    const answerEls = document.querySelectorAll('.answer');
    const a_text = document.getElementById('a_text');
    const b_text = document.getElementById('b_text');
    const c_text = document.getElementById('c_text');
    const d_text = document.getElementById('d_text');
    const submitBtn = document.getElementById('submit');
    const quiz = document.getElementById('quiz');

    let quizData = [];
    let currentQuiz = 0;
    let score = 0;

    // Fetch questions from the JSON file
    fetch('data/questions.json')
        .then(response => response.json())
        .then(data => {
            // Your new JSON has questions inside a "quiz" array
            quizData = data.quiz;
            if (quizData.length > 0) {
                loadQuiz();
            } else {
                questionEl.innerHTML = "Failed to load questions.";
            }
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            questionEl.innerHTML = "Failed to load questions.";
        });

    function loadQuiz() {
        deselectAnswers();
        const currentQuizData = quizData[currentQuiz];

        questionEl.innerText = currentQuizData.question;
        // The options are now objects, so we need to access the 'text' property
        a_text.innerText = currentQuizData.options[0].text;
        b_text.innerText = currentQuizData.options[1].text;
        c_text.innerText = currentQuizData.options[2].text;
        d_text.innerText = currentQuizData.options[3].text;
    }

    function deselectAnswers() {
        answerEls.forEach(answerEl => answerEl.checked = false);
    }

    function getSelected() {
        let answer;
        answerEls.forEach(answerEl => {
            if (answerEl.checked) {
                // returns 'a', 'b', 'c', or 'd'
                answer = answerEl.id;
            }
        });
        return answer;
    }

    // Finds the correct answer 'key' (A, B, C, D) from the question data
    function getCorrectAnswerKey() {
        const correctOption = quizData[currentQuiz].options.find(option => option.correct);
        return correctOption ? correctOption.key.toLowerCase() : undefined;
    }

    submitBtn.addEventListener('click', () => {
        const answer = getSelected();
        if (answer) {
            const correctAnswerKey = getCorrectAnswerKey();
            if (answer === correctAnswerKey) {
                score++;
            }

            currentQuiz++;

            if (currentQuiz < quizData.length) {
                loadQuiz();
            } else {
                quiz.innerHTML = `
                    <h2>You answered ${score}/${quizData.length} questions correctly</h2>
                    <button onclick="location.reload()">Reload</button>
                `;
            }
        }
    });
});
