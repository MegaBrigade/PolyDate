import React, { useState } from 'react';
import './css/test.css';

/**
 * Test — экран OCEAN-теста при регистрации.
 * onFinish(answers) — вызывается с объектом ответов { 1: score, ..., 15: score }
 * Сохранение в БД делает RegistrationWizard ПОСЛЕ регистрации пользователя.
 */
export default function Test({ onFinish }) {
  const [step, setStep] = useState('quiz');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(15).fill(null));

  const questions = [
    "Я склонен сочувствовать другим людям",
    "У меня полно разных идей",
    "Я интересуюсь делами друзей и коллег",
    "Я часто чувствую себя поглощенным разными проблемами",
    "Я легко справляюсь с взаимодействованием с людьми",
    "Я довольно скрытный человек",
    "Я избегаю общения со сложными людьми",
    "Мне нравится разбираться со сложностями",
    "Я часто попусту трачу время",
    "Меня нелегко заставить беспокоиться",
    "Я планирую и придерживаюсь своих планов",
    "Меня довольно легко задеть",
    "Как правило, я работаю по расписанию",
    "Я умею успокаивать людей",
    "Я люблю заранее планировать свой день"
  ];

  const optionLabels = [
    "Полностью согласен",
    "Частично согласен",
    "Не уверен",
    "Частично не согласен",
    "Полностью не согласен"
  ];

  const selectAnswer = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep('result');
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  // FIX: передаём ответы в onFinish как { 1: score, 2: score, ... }
  // question_id соответствует позиции в массиве (1-индексированный)
  const handleFinish = () => {
    const answersForBackend = {};
    answers.forEach((score, idx) => {
      answersForBackend[idx + 1] = score ?? 3; // дефолт 3 если вдруг null
    });
    onFinish(answersForBackend);
  };

  if (step === 'result') {
    return (
      <div className="test-scope">
        <div className="registration-screen-result screen active">
          <div className="splash-container">
            <img className="polydate" src="/assets/polydate.svg" alt="Логотип" />
          </div>
          <div className="result-content">
            <div className="title-container">
              <img src="/assets/heart-left.svg" className="heart heart-left" alt="heart" />
              <h2 className="text-title-frame">Тест пройден!</h2>
              <img src="/assets/heart-right.svg" className="heart heart-right" alt="heart" />
            </div>
            <div className="result-description">
              Отлично! Ваши ответы помогут нам найти наиболее подходящих людей.
              Совместимость рассчитывается по модели личности OCEAN.
            </div>
            <button className="next-btn" onClick={handleFinish}>Завершить регистрацию</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="test-scope">
      <div className="main-container">
        <div id="splash" className="splash-container">
          <img className="polydate" src="/assets/polydate.svg" alt="Логотип" />
        </div>

        {currentQuestion > 0 && (
          <img className="back-btn" src="/assets/back-btn.svg" alt="назад" onClick={goBack} />
        )}

        <div className="registration-screen-quiz screen active">
          <div className="panel">
            <h2 className="text-title">{questions[currentQuestion]}</h2>
            <div className="quiz-options">
              {optionLabels.map((label, idx) => (
                <div key={idx} className="quiz-option" onClick={() => selectAnswer(5 - idx)}>
                  {label}
                </div>
              ))}
            </div>
            <p className="number-of-question">
              Вопрос {currentQuestion + 1} из {questions.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
