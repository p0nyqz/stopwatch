import { useState } from 'react'
import reactLogo from './assets/react.svg'
import nabrososhnayaLogo from './assets/nabrososhnaja-logo.png';
import './index.css';
import './App.css'
import { Stopwatch }  from './components/Stopwatch'
import { Playlist } from './components/Playlist';
// import { SWatch } from './components/SWatch';

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
    {/* <SWatch /> */}
    <div className='flex flex-row'>

    </div>
    <div className="flex pt-10 top-0">
      <div>
      <img
          src={nabrososhnayaLogo}
          alt="Набросошная"
          className="pt-10 mr-10 w-60" // Добавьте отступ снизу, если нужно // Настройка размера логотипа
        />
      </div>

      <div className="w-100">
      <Stopwatch/>
      </div>
      <div className="w-200">
      <Playlist />
      </div>
    </div>

      {/* <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p> */}
      </>
  )
}

export default App
