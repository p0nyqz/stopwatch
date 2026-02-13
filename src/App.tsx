import { useState } from 'react'
import nabrososhnayaLogo from './assets/nabrososhnaja-logo.png';
import './index.css';
import { Stopwatch }  from './components/Stopwatch'
import { Playlist } from './components/Playlist';
import { GestureFlowPage } from './pages/GestureFlow';

type Page = 'classic' | 'gestureflow';

function App() {
  const [page, setPage] = useState<Page>('gestureflow');

  if (page === 'gestureflow') {
    return <GestureFlowPage onSwitchToClassic={() => setPage('classic')} />;
  }

  return (
    <div className="classic-page">
      <div className="flex pt-10 top-0">
        <div>
          <img
            src={nabrososhnayaLogo}
            alt="Набросошная"
            className="pt-5 mr-10 w-60"
          />
        </div>

        <div className="w-96">
          <Stopwatch/>
        </div>
        <div className="w-200">
          <Playlist />
        </div>
      </div>

      <button
        onClick={() => setPage('gestureflow')}
        className="fixed bottom-4 right-4 px-3 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        GestureFlow
      </button>
    </div>
  )
}

export default App
