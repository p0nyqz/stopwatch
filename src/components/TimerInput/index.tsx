// /src/components/TimerInput.tsx

import React from 'react';

interface TimerInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TimerInput: React.FC<TimerInputProps> = ({ input, onInputChange }) => {
  return (
    <input 
      type="text" 
      value={input} 
      onChange={onInputChange} 
      placeholder="5x3, 3x7, 1x10"
      className="p-4 h-12"
      style={{ width: '340px', borderRadius: '66px', borderColor: '#DADCE0' }}
    />
  );
};

// import React from 'react';

// export const TimerInput: React.FC<{ value: string, onChange: (value: string) => void, onStart: () => void }> = ({ value, onChange, onStart }) => {
//   return (
//     <div>
//       <input 
//         type="text" 
//         value={value} 
//         onChange={(e) => onChange(e.target.value)} 
//         placeholder="5x3, 3x7, 1x10"
//         className="p-4 h-12"
//         style={{ width: '340px', borderRadius: '66px', borderColor: '#DADCE0' }}
//       />
//       <button onClick={onStart}>Создать таймеры</button>
//     </div>
//   );
// };
