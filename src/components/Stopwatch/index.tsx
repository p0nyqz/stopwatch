import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Play, Trash2 } from 'lucide-react';
import { CirclePlus } from 'lucide-react';

const loadSound = (src) => {
  const sound = new Audio(src);
  sound.load();
  return sound;
};


const endPoseSound = loadSound('/happy-bells-notification.wav');
// const endPoseSound = loadSound('/start-sound-8bit.mp3');
// const startPoseSound = loadSound('/happy-bells-notification.wav');

const parseTimers = (input: string): number[] => {
  const timers = input.split(',').map(timer => {
    const [count, duration] = timer.trim().split('x').map(Number);
    return Array(count).fill(duration);
  }).flat();
  return timers;
};

const timerPresets = {
  group1: [
    ['3x3', '5x5', '3x7'],
    ['2x3', '5x7', '2x7'],
  ],
  group2: [
    ['3x3', '5x5', '3x7'],
    ['2x7', '3x10', '5x1'],
    ['4x7', '2x10', '5x1'],
    ['3x7', '2x10', '5x1'],
  ]
};

const calculateTotalTime = (preset: string[]): string => {
  const totalMinutes = preset
    .map(item => item.split('x').map(Number)) // ['3x3'] => [3, 3]
    .reduce((total, [count, duration]) => total + count * duration, 0); // Total minutes

  return `${totalMinutes} мин`;
};

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

  return `${totalRepetitions} поз`;

  // const summaryString = Object.entries(summary)
  //   .map(([interval, count]) => `${count}x${interval}`)
  //   .join(', ');

  // return `${summaryString} = ${totalRepetitions} поз (${formatTime(totalSeconds)})`;

  
};

const speak = (
  text: string, 
  langs: string[] = ['ru-RU', 'en-US'], 
  voiceNames: string[] = ['Google русский', 'Google US English']
) => {
  const voices = speechSynthesis.getVoices();

  langs.forEach((lang, index) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    const selectedVoice = voices.find(voice => 
      voice.name === voiceNames[index] && voice.lang === lang
    );

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      console.warn(`Не удалось найти подходящий голос для озвучивания на языке: ${lang}`);
    }

    speechSynthesis.speak(utterance);
  });
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
          width: '100%',
          height: '40px',
          background: currentTimerIndex === index ? 'white' : '#E7E7E7',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '20px',
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
              borderRadius: `20px`,
              width: `${((timer * 60 - timeLeft) / (timer * 60)) * 100}%`,
              background: 'lightgreen',
              transition: 'width 1s linear',
            }}
          />
        )}
      </div>
      <span style={{ marginLeft: '16px', position: 'absolute'}}>{timer}</span>
      <button onClick={() => onDelete(index)} className='ml-1 p-2 rounded-full hover:border-white'><Trash2 className='text-zinc-400 p-0.5 hover:text-black'/></button>
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Функция для обработки выбора пресета
    const handlePresetSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedPreset = event.target.value;
      setInput(selectedPreset);
  
      const parsedTimers = parseTimers(selectedPreset);
      setTimers(parsedTimers);
  
      const totalMinutes = parsedTimers.reduce((acc, timer) => acc + timer, 0);
      setTotalTime(totalMinutes);
    };

  useEffect(() => {
    if (currentTimerIndex !== null && currentTimerIndex < timers.length) {
      if (isPaused) return;

      const currentTimer = timers[currentTimerIndex];
      setTimeLeft(currentTimer * 60);

      // Объявляем следующую позу только один раз
      if (!nextPoseAnnouncementRef.current) {
        // speak(`Следующая поза ${currentTimer} минут.`);
        if (currentTimer === 1) {
          speak(`Следующая поза одна минута.`, ['ru-RU'], ['Google русский']);
          speak(`Next pose one minute.`, ['en-US'], ['Google US English']);
        }
        else if (currentTimer >= 2 && currentTimer <= 4) {
          speak(`Следующая поза ${currentTimer} минуты.`, ['ru-RU'], ['Google русский']);
          speak(`Next pose ${currentTimer} minutes.`, ['en-US'], ['Google US English']);
        } else {
          speak(`Следующая поза ${currentTimer} минут.`, ['ru-RU'], ['Google русский']);
          speak(`Next pose ${currentTimer} minutes.`, ['en-US'], ['Google US English']);
        }
        nextPoseAnnouncementRef.current = true;
      }

      // Устанавливаем интервал, если он еще не установлен
      if (intervalRef.current === null) {
        intervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev === 60 && !oneMinuteWarningRef.current && currentTimer > 1) {
              // Предупреждаем за минуту до конца
              speak('Осталась одна минута.', ['ru-RU'], ['Google русский']);
              speak('One minute left', ['en-US'], ['Google US English']);
              oneMinuteWarningRef.current = true;
            }
            if (prev <= 1) {
              clearInterval(intervalRef.current!);
              intervalRef.current = null; // Сбрасываем ссылку на интервал
              handleEndOfTimer();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      return () => {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null; // Сбрасываем ссылку на интервал
        }
      };
    }
  }, [currentTimerIndex, timers, isPaused]);

  const handleEndOfTimer = () => {
    const isLastTimer = currentTimerIndex === timers.length - 1;
    const isSecondToLastTimer = currentTimerIndex === timers.length - 2;
  
    if (isLastTimer) {
      speak('Перерыв', ['ru-RU'], ['Google русский']);
      speak('Break', ['en-US'], ['Google US English']);
    } else {
      speak('Смена позы', ['ru-RU'], ['Google русский']);
      speak('Change of pose', ['en-US'], ['Google US English']);
  
      setTimeout(startChangePoseCountdown, 5000); // Задержка перед отсчетом смены позы
  
      if (isSecondToLastTimer) {
        speak('Последняя поза', ['ru-RU'], ['Google русский']);
        speak('Last pose', ['en-US'], ['Google US English']);
      }
    }
  };

  const startChangePoseCountdown = () => {
    setChangePoseTimeLeft(60);
    // startPoseSound.play(); // Запуск звука один раз
    // bellTickSound.play(); 

    const changePoseInterval = setInterval(() => {
      setChangePoseTimeLeft((prev) => {
        if (prev !== null) {
          if (prev <= 1) {
            clearInterval(changePoseInterval);
            // startPoseSound.pause(); // Остановка звука после n секунд
            // startPoseSound.currentTime = 0; // Перемотка на начало
            // bellTickSound.pause(); 
            // bellTickSound.currentTime = 0; // Перемотка на начало
            endPoseSound.currentTime = 0;  // Перемотка на начало
            endPoseSound.play();
            endPoseSound.onended = () => { // Ждем завершения звука перед объявлением следующей позы
              if (currentTimerIndex !== null && currentTimerIndex + 1 < timers.length) {
                nextPoseAnnouncementRef.current = false; // Сбросим флаг для следующего таймера
                oneMinuteWarningRef.current = false; // Сбросим предупреждение за минуту
                speak(`Следующая поза ${timers[currentTimerIndex + 1]} минут.`, ['ru-RU'], ['Google русский']);
                speak(`Next pose ${timers[currentTimerIndex + 1]} minutes.`, ['en-US'], ['Google US English']);
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
      <div className='flex'>

        <div>
        <label>
          <input className="flex rounded-md p-2" type="text" value={input} onChange={handleInputChange} />
        {/* <button onClick={handlePauseResume} style={{ marginLeft: '10px' }}>
          {isPaused ? 'Продолжить' : 'Пауза'}
        </button> */}
        {/* <div className='desc-text w-100'>Введите интервалы таймера (3x3, 5x5, 3x7)</div> */}
        </label>
        </div>
        
        <div>
          {/* <h2>Выберите пресет</h2> */}
          <select 
            onChange={handlePresetSelect}
            style={{ padding: '10px', marginBottom:'0px' }}
            defaultValue=""
          >
            <option value="" disabled>Выберите пресет...</option>
            
            <optgroup label="Первый час">
              {timerPresets.group1.map((preset, index) => (
                <option 
                  key={`group1-${index}`} 
                  value={preset.join(', ')}
                >
                  {preset.join(', ')} ({calculateTotalTime(preset)})
                </option>
              ))}
            </optgroup>
            
            <optgroup label="Второй час">
              {timerPresets.group2.map((preset, index) => (
                <option 
                  key={`group2-${index}`} 
                  value={preset.join(', ')}
                >
                  {preset.join(', ')} ({calculateTotalTime(preset)})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
        <button onClick={handleStartTimers} className='flex text-white p-2 ml-3 rounded-full bg-neutral-800 hover:bg-neutral-700 hover:border-neutral-700 active:bg-green-500 active:border-green-500'><Play/></button>
        </div>

      </div>
      
        {/* Добавляем выпадающий список для пресетов с группами */}

        <div className='desc-text'>
          <h3>Итого: {summarizeIntervals(timers)}</h3>
        </div>

      <div className='mt-4 '>
        <h2 className='pb-2'>Таймеры</h2>
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

      {currentTimerIndex !== null && (
        <div className='desc-text'>
          <h2>Осталось времени: {formatTime(timeLeft)}</h2>
          {changePoseTimeLeft !== null && (
            <h3>Смена позы через: {changePoseTimeLeft} секунд</h3>
          )}
        </div>
      )}
    </div>
    </DndProvider>
  );
};
