// /src/utils/utils.ts

export const loadSound = (src: string): HTMLAudioElement => {
  const sound = new Audio(src);
  sound.load();
  return sound;
};

export const parseTimers = (input: string): number[] => {
  const timers = input.split(',').map(timer => {
    const [count, duration] = timer.trim().split('x').map(Number);
    return Array(count).fill(duration);
  }).flat();
  return timers;
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours > 0 ? `${hours}h ` : ''}${remainingMinutes}m`;
};

export const speak = (text: string, lang: string = 'ru-RU', voiceName: string = 'Google русский') => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const voices = speechSynthesis.getVoices();
  const selectedVoice = voices.find(voice => voice.name === voiceName);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  speechSynthesis.speak(utterance);
};


// // Парсинг строки с таймерами в массив чисел
// export const parseTimers = (input: string): number[] => {
//   const timers = input.split(',').map(timer => {
//     const [count, duration] = timer.trim().split('x').map(Number);
//     return Array(count).fill(duration);
//   }).flat();
//   return timers;
// };

// // Форматирование времени в часы и минуты
// export const formatTime = (minutes: number): string => {
//   const hours = Math.floor(minutes / 60);
//   const remainingMinutes = minutes % 60;

//   return `${hours > 0 ? `${hours}h ` : ''}${remainingMinutes}m`;
// };

// // Преобразование текста в речь
// export const speak = (text: string, lang: string = 'ru-RU', voiceName: string = 'Google русский') => {
//   const utterance = new SpeechSynthesisUtterance(text);
//   utterance.lang = lang;

//   const voices = speechSynthesis.getVoices();
//   const selectedVoice = voices.find(voice => voice.name === voiceName);

//   if (selectedVoice) {
//     utterance.voice = selectedVoice;
//   }

//   speechSynthesis.speak(utterance);
// };

// // Загрузка и воспроизведение звука
// export const loadSound = (src: string): HTMLAudioElement => {
//   const sound = new Audio(src);
//   sound.load();
//   return sound;
// };
