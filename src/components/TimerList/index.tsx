// /src/components/TimerList.tsx

import React from 'react';
import { TimerItem } from '../TimerItem';

interface TimerListProps {
  timers: number[];
  moveTimer: (fromIndex: number, toIndex: number) => void;
  onDelete: (index: number) => void;
  currentTimerIndex: number | null;
  timeLeft: number;
}

export const TimerList: React.FC<TimerListProps> = ({ timers, moveTimer, onDelete, currentTimerIndex, timeLeft }) => {
  return (
    <div style={{ marginTop: '20px' }}>
      {timers.map((timer, index) => (
        <TimerItem 
          key={index}
          index={index}
          timer={timer}
          moveTimer={moveTimer}
          onDelete={onDelete}
          currentTimerIndex={currentTimerIndex}
          timeLeft={timeLeft}
        />
      ))}
    </div>
  );
};


// import React from 'react';
// import { TimerItem } from '../TimerItem';

// export const TimerList: React.FC<{ timers: number[], currentTimerIndex: number | null, timeLeft: number, onDeleteTimer: (index: number) => void, onPause: () => void, isPaused: boolean }> = ({ timers, currentTimerIndex, timeLeft, onDeleteTimer, onPause, isPaused }) => {
//   return (
//     <div style={{ marginTop: '20px' }}>
//       {timers.map((timer, index) => (
//         <TimerItem 
//           key={index}
//           index={index}
//           timer={timer}
//           currentTimerIndex={currentTimerIndex}
//           timeLeft={timeLeft}
//           onDelete={onDeleteTimer}
//         />
//       ))}
//       {currentTimerIndex !== null && (
//         <button onClick={onPause} style={{ marginTop: '10px' }}>
//           {isPaused ? 'Продолжить' : 'Пауза'}
//         </button>
//       )}
//     </div>
//   );
// };
