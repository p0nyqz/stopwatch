import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PlusCircle, Trash2 } from 'lucide-react';

const loadSound = (src) => {
  const sound = new Audio(src);
  sound.load();
  return sound;
};

const bellTickSound = loadSound('../public/bell-ticktock.wav');
const happyBellSound = loadSound('../public/happy-bells-notification.wav');

const parseTimers = (input: string): number[] => {
  const timers = input.split(',').map(timer => {
    const [count, duration] = timer.trim().split('x').map(Number);
    return Array(count).fill(duration);
  }).flat();
  return timers;
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours > 0 ? `${hours}h ` : ''}${remainingMinutes}m`;
};

const speak = (text: string, lang: string = 'ru-RU', voiceName: string = 'Google русский') => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const voices = speechSynthesis.getVoices();
  const selectedVoice = voices.find(voice => voice.name === voiceName);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  speechSynthesis.speak(utterance);
};

const TimerItem = ({ timer, index, moveTimer, onDelete, currentTimerIndex, timeLeft }) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: 'timer',
    hover(item: { index: number }) {
      if (item.index !== index) {
        moveTimer(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'timer',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
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
              width: `${((timer * 60 - timeLeft) / (timer * 60)) * 100}%`,
              background: 'green',
              transition: 'width 1s linear'
            }}
          />
        )}
      </div>
      <span style={{ marginLeft: '10px' }}>{timer} мин</span>
      <button onClick={() => onDelete(index)} style={{ marginLeft: '10px' }}>Удалить</button>
    </div>
  );
};

export const Stopwatch: React.FC = () => {
  const [input, setInput] = useState('');
  const [timers, setTimers] = useState<number[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTimerIndex, setCurrentTimerIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [changePoseTimeLeft, setChangePoseTimeLeft] = useState<number | null>(null);
  const oneMinuteWarningRef = useRef(false); // Для предотвращения повторного предупреждения
  const nextPoseAnnouncementRef = useRef(false); // Для предотвращения повторного объявления следующей позы

  useEffect(() => {
    if (currentTimerIndex !== null && currentTimerIndex < timers.length) {
      if (isPaused) return;

      const currentTimer = timers[currentTimerIndex];
      setTimeLeft(currentTimer * 60);

      // Объявляем следующую позу только один раз
      if (!nextPoseAnnouncementRef.current) {
        speak(`Следующая поза ${currentTimer} минут.`);
        nextPoseAnnouncementRef.current = true;
      }

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === 60 && !oneMinuteWarningRef.current && currentTimer > 1) {
            // Если таймер не равен одной минуте, произносим предупреждение
            speak('Осталась одна минута.');
            oneMinuteWarningRef.current = true; // Установим флаг, чтобы предупредить только один раз
          }
          if (prev <= 1) {
            clearInterval(interval);
            handleEndOfTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentTimerIndex, timers, isPaused]);

  const handleEndOfTimer = () => {
    speak('Смена позы.');
    setTimeout(() => {
      startChangePoseCountdown();
    }, 1000); // Небольшая задержка перед началом отсчета на смену позы
  };

  const startChangePoseCountdown = () => {
    setChangePoseTimeLeft(20);
    bellTickSound.play(); // Запуск звука один раз

    const changePoseInterval = setInterval(() => {
      setChangePoseTimeLeft((prev) => {
        if (prev !== null) {
          if (prev <= 1) {
            clearInterval(changePoseInterval);
            bellTickSound.pause(); // Остановка звука после 20 секунд
            bellTickSound.currentTime = 0; // Перемотка на начало
            happyBellSound.currentTime = 0;  // Перемотка на начало
            happyBellSound.play();
            happyBellSound.onended = () => { // Ждем завершения звука перед объявлением следующей позы
              if (currentTimerIndex !== null && currentTimerIndex + 1 < timers.length) {
                nextPoseAnnouncementRef.current = false; // Сбросим флаг для следующего таймера
                oneMinuteWarningRef.current = false; // Сбросим предупреждение за минуту
                speak(`Следующая поза ${timers[currentTimerIndex + 1]} минут.`);
              }
              setCurrentTimerIndex((prevIndex) => (prevIndex !== null ? prevIndex + 1 : null));
              setChangePoseTimeLeft(null);
            };
            return null;
          }
          return prev - 1;
        }
        return prev;
      });
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const parsedTimers = parseTimers(value);
    setTimers(parsedTimers);

    const totalMinutes = parsedTimers.reduce((acc, timer) => acc + timer, 0);
    setTotalTime(totalMinutes);
  };

  const handleStartTimers = () => {
    if (timers.length > 0) {
      setCurrentTimerIndex(0);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleDeleteTimer = (indexToDelete: number) => {
    setTimers(prevTimers => {
      const updatedTimers = prevTimers.filter((_, index) => index !== indexToDelete);
      const totalMinutes = updatedTimers.reduce((acc, timer) => acc + timer, 0);
      setTotalTime(totalMinutes);
      return updatedTimers;
    });

    if (currentTimerIndex !== null && indexToDelete < currentTimerIndex) {
      setCurrentTimerIndex(prev => (prev !== null ? prev - 1 : null));
    }
  };

  const moveTimer = (fromIndex: number, toIndex: number) => {
    const updatedTimers = [...timers];
    const [movedTimer] = updatedTimers.splice(fromIndex, 1);
    updatedTimers.splice(toIndex, 0, movedTimer);
    setTimers(updatedTimers);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <input 
          type="text" 
          value={input} 
          onChange={handleInputChange} 
          placeholder="5x3, 3x7, 1x10"
          className="p-4 h-12"
          style={{ width: '340px', borderRadius: '66px', borderColor: '#DADCE0' }}
        />
        <button onClick={handleStartTimers}>Создать таймеры</button>
        
        {totalTime > 0 && (
          <div style={{ marginTop: '10px' }}>
            <h4>Общее время: {formatTime(totalTime)}</h4>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          {timers.map((timer, index) => (
            <TimerItem 
              key={index}
              index={index}
              timer={timer}
              moveTimer={moveTimer}
              onDelete={handleDeleteTimer}
              currentTimerIndex={currentTimerIndex}
              timeLeft={timeLeft}
            />
          ))}
        </div>

        {currentTimerIndex !== null && (
          <button onClick={handlePause} style={{ marginTop: '10px' }}>
            {isPaused ? 'Продолжить' : 'Пауза'}
          </button>
        )}

        {changePoseTimeLeft !== null && (
          <div style={{ marginTop: '20px', width: '100%', height: '30px', backgroundColor: 'lightgray', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${(20 - changePoseTimeLeft) / 20 * 100}%`,
                backgroundColor: 'orange',
                transition: 'width 1s linear'
              }}
            />
          </div>
        )}
      </div>
    </DndProvider>
  );
};
