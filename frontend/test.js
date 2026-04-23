
const quizScreens = document.querySelectorAll('.registration-screen-quiz');
if (quizScreens.length) {
    let currentQuizIndex = 0;  

    
    quizScreens.forEach((screen, idx) => {
        screen.classList.toggle('active', idx === currentQuizIndex);
    });

    let answers = [];

    function goToNextQuestion() {
        if (currentQuizIndex < quizScreens.length - 1) {
            quizScreens[currentQuizIndex].classList.remove('active');
            currentQuizIndex++;
            quizScreens[currentQuizIndex].classList.add('active');
        } else {
            alert('Тест завершён! Ваши ответы: ' + JSON.stringify(answers));
            
        }
    }

    function goToPreviousQuestion() {
        if (currentQuizIndex > 0) {
            quizScreens[currentQuizIndex].classList.remove('active');
            currentQuizIndex--;
            quizScreens[currentQuizIndex].classList.add('active');
        }
    }

    
    quizScreens.forEach((screen, idx) => {
        const options = screen.querySelectorAll('.quiz-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                const value = option.getAttribute('data-value') || option.innerText;
                answers[idx] = value;
                setTimeout(() => {
                    goToNextQuestion();
                }, 200);
            });
        });
    });

    
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            goToPreviousQuestion();
        });
    }
    function showScreen(screenId) {
    
        const backBtn = document.querySelector('.back-btn');
        if (screenId === 'registration-screen-result') {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = 'block';
        }
    }
}
