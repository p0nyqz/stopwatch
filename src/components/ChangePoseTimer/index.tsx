// /src/components/ChangePoseTimer.tsx

import React from 'react';

interface ChangePoseTimerProps {
  changePoseTimeLeft: number | null;
}

export const ChangePoseTimer: React.FC<ChangePoseTimerProps> = ({ changePoseTimeLeft }) => {
  if (changePoseTimeLeft === null) return null;

  return (
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
  );
};
// import React from 'react';

// export const ChangePoseTimer: React.FC<{ timeLeft: number }> = ({ timeLeft }) => {
//   return (
//     <div style={{ marginTop: '20px', width: '100%', height: '30px', backgroundColor: 'lightgray', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
//       <div 
//         style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           height: '100%',
//           width: `${(20 - timeLeft) / 20 * 100}%`,
//           backgroundColor: 'orange',
//           transition: 'width 1s linear'
//         }}
//       />
//     </div>
//   );
// };
