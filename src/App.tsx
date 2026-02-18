import { useEffect, useState } from 'react'
import nabrososhnayaLogo from './assets/nabrososhnaja-logo.png';
import './index.css';
import { Stopwatch }  from './components/Stopwatch'
import { Playlist } from './components/Playlist';
import { GestureFlowPage } from './pages/GestureFlow';
import { cn } from '@/lib/utils';

type Page = 'classic' | 'gestureflow';

function App() {
  const [page, setPage] = useState<Page>('gestureflow');
  const [classicTheme, setClassicTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", classicTheme === "dark");
  }, [classicTheme]);

  if (page === 'gestureflow') {
    return (
      <GestureFlowPage
        onSwitchToClassic={() => setPage('classic')}
        classicTheme={classicTheme}
        onChangeClassicTheme={setClassicTheme}
      />
    );
  }

  return (
    <div
      className={cn(
        "classic-page min-h-screen transition-colors",
        classicTheme === "dark"
          ? "classic-dark bg-zinc-950 text-zinc-100"
          : "classic-light bg-zinc-50 text-zinc-900"
      )}
    >
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
