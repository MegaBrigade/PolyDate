const BASE_URL = '/api';

function getTelegramId() {
    try {
        const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (tg?.id) return tg.id;
    } catch (_) {}
    const stored = localStorage.getItem('polydate_user_id');
    return stored ? Number(stored) : null;
}

async function submitTestResults(userId, answers) {
    const res = await fetch(BASE_URL + '/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, answers })
    });
    if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
            const err = await res.json();
            detail = err.detail || err.message || detail;
        } catch (_) {}
        throw new Error(detail);
    }
    return res.json();
}

const quizScreens = document.querySelectorAll('.registration-screen-quiz');

if (quizScreens.length) {
    let currentQuizIndex = 0;

    quizScreens.forEach((screen, idx) => {
        screen.classList.toggle('active', idx === currentQuizIndex);
    });

    const answers = new Array(quizScreens.length).fill(null);

    function goToNextQuestion() {
        if (currentQuizIndex < quizScreens.length - 1) {
            quizScreens[currentQuizIndex].classList.remove('active');
            currentQuizIndex++;
            quizScreens[currentQuizIndex].classList.add('active');
        } else {
            finishTest();
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
                answers[idx] = parseInt(option.getAttribute('data-value'), 10);
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

    async function finishTest() {

        if (backBtn) backBtn.style.display = 'none';

        if (answers.some(a => a === null)) {
            alert('Пожалуйста, ответьте на все вопросы');
            return;
        }

        const userId = getTelegramId();
        if (!userId) {
            console.error('Не удалось получить user_id');
            showResultScreen();
            return;
        }

        const answersObj = {};
        answers.forEach((value, idx) => {
            answersObj[idx + 1] = value;
        });

        try {
            console.log('Отправка результатов теста...', answersObj);
            const response = await submitTestResults(userId, answersObj);
            console.log('Тест сохранён:', response);
        } catch (err) {
            console.error('Ошибка сохранения теста:', err);
        }

        showResultScreen();
    }

    function showResultScreen() {
        quizScreens.forEach(screen => screen.classList.remove('active'));

        const resultScreen = document.querySelector('.registration-screen-result');
        if (resultScreen) {
            resultScreen.classList.add('active');
        }
    }

    const resultNextBtn = document.querySelector('.registration-screen-result .next-btn');
    if (resultNextBtn) {
        resultNextBtn.addEventListener('click', () => {
            window.location.href = 'recommendations.html';
        });
    }
}