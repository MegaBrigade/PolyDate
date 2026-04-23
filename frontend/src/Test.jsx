
import React, { useState } from 'react';
import './css/test.css';

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
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResult = () => {
    const total = answers.reduce((sum, val) => sum + (val || 0), 0);
    if (total > 60) return { title: 'Экстраверт', description: 'Вы — экстраверт. Вы черпаете энергию из общения, любите быть в центре внимания, легко заводите новые знакомства. Вы активны, оптимистичны и склонны к действию. Иногда бываете импульсивны, но это делает вас живым и увлекающимся человеком. Одиночество вас утомляет, а шумные компании — вдохновляют.' };
    if (total < 45 && total > 30) return { title: 'Стоик', description: 'Вы — Стоик. Вы эмоционально стабильны, спокойно переносите стресс, не поддаётесь панике. Ваши решения взвешенны, вы способны трезво оценивать любую проблему. Вас сложно вывести из равновесия, окружающие ценят вас за надёжность и зрелость. Вы не драматизируете и сохраняете хладнокровие в кризисных ситуациях.' };
    if (total <= 30 && total > 20) return { title: 'Нейротик', description: 'Вы — Нейротик. Ваши эмоции часто берут верх, вы импульсивны и чувствительны к критике. Вы можете остро переживать неудачи и тревожиться по пустякам. Вам бывает трудно контролировать гнев или раздражение. Однако эта же черта делает вас страстным, глубоко чувствующим и эмпатичным человеком. Вы живёте ярко, но порой хаотично.' };
    return { title: 'Интроверт', description: 'Вы — интроверт. Вы предпочитаете уединение или общение в очень узком кругу. Вам комфортно работать в одиночку, вы вдумчивы и сосредоточены. Ваш эмоциональный фон ровный, вы не склонны к внешним проявлениям чувств. Вы цените глубину отношений, а не их количество. Тишина и спокойствие помогают вам восстановить силы.' };
  };

//   if (step === 'result') {
//     const result = calculateResult();
//     return (
//       <div className="registration-screen-result screen active">
//         <div className="splash-container">
//             <img className="polydate" src="/assets/polydate.svg" alt="Логотип приложения" />
//         </div>
//         <div className="result-content">
//           <div className="title-container">
//             <img src="/assets/heart-left.svg" className="heart heart-left" alt="heart" />
//             <h2 className="text-title-frame">{result.title}</h2>
//             <img src="/assets/heart-right.svg" className="heart heart-right" alt="heart" />
//           </div>
//           <div className="result-description">{result.description}</div>
//           <button className="next-btn" onClick={onFinish}>Далее</button>
//         </div>
//       </div>
//     );
//   }
// Внутри компонента Test.jsx

    const handleResultNext = () => {
        setStep('success');
    };

    if (step === 'success') {
        return (
        <div className="test-scope">  
            <div className="registration-screen-result registration-screen-success screen active">
                <div className="splash-container">
                    <img className="polydate" src="/assets/polydate.svg" alt="Логотип" />
                </div>
                <div className="result-content">
                <div className="title-container">
                    <img src="/assets/heart-left.svg" className="heart heart-left" alt="heart" />
                    <h2 className="text-title-frame">Успех!</h2>
                    <img src="/assets/heart-right.svg" className="heart heart-right" alt="heart" />
                </div>
                <div className="result-description">
                    Ваш профиль успешно создан! Скорее переходите к поиску — ваша вторая половинка уже где-то рядом, осталось лишь сделать первый шаг
                </div>
                <button className="next-btn" onClick={onFinish}>Готово!</button>
                </div>
            </div>
        </div>
        );
    }

    if (step === 'result') {
        const result = calculateResult();
        return (
        <div className="test-scope">  
            <div className="registration-screen-result screen active">
                <div className="splash-container">
                    <img className="polydate" src="/assets/polydate.svg" alt="Логотип" />
                </div>
                <div className="result-content">
                <div className="title-container">
                    <img src="/assets/heart-left.svg" className="heart heart-left" alt="heart" />
                    <h2 className="text-title-frame">{result.title}</h2>
                    <img src="/assets/heart-right.svg" className="heart heart-right" alt="heart" />
                </div>
                <div className="result-description">{result.description}</div>
                <button className="next-btn" onClick={handleResultNext}>Далее</button>
                </div>
            </div>
        </div>
        );
    }
  // Экран вопроса – добавлен логотип
//   return (
//     <div className="main-container">
//       {/* Логотип в правом верхнем углу, как в test.html */}
//       <div id="splash" className="splash-container">
//         <img className="polydate" src="/assets/polydate.svg" alt="Логотип приложения" />
//       </div>
//       {/* Кнопка «Назад» */}
//       {currentQuestion > 0 && (
//         <img className="back-btn" src="/assets/back-btn.svg" alt="назад" onClick={goBack} />
//       )}
//       <div className="registration-screen-quiz screen active">
//         <div className="panel">
//           <h2 className="text-title">{questions[currentQuestion]}</h2>
//           <div className="quiz-options">
//             {optionLabels.map((label, idx) => {
//               const value = 5 - idx;
//               const isActive = answers[currentQuestion] === value;
//               return (
//                 <div
//                   key={idx}
//                   className={`quiz-option ${isActive ? 'active' : ''}`}
//                   onClick={() => selectAnswer(value)}
//                 >
//                   {label}
//                 </div>
//               );
//             })}
//           </div>
//           <p className="number-of-question">Вопрос {currentQuestion + 1} из {questions.length}</p>
//         </div>
//       </div>
//     </div>
//   );
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