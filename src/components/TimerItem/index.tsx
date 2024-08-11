// /src/components/TimerItem.tsx

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

interface TimerItemProps {
  timer: number;
  index: number;
  moveTimer: (fromIndex: number, toIndex: number) => void;
  onDelete: (index: number) => void;
  currentTimerIndex: number | null;
  timeLeft: number;
}

export const TimerItem: React.FC<TimerItemProps> = ({ timer, index, moveTimer, onDelete, currentTimerIndex, timeLeft }) => {
  const ref = React.useRef<HTMLDivElement>(null);

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


// import React, { useRef } from 'react';
// import { useDrag, useDrop } from 'react-dnd';

// interface TimerItemProps {
//   timer: number;
//   index: number;
//   moveTimer: (fromIndex: number, toIndex: number) => void;
//   onDelete: (index: number) => void;
//   currentTimerIndex: number | null;
//   timeLeft: number;
// }

// export const TimerItem: React.FC<TimerItemProps> = ({ timer, index, moveTimer, onDelete, currentTimerIndex, timeLeft }) => {
//   const ref = useRef<HTMLDivElement>(null);

//   const [, drop] = useDrop({
//     accept: 'timer',
//     hover(item: { index: number }) {
//       if (item.index !== index) {
//         moveTimer(item.index, index);
//         item.index = index;
//       }
//     },
//   });

//   const [{ isDragging }, drag] = useDrag({
//     type: 'timer',
//     item: { index },
//     collect: (monitor) => ({
//       isDragging: monitor.isDragging(),
//     }),
//   });

//   drag(drop(ref));

//   return (
//     <div 
//       ref={ref}
//       style={{
//         display: 'flex',
//         alignItems: 'center',
//         marginBottom: '10px',
//         opacity: isDragging ? 0.5 : 1,
//       }}
//     >
//       <div 
//         style={{
//           width: '200px',
//           height: '30px',
//           background: currentTimerIndex === index ? 'lightgreen' : 'lightgray',
//           position: 'relative',
//           overflow: 'hidden',
//           borderRadius: '5px',
//           marginRight: '10px',
//         }}
//       >
//         {currentTimerIndex === index && (
//           <div 
//             style={{
//               position: 'absolute',
//               top: 0,
//               left: 0,
//               height: '100%',
//               width: `${((timer * 60 - timeLeft) / (timer * 60)) * 100}%`,
//               background: 'green',
//               transition: 'width 1s linear'
//             }}
//           />
//         )}
//       </div>
//       <span style={{ marginLeft: '10px' }}>{timer} мин</span>
//       <button onClick={() => onDelete(index)} style={{ marginLeft: '10px' }}>Удалить</button>
//     </div>
//   );
// };
