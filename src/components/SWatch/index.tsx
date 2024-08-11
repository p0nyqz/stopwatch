import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TimerInput } from '../TimerInput';
import { TimerList } from '../TimerList';
import { ChangePoseTimer } from '../ChangePoseTimer';
import { useAudioManager } from '../AudioManager';
import { parseTimers, formatTime, speak } from '../../utils/utils';

export const SWatch: React.FC = () => {
  const [input, setInput] = useState('');
  const [timers, setTimers] = useState<number[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTimerIndex, setCurrentTimerIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [changePoseTimeLeft, setChangePoseTimeLeft] = useState<number | null>(null);
  const oneMinuteWarningRef = useRef(false); // Для предотвращения повторного предупреждения
  const nextPoseAnnouncementRef = useRef(false); // Для предотвращения повторного объявления следующей позы

  const audioManager = useAudioManager();

  const moveTimer = (fromIndex: number, toIndex: number) => {
    const newTimers = [...timers];
    const [movedTimer] = newTimers.splice(fromIndex, 1);
    newTimers.splice(toIndex, 0, movedTimer);
    setTimers(newTimers);
  };

  const onDelete = (index: number) => {
    const newTimers = [...timers];
    newTimers.splice(index, 1);
    setTimers(newTimers);
  };

  useEffect(() => {
    setTotalTime(timers.reduce((acc, curr) => acc + curr, 0));
  }, [timers]);

  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval>;

    if (!isPaused && timers.length > 0 && currentTimerIndex !== null) {
      timerInterval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime > 0) {
            return prevTime - 1;
          } else {
            if (currentTimerIndex < timers.length - 1) {
              setCurrentTimerIndex(currentTimerIndex + 1);
              setChangePoseTimeLeft(20);
              audioManager.playHappyBellSound();
              nextPoseAnnouncementRef.current = false;
              oneMinuteWarningRef.current = false;
              return timers[currentTimerIndex + 1] * 60;
            } else {
              setCurrentTimerIndex(null);
              audioManager.playHappyBellSound();
              return 0;
            }
          }
        });
      }, 1000);
    }

    return () => clearInterval(timerInterval);
  }, [isPaused, currentTimerIndex, timers, audioManager]);

  useEffect(() => {
    if (timers.length > 0 && currentTimerIndex === null) {
      setCurrentTimerIndex(0);
      setTimeLeft(timers[0] * 60);
    }
  }, [timers]);

  useEffect(() => {
    if (changePoseTimeLeft !== null && changePoseTimeLeft > 0) {
      const changePoseInterval = setInterval(() => {
        setChangePoseTimeLeft((prevTime) => {
          if (prevTime && prevTime > 0) return prevTime - 1;
          return null;
        });
      }, 1000);

      return () => clearInterval(changePoseInterval);
    }
  }, [changePoseTimeLeft]);

  useEffect(() => {
    if (timeLeft === 60 && !oneMinuteWarningRef.current) {
      speak('Одна минута осталась');
      oneMinuteWarningRef.current = true;
    }
    if (timeLeft <= 10 && !nextPoseAnnouncementRef.current) {
      audioManager.playBellTickSound();
      nextPoseAnnouncementRef.current = true;
    }
  }, [timeLeft, audioManager]);

  useEffect(() => {
    if (currentTimerIndex !== null && currentTimerIndex < timers.length && timeLeft === 0) {
      audioManager.stopBellTickSound();
      if (currentTimerIndex < timers.length - 1) {
        speak(`Следующая поза ${timers[currentTimerIndex + 1]} минут`);
      }
    }
  }, [timeLeft, currentTimerIndex, timers, audioManager]);

  const handleStartPause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsPaused(true);
    setCurrentTimerIndex(null);
    setTimeLeft(0);
    setChangePoseTimeLeft(null);
    oneMinuteWarningRef.current = false;
    nextPoseAnnouncementRef.current = false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = () => {
    setTimers(parseTimers(input));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <TimerInput input={input} onInputChange={handleInputChange} />
        <button onClick={handleSubmit}>Сохранить</button>
        <div style={{ marginTop: '20px' }}>Общее время: {formatTime(totalTime)}</div>
        <ChangePoseTimer changePoseTimeLeft={changePoseTimeLeft} />
        <TimerList 
          timers={timers} 
          moveTimer={moveTimer} 
          onDelete={onDelete} 
          currentTimerIndex={currentTimerIndex} 
          timeLeft={timeLeft} 
        />
        <div>
          <button onClick={handleStartPause}>
            {isPaused ? 'Старт' : 'Пауза'}
          </button>
          <button onClick={handleReset}>Сброс</button>
        </div>
      </div>
    </DndProvider>
  );
};