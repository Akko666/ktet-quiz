document.addEventListener('DOMContentLoaded', () => {
    const questionTitleElement = document.querySelector('.question-title');
    const answerOptionsElement = document.querySelector('.answer-options');
    const submitBtn = document.querySelector('.submit-btn');
    const questionListElements = document.querySelectorAll('.question-list li');

    let currentQuestionIndex = 0;
    let questions = [];
    let score = 0;

    // Fetch questions from the JSON file
    fetch('data/questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            if (questions.length > 0) {
                displayQuestion(currentQuestionIndex);
                updateQuestionList();
            }
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            questionTitleElement.textContent = "Failed to load questions.";
        });

    function displayQuestion(index) {
        const question = questions[index];
        questionTitleElement.textContent = question.question;
        answerOptionsElement.innerHTML = ''; // Clear previous options

        const optionLetters = ['A', 'B', 'C', 'D'];
        question.options.forEach((option, i) => {
            const li = document.createElement('li');
            li.classList.add('option');
            li.dataset.index = i; // Store the option index
            
            li.innerHTML = `
                <span class="option-letter">${optionLetters[i]}</span>
                <p>${option}</p>
            `;
            
            li.addEventListener('click', () => {
                // Remove 'selected' from any other option
                const allOptions = answerOptionsElement.querySelectorAll('.option');
                allOptions.forEach(opt => opt.classList.remove('selected'));
                // Add 'selected' to the clicked option
                li.classList.add('selected');
            });

            answerOptionsElement.appendChild(li);
        });
    }

    function updateQuestionList() {
        questionListElements.forEach((li, index) => {
            if (index < questions.length) {
                li.textContent = `Quiz question ${index + 1}`;
            } else {
                li.style.display = 'none'; // Hide if not enough questions
            }
        });
    }

    submitBtn.addEventListener('click', () => {
        const selectedOption = answerOptionsElement.querySelector('.option.selected');
        if (!selectedOption) {
            alert('Please select an answer!');
            return;
        }

        const selectedAnswerIndex = parseInt(selectedOption.dataset.index);
        const correctAnswerIndex = questions[currentQuestionIndex].answerIndex;

        // Disable all options after submission
        const allOptions = answerOptionsElement.querySelectorAll('.option');
        allOptions.forEach(option => option.style.pointerEvents = 'none');

        if (selectedAnswerIndex === correctAnswerIndex) {
            score++;
            selectedOption.classList.add('correct');
        } else {
            selectedOption.classList.add('incorrect');
            allOptions[correctAnswerIndex].classList.add('correct'); // Show the right one
        }

        // Move to the next question or show results
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                displayQuestion(currentQuestionIndex);
                questionListElements[currentQuestionIndex - 1].classList.add('completed');
            } else {
                // End of the quiz - show results screen
                showResults();
            }
        }, 1500);
    });

    function showResults() {
        const quizContainer = document.querySelector('.quiz-container');
        const resultsContainer = document.querySelector('.results-container');
        const scoreElement = document.getElementById('score');
        const totalQuestionsElement = document.getElementById('total-questions');

        quizContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

        scoreElement.textContent = score;
        totalQuestionsElement.textContent = questions.length;

        const restartBtn = document.querySelector('.restart-btn');
        restartBtn.addEventListener('click', () => {
            // Easiest way to restart is to reload the page
            location.reload();
        });
    }
});
