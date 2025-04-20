//DOM Element
const welcomeScreen = document.getElementById('welcome-screen');
        const quizScreen = document.getElementById('quiz-screen');
        const resultsScreen = document.getElementById('results-screen');
        const startQuizBtn = document.getElementById('start-quiz');
        const quitQuizBtn = document.getElementById('quit-quiz');
        const nextQuestionBtn = document.getElementById('next-question');
        const tryAgainBtn = document.getElementById('try-again');
        const newQuizBtn = document.getElementById('new-quiz');
        const questionElement = document.getElementById('question');
        const optionsContainer = document.getElementById('options');
        const questionNumberElement = document.getElementById('question-number');
        const timerElement = document.getElementById('timer');
        const progressBar = document.getElementById('progress-bar');
        const themeToggleBtn = document.getElementById('theme-toggle');
        const quizSourceSelect = document.getElementById('quiz-source');
        const apiOptions = document.getElementById('api-options');
        const customQuizOptions = document.getElementById('custom-quiz-options');
        const customQuizSelect = document.getElementById('custom-quiz-select');
        const createQuizBtn = document.getElementById('create-quiz-btn');
        const createQuizModal = document.getElementById('create-quiz-modal');
        const closeModalBtn = document.getElementById('close-modal');
        const addQuestionBtn = document.getElementById('add-question');
        const saveQuizBtn = document.getElementById('save-quiz');
        const questionsContainer = document.getElementById('questions-container');
        const quizTitleInput = document.getElementById('quiz-title');
        const quizDescriptionInput = document.getElementById('quiz-description');
        //const API_BASE_URL = 'http://localhost:5000/api';

        // Quiz Variables
        let questions = [];
        let currentQuestionIndex = 0;
        let score = 0;
        let timer;
        let timeLeft = 30;
        let quizStartTime;
        let customQuizzes = JSON.parse(localStorage.getItem('customQuizzes')) || [];

        // Event Listeners
        startQuizBtn.addEventListener('click', startQuiz);
        quitQuizBtn.addEventListener('click', quitQuiz);
        nextQuestionBtn.addEventListener('click', nextQuestion);
        tryAgainBtn.addEventListener('click', tryAgain);
        newQuizBtn.addEventListener('click', newQuiz);
        // themeToggleBtn.addEventListener('click', toggleTheme);
        quizSourceSelect.addEventListener('change', toggleQuizSource);
        createQuizBtn.addEventListener('click', openCreateQuizModal);
        closeModalBtn.addEventListener('click', closeCreateQuizModal);
        addQuestionBtn.addEventListener('click', addQuestion);
        saveQuizBtn.addEventListener('click', saveQuiz);

        // Initialize
        loadCustomQuizzes();

        // Functions
        function toggleQuizSource() {
            if (quizSourceSelect.value === 'api') {
                apiOptions.classList.remove('hidden');
                customQuizOptions.classList.add('hidden');
            } else {
                apiOptions.classList.add('hidden');
                customQuizOptions.classList.remove('hidden');
                loadCustomQuizzes();
            }
        }

        function loadCustomQuizzes() {
            customQuizSelect.innerHTML = '';
            
            if (customQuizzes.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No custom quizzes available';
                option.disabled = true;
                customQuizSelect.appendChild(option);
                startQuizBtn.disabled = true;
            } else {
                customQuizzes.forEach((quiz, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = quiz.title;
                    customQuizSelect.appendChild(option);
                });
                startQuizBtn.disabled = false;
            }
        }

        async function startQuiz() {
            const source = quizSourceSelect.value;
            
            // Show loading state
            startQuizBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Loading...';
            startQuizBtn.disabled = true;
            
            try {
                if (source === 'api') {
                    const category = document.getElementById('category').value;
                    const difficulty = document.getElementById('difficulty').value;
                    
                    // Fetch questions from Open Trivia DB API
                    const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`);
                    const data = await response.json();
                    
                    if (data.response_code === 0) {
                        questions = data.results;
                    } else {
                        throw new Error('Failed to load questions from API');
                    }
                } else {
                    const quizIndex = customQuizSelect.value;
                    if (quizIndex === '' || !customQuizzes[quizIndex]) {
                        throw new Error('No custom quiz selected');
                    }
                    
                    questions = customQuizzes[quizIndex].questions.map(q => ({
                        question: q.question,
                        correct_answer: q.correctAnswer,
                        incorrect_answers: q.incorrectAnswers
                    }));
                }
                
                welcomeScreen.classList.add('hidden');
                quizScreen.classList.remove('hidden');
                currentQuestionIndex = 0;
                score = 0;
                loadQuestion();
            } catch (error) {
                console.error('Error loading questions:', error);
                alert('An error occurred: ' + error.message);
                startQuizBtn.innerHTML = 'Start Quiz <i class="fas fa-play ml-2"></i>';
                startQuizBtn.disabled = false;
            }
        }

        function loadQuestion() {
            // Reset timer
            clearInterval(timer);
            timeLeft = 30;
            timerElement.textContent = timeLeft;
            
            // Start timer
            timer = setInterval(() => {
                timeLeft--;
                timerElement.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    timeUp();
                }
            }, 1000);
            
            // Record start time for the first question
            if (currentQuestionIndex === 0) {
                quizStartTime = new Date();
            }
            
            // Update progress
            const progress = ((currentQuestionIndex) / questions.length) * 100;
            progressBar.style.width = `${progress}%`;
            questionNumberElement.textContent = currentQuestionIndex + 1;
            
            // Get current question
            const currentQuestion = questions[currentQuestionIndex];
            
            // Decode HTML entities in question and options
            questionElement.textContent = decodeHTML(currentQuestion.question);
            
            // Combine correct and incorrect answers
            const options = [...currentQuestion.incorrect_answers];
            const correctAnswerIndex = Math.floor(Math.random() * (options.length + 1));
            options.splice(correctAnswerIndex, 0, currentQuestion.correct_answer);
            
            // Clear previous options
            optionsContainer.innerHTML = '';
            
            // Create option buttons
            options.forEach((option, index) => {
                const optionElement = document.createElement('button');
                optionElement.className = 'option p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition duration-200';
                optionElement.innerHTML = decodeHTML(option);
                optionElement.dataset.index = index;
                
                optionElement.addEventListener('click', () => selectOption(optionElement, correctAnswerIndex));
                
                optionsContainer.appendChild(optionElement);
            });
            
            // Hide next button initially
            nextQuestionBtn.classList.add('hidden');
        }

        function selectOption(selectedOption, correctIndex) {
            clearInterval(timer);
            
            // Disable all options
            const options = document.querySelectorAll('.option');
            options.forEach(option => {
                option.disabled = true;
            });
            
            // Mark correct answer
            options[correctIndex].classList.add('correct');
            
            // Check if selected answer is correct
            if (parseInt(selectedOption.dataset.index) === correctIndex) {
                score++;
                selectedOption.classList.add('correct');
            } else {
                selectedOption.classList.add('incorrect');
            }
            
            // Show next button
            nextQuestionBtn.classList.remove('hidden');
        }

        function timeUp() {
            // Disable all options
            const options = document.querySelectorAll('.option');
            options.forEach(option => {
                option.disabled = true;
            });
            
            // Mark correct answer
            const currentQuestion = questions[currentQuestionIndex];
            const correctIndex = [...document.querySelectorAll('.option')].findIndex(option => 
                option.textContent === decodeHTML(currentQuestion.correct_answer)
            );
            
            if (correctIndex !== -1) {
                options[correctIndex].classList.add('correct');
            }
            
            // Show next button
            nextQuestionBtn.classList.remove('hidden');
        }

        function nextQuestion() {
            currentQuestionIndex++;
            
            if (currentQuestionIndex < questions.length) {
                loadQuestion();
            } else {
                showResults();
            }
        }

        function showResults() {
            quizScreen.classList.add('hidden');
            resultsScreen.classList.remove('hidden');
            
            // Calculate time taken
            const quizEndTime = new Date();
            const timeTaken = Math.floor((quizEndTime - quizStartTime) / 1000);
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;
            document.getElementById('time-taken').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Update results
            document.getElementById('correct-answers').textContent = score;
            document.getElementById('incorrect-answers').textContent = questions.length - score;
            document.getElementById('final-score').textContent = `${Math.round((score / questions.length) * 100)}%`;
            
            // Update progress bars
            document.getElementById('correct-bar').style.width = `${(score / questions.length) * 100}%`;
            document.getElementById('incorrect-bar').style.width = `${((questions.length - score) / questions.length) * 100}%`;
            
            // Custom result message
            const percentage = (score / questions.length) * 100;
            let message = '';
            
            if (percentage >= 80) {
                message = `Excellent! You scored ${score} out of ${questions.length}`;
            } else if (percentage >= 60) {
                message = `Good job! You scored ${score} out of ${questions.length}`;
            } else if (percentage >= 40) {
                message = `Not bad! You scored ${score} out of ${questions.length}`;
            } else {
                message = `Keep practicing! You scored ${score} out of ${questions.length}`;
            }
            
            document.getElementById('result-message').textContent = message;
        }

        function quitQuiz() {
            if (confirm('Are you sure you want to quit the quiz?')) {
                clearInterval(timer);
                quizScreen.classList.add('hidden');
                welcomeScreen.classList.remove('hidden');
                
                // Reset start button
                startQuizBtn.innerHTML = 'Start Quiz <i class="fas fa-play ml-2"></i>';
                startQuizBtn.disabled = false;
            }
        }

        function tryAgain() {
            resultsScreen.classList.add('hidden');
            currentQuestionIndex = 0;
            score = 0;
            quizScreen.classList.remove('hidden');
            loadQuestion();
        }

        function newQuiz() {
            resultsScreen.classList.add('hidden');
            welcomeScreen.classList.remove('hidden');
        }

        // function toggleTheme() {
        //     document.documentElement.classList.toggle('dark');
        //     const icon = themeToggleBtn.querySelector('i');
            
        //     if (document.documentElement.classList.contains('dark')) {
        //         icon.classList.remove('fa-moon');
        //         icon.classList.add('fa-sun');
        //     } else {
        //         icon.classList.remove('fa-sun');
        //         icon.classList.add('fa-moon');
        //     }
        // }

        // Create Quiz Modal Functions
        function openCreateQuizModal() {
            createQuizModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Clear previous inputs
            quizTitleInput.value = '';
            quizDescriptionInput.value = '';
            questionsContainer.innerHTML = '';
            
            // Add first question
            addQuestion();
        }

        function closeCreateQuizModal() {
            createQuizModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        function addQuestion() {
            const questionIndex = questionsContainer.children.length;
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-6 p-4 border border-gray-200 rounded-lg';
            questionDiv.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-medium text-gray-700">Question #${questionIndex + 1}</h3>
                    <button class="remove-question text-red-500 hover:text-red-700" data-index="${questionIndex}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="mb-4">
                    <label class="block text-left font-medium text-gray-700 mb-2">Question Text</label>
                    <input type="text" class="question-text w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter the question">
                </div>
                <div class="mb-4">
                    <label class="block text-left font-medium text-gray-700 mb-2">Correct Answer</label>
                    <input type="text" class="correct-answer w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter the correct answer">
                </div>
                <div>
                    <label class="block text-left font-medium text-gray-700 mb-2">Incorrect Answers</label>
                    <div class="incorrect-answers space-y-2">
                        <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter incorrect answer">
                        <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter incorrect answer">
                        <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter incorrect answer">
                    </div>
                </div>
            `;
            
            questionsContainer.appendChild(questionDiv);
            
            // Add event listener to remove button
            questionDiv.querySelector('.remove-question').addEventListener('click', function() {
                if (questionsContainer.children.length > 1) {
                    questionDiv.remove();
                    // Update question numbers
                    Array.from(questionsContainer.children).forEach((q, i) => {
                        q.querySelector('h3').textContent = `Question #${i + 1}`;
                        q.querySelector('.remove-question').dataset.index = i;
                    });
                } else {
                    alert('A quiz must have at least one question!');
                }
            });
        }

        function saveQuiz() {
            const title = quizTitleInput.value.trim();
            const description = quizDescriptionInput.value.trim();
            
            if (!title) {
                alert('Please enter a title for your quiz');
                return;
            }
            
            const questions = [];
            let isValid = true;
            
            Array.from(questionsContainer.children).forEach(questionDiv => {
                const questionText = questionDiv.querySelector('.question-text').value.trim();
                const correctAnswer = questionDiv.querySelector('.correct-answer').value.trim();
                const incorrectAnswers = Array.from(questionDiv.querySelectorAll('.incorrect-answers input'))
                    .map(input => input.value.trim())
                    .filter(a => a);
                
                if (!questionText || !correctAnswer || incorrectAnswers.length < 2) {
                    isValid = false;
                    return;
                }
                
                questions.push({
                    question: questionText,
                    correctAnswer: correctAnswer,
                    incorrectAnswers: incorrectAnswers
                });
            });
            
            if (!isValid) {
                alert('Please make sure all questions have:\n- A question text\n- A correct answer\n- At least 2 incorrect answers');
                return;
            }
            
            if (questions.length < 3) {
                alert('A quiz must have at least 3 questions');
                return;
            }
            
            // Save the quiz
            const newQuiz = {
                title: title,
                description: description,
                questions: questions,
                createdAt: new Date().toISOString()
            };
            
            customQuizzes.push(newQuiz);
            localStorage.setItem('customQuizzes', JSON.stringify(customQuizzes));
            
            alert('Quiz saved successfully!');
            closeCreateQuizModal();
            loadCustomQuizzes();
            
            // Switch to custom quizzes tab and select the new quiz
            quizSourceSelect.value = 'custom';
            toggleQuizSource();
            customQuizSelect.value = customQuizzes.length - 1;
        }

        // Helper function to decode HTML entities
        function decodeHTML(html) {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
        }