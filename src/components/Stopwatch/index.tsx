import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const parseTimers = (input: string): number[] => {
  const timers = input.split(',').map(timer => {
    const [count, duration] = timer.trim().split('x').map(Number);
    return Array(count).fill(duration);
  }).flat();
  return timers;
};

const speak = (text: string, lang: string = 'ru-RU') => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; // Устанавливаем русский язык
  speechSynthesis.speak(utterance);
};

export const Stopwatch: React.FC = () => {
  const [input, setInput] = useState('');
  const [timers, setTimers] = useState<number[]>([]); // Список таймеров
  const [currentTimerIndex, setCurrentTimerIndex] = useState<number | null>(null); // Индекс текущего активного таймера
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false); // Для управления паузой

  useEffect(() => {
    if (currentTimerIndex !== null && currentTimerIndex < timers.length) {
      if (isPaused) return;

      const currentTimer = timers[currentTimerIndex];
      setTimeLeft(currentTimer * 60); // Convert minutes to seconds

      // Объявляем начало отсчета времени
      speak(`Следующая поза ${currentTimer} минут.`);

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === 60) {
            speak('Осталась одна минута.');
          }
          if (prev <= 1) {
            clearInterval(interval);
            setCurrentTimerIndex((prevIndex) => (prevIndex !== null ? prevIndex + 1 : null));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentTimerIndex, timers, isPaused]);

  const handleCreateTimers = () => {
    const parsedTimers = parseTimers(input);
    setTimers(parsedTimers); // Создаем таймеры, но не запускаем их
  };

  const handleStartTimers = () => {
    if (timers.length > 0) {
      setCurrentTimerIndex(0); // Запускаем с первого таймера
      setIsPaused(false); // Снимаем с паузы при старте
    }
  };

  const handlePause = () => {
    setIsPaused(prev => !prev); // Переключение паузы
  };

  const handleDeleteTimer = (indexToDelete: number) => {
    setTimers(prevTimers => prevTimers.filter((_, index) => index !== indexToDelete));
    if (currentTimerIndex !== null && indexToDelete < currentTimerIndex) {
      setCurrentTimerIndex(prev => (prev !== null ? prev - 1 : null)); // Корректируем индекс текущего таймера
    }
  };

  return (
    <div>
      <div className="max-w-sm mx-auto p-4 bg-white rounded shadow-lg">
      <h1 className="text-xl font-semibold mb-4">Task List</h1>
      <ul className="space-y-2">
        <li className="flex items-center justify-between p-2 bg-gray-100 rounded">
          <span>Task 1</span>
          <Trash2 className="w-5 h-5 text-red-500 cursor-pointer" />
        </li>
        <li className="flex items-center justify-between p-2 bg-gray-100 rounded">
          <span>Task 2</span>
          <Trash2 className="w-5 h-5 text-red-500 cursor-pointer" />
        </li>
      </ul>
      <button className="mt-4 flex items-left space-x-2 text-white bg-blue-500 px-3 py-2 rounded">
        <PlusCircle className="w-5 h-5" />
        <span>Add Task</span>
      </button>
    </div>
      <input 
        type="text" 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        placeholder="5x3, 3x7, 1x10"
        style={{ height: '42px', width: '340px', borderRadius: '66px', borderColor: '#DADCE0'}}
      />
      <button onClick={handleCreateTimers}>Создать таймеры</button>
      
      <div style={{ marginTop: '20px' }}>
        {timers.map((timer, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <div 
              style={{
                width: '200px',
                height: '30px',
                background: currentTimerIndex === index ? 'lightgreen' : 'lightgray',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '5px',
                marginRight: '10px',
              }}
            >
              {currentTimerIndex === index && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${((timers[index] * 60 - timeLeft) / (timer * 60)) * 100}%`,
                    background: 'green',
                    transition: 'width 1s linear'
                  }}
                />
              )}
            </div>
            <span style={{ marginLeft: '10px' }}>{timer} мин</span>
            <button onClick={() => handleDeleteTimer(index)} style={{ marginLeft: '10px' }}>Удалить</button>
          </div>
        ))}
      </div>

      {timers.length > 0 && currentTimerIndex === null && (
        <button onClick={handleStartTimers}>Запустить таймеры</button>
      )}

      {currentTimerIndex !== null && (
        <button onClick={handlePause} style={{ marginTop: '10px' }}>
          {isPaused ? 'Продолжить' : 'Пауза'}
        </button>
      )}
    </div>
  );
};
