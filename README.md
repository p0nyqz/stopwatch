# Набросошная / GestureFlow

Таймер для художников — помогает практиковать наброски и рисование фигур с таймированными позами.

## Две версии интерфейса

- **Classic** — оригинальный интерфейс с пресетами в формате `NxM` (например, 8x30s), drag-and-drop, плейлистом Apple Music
- **GestureFlow** — новый дизайн с таймлайном сессии, вводом секунд через запятую, музыкальным плеером (заглушка)

Переключение между версиями — кнопки в углу экрана.

## Стек

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 4 + shadcn/ui (new-york)
- Framer Motion (`motion/react`)
- react-dnd (Classic)
- Web Speech API (двуязычные голосовые объявления)

## Запуск

```bash
npm install
npm run dev
```

## Скрипты

| Команда         | Описание                       |
|-----------------|--------------------------------|
| `npm run dev`   | Dev-сервер с HMR               |
| `npm run build` | TypeScript проверка + сборка   |
| `npm run lint`  | ESLint                         |
| `npm run preview` | Превью production-сборки     |

## Добавление shadcn компонентов

```bash
npx shadcn@latest add <component-name>
```

## Структура

```
src/
  App.tsx                        # Переключатель страниц
  index.css                      # Tailwind v4 тема + дизайн-токены
  lib/utils.ts                   # cn() утилита (shadcn)
  components/
    ui/                          # shadcn компоненты
    Stopwatch/                   # Classic — таймер
    Playlist/                    # Classic — Apple Music плейлист
    AudioManager/                # Хук для звуков
    TimerInput/                  # Classic — ввод таймеров
    TimerList/                   # Classic — список таймеров
  pages/
    GestureFlow/index.tsx        # GestureFlow — полная страница
  utils/utils.tsx                # Общие утилиты (parseTimers, speak, formatTime)
  assets/sounds/                 # Звуки (колокольчик, тикание и пр.)
```
