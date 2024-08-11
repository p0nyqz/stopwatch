// /src/components/AudioManager.tsx

// /src/components/AudioManager/index.tsx

// import { useEffect } from 'react';
import { loadSound } from '../../utils/utils';

const bellTickSound = loadSound('/bell-ticktock.wav');
const happyBellSound = loadSound('/happy-bells-notification.wav');

export const useAudioManager = () => {
  const playBellTickSound = () => {
    bellTickSound.play();
  };

  const playHappyBellSound = () => {
    happyBellSound.play();
  };

  const stopBellTickSound = () => {
    bellTickSound.pause();
    bellTickSound.currentTime = 0;
  };

  return {
    playBellTickSound,
    playHappyBellSound,
    stopBellTickSound,
  };
};




// import React, { useEffect } from 'react';

// const loadSound = (src) => {
//   const sound = new Audio(src);
//   sound.load();
//   return sound;
// };

// const bellTickSound = loadSound('/assets/bell-ticktock.wav');
// const happyBellSound = loadSound('/assets/happy-bells-notification.wav');

// export const AudioManager: React.FC<{ onTimeWarning: () => void, onEndOfTimer: () => void }> = ({ onTimeWarning, onEndOfTimer }) => {
//   useEffect(() => {
//     const interval = setInterval(() => {
//       // Логика работы с аудио
//       // Например, проверка времени и вызов onTimeWarning и onEndOfTimer
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   return null;
// };
