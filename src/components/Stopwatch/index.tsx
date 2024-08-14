import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
// import { PlusCircle, Trash2 } from 'lucide-react';
import { CirclePlus } from 'lucide-react';

const loadSound = (src) => {
  const sound = new Audio(src);
  sound.load();
  return sound;
};

const bellTickSound = loadSound('/bell-ticktock.wav');
const happyBellSound = loadSound('/happy-bells-notification.wav');

const parseTimers = (input: string): number[] => {
  const timers = input.split(',').map(timer => {
    const [count, duration] = timer.trim().split('x').map(Number);
    return Array(count).fill(duration);
  }).flat();
  return timers;
};

const timerPresets = [
['3x3', '5x5', '3x7'],  // 55
['3x5', '5x4', '3x7'],  // 56
['3x4', '5x4', '3x7'],  // 53
['3x3', '5x7', '2x7'],  // 58
['3x3', '5x5', '3x7'],  // 55
['2x7', '3x10', '5x1'], // 49
['4x7', '2x10', '5x1'], // 53
['3x7', '2x10', '5x1'], // 46
];
// desc: ['3x3', '5x5', '7x3'];

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours > 0 ? `${hours}m ` : ''}${remainingMinutes}s`;
};

const summarizeIntervals = (intervals: number[]): string => {
  const summary: { [key: number]: number } = {};
  let totalSeconds = 0;
  let totalRepetitions = 0;

  // Подсчет количества повторений каждого интервала
  intervals.forEach(interval => {
    summary[interval] = (summary[interval] || 0) + 1;
    totalSeconds += interval * 60;
    totalRepetitions += 1;
  });

  const summaryString = Object.entries(summary)
    .map(([interval, count]) => `${count}x${interval}`)
    .join(', ');

  return `${summaryString} = ${totalRepetitions} поз (${formatTime(totalSeconds)})`;
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
    setChangePoseTimeLeft(60);
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
                setCurrentTimerIndex(prevIndex => prevIndex !== null ? prevIndex + 1 : null); // Переход к следующему таймеру
              } else {
                setCurrentTimerIndex(null); // Все таймеры завершены
              }
              setChangePoseTimeLeft(null);
              // setCurrentTimerIndex((prevIndex) => (prevIndex !== null ? prevIndex : null));
              
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

  const handlePauseResume = () => {
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
       <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      {/* <h1>Таймер для набросков</h1> */}
      <div>
        <label>
          
          <input className="rounded-xl p-2" type="text" value={input} onChange={handleInputChange} />
          <button onClick={handleStartTimers} style={{ marginLeft: '10px' }}>Старт</button>
        <button onClick={handlePauseResume} style={{ marginLeft: '10px' }}>
          {isPaused ? 'Продолжить' : 'Пауза'}
        </button>
          <div className='text-zinc-400 text-sm p-2'>Введите интервалы таймера (например, 3x3, 5x5, 3x7):{' '}</div>
        </label>
        
      </div>
      <div style={{ marginTop: '20px' }}>
        <h2>Таймеры</h2>
        <DndProvider backend={HTML5Backend}>
          {timers.map((timer, index) => (
            <TimerItem
              key={index}
              timer={timer}
              index={index}
              moveTimer={moveTimer}
              onDelete={handleDeleteTimer}
              currentTimerIndex={currentTimerIndex}
              timeLeft={timeLeft}
            />
          ))}
        </DndProvider>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>Итого: {summarizeIntervals(timers)}</h3>
      </div>
      {currentTimerIndex !== null && (
        <div style={{ marginTop: '20px', color: 'lightgray' }}>
          <h2>Осталось времени: {formatTime(timeLeft)}</h2>
          {changePoseTimeLeft !== null && (
            <h3>Смена позы через: {changePoseTimeLeft} секунд</h3>
          )}
        </div>
      )}
    </div>

      {/* <div>
        <input 
          type="text" 
          value={input} 
          onChange={handleInputChange} 
          placeholder="3x3, 5x5, 7x3"
          className="p-4 h-12"
          style={{ width: '440px', borderRadius: '66px', borderColor: '#DADCE0' }}
        />
        <button className="my-6 py-3" onClick={handleStartTimers}><CirclePlus /></button>

        {totalTime > 0 && (
          <div style={{ marginTop: '10px' }}>
            <h4>Общее время: {formatTime(totalTime)}</h4>
          </div>
        )} */}

        {/* <p>{timerPresets}</p> */}
        {/* {timerPresets.map(paragraph => <div>{paragraph.join(', ')}</div>)} */}
        {/* <div>{timerPresets.join(',')}</div> */}
        {/* <p>{timerPresets.map((item, index) => ({(index? ', ': '') + item }))}</p> */}

        {/* <div>
        {
          this.props.data.map(function(item, index) {
            return <span key={`timerPresets${index}`}>{ (index ? ', ' : '') + item }</span>;
          })
        }
      </div> */}

        {/* <div style={{ marginTop: '20px' }}>
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
                width: `${(40 - changePoseTimeLeft) / 40 * 100}%`,
                backgroundColor: 'orange',
                transition: 'width 1s linear'
              }}
            />
          </div>
        )}
      </div> */}
      {/* <div className="max-w-sm mx-auto p-4 bg-white rounded shadow-lg">
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
      <button className="mt-4 flex items-center space-x-2 text-white bg-blue-500 px-3 py-2 rounded">
        <PlusCircle className="w-5 h-5" />
        <span>Add Task</span>
      </button>
    </div> */}
    </DndProvider>
  );
};
