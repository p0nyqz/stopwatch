import React, { useState } from "react";
import { ChevronDown, Music2 } from "lucide-react";
import { Button as UiButton } from "@/components/ui/button";

const playlists = [
  {
    category: "Набросошная",
    playlist: [
      { name: "Music", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-music/pl.u-GgA5YYmUoklKP9" },
      { name: "Набросошная", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F/pl.u-oZylMvYsGAe9rM" },
      { name: "Universal", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-universal/pl.u-WabZlZ3He9XD1j" },
      { name: "Active", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-active/pl.u-NpXmYYpC46Z3GP" },
      { name: "Magic", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-magic/pl.u-jV899dJuDgkyWZ" },
      { name: "Pop", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-pop/pl.u-8aAVoV9iv6GKyg" }
    ],
  },
  {
    category: "Unique",
    playlist: [
      { name: "Ethnos", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-ethnos/pl.u-8aAVodeCv6GKyg" },
      { name: "Retro", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-retro/pl.u-NpXmYqGI46Z3GP" },
      { name: "Rap", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-rap/pl.u-8aAVXLjfv6GKyg" },
      { name: "Classic", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-classic/pl.u-WabZlMjFe9XD1j" }
    ],
  },
  {
    category: "Electronic",
    playlist: [
      { name: "Electronic", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-electronic/pl.u-WabZl9Gte9XD1j" },
      { name: "Dance", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-dance/pl.u-gxblldmIbJXoKL" }
    ],
  },
  {
    category: "Rock",
    playlist: [
      { name: "Rock", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-rock/pl.u-8aAVoGasv6GKyg" },
      { name: "Modern Rock", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-modern-rock/pl.u-KVXBBPJtLyg3bk" },
      { name: "Indie Rock", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-indie-rock/pl.u-GgA55dgFoklKP9" },
      { name: "Classic Rock", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D1%81%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-classical-rock/pl.u-jV89e1DFDgkyWZ" },
      { name: "Hardcore", link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-hardcore/pl.u-WabZZGAHe9XD1j" },
    ],
  },
];

type MusicProvider = "apple_music" | "yandex_music" | "vk_music" | "spotify";

const providerLabels: Record<MusicProvider, string> = {
  apple_music: "Apple Music",
  yandex_music: "Yandex Music",
  vk_music: "VK Music",
  spotify: "Spotify",
};

type Props = {
  compact?: boolean;
  onCollapse?: () => void;
};

export const Playlist: React.FC<Props> = ({ compact = false, onCollapse }) => {
  const [provider, setProvider] = useState<MusicProvider>("apple_music");
  const [selectedPlaylist, setSelectedPlaylist] = useState(playlists[0].playlist[0].link);
  const [authKey, setAuthKey] = useState("");

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlaylist(e.target.value);
  };

  if (!compact) {
    return (
      <div className="p-4 rounded-lg">
        <select
          className="p-2.5 rounded-lg"
          value={selectedPlaylist}
          onChange={handlePlaylistChange}
        >
          {playlists.map((group, index) => (
            <optgroup key={index} label={group.category}>
              {group.playlist.map((playlist, subIndex) => (
                <option key={subIndex} value={playlist.link}>
                  {playlist.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div style={{ left: 0, width: "400px", height: "500px", position: "relative" }}>
          <iframe
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            frameBorder="0"
            style={{ top: 0, left: 0, width: "100%", height: "100%", position: "absolute", border: 0 }}
            allowFullScreen
            src={selectedPlaylist}
            title="Apple Music Playlist"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 p-4 rounded-lg flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {onCollapse && (
          <UiButton
            variant="ghost"
            size="icon-sm"
            onClick={onCollapse}
            className="h-11 w-11 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 focus-visible:ring-1 focus-visible:ring-stone-300 focus-visible:ring-offset-0"
            title="Collapse music panel"
          >
            <Music2 size={16} />
          </UiButton>
        )}
        <div className="relative flex-1">
          <select
            className="h-11 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-3 pr-10 text-sm font-medium text-stone-700 shadow-sm outline-none transition focus:border-stone-300 focus:ring-1 focus:ring-stone-300"
            value={provider}
            onChange={(e) => setProvider(e.target.value as MusicProvider)}
          >
            <option value="apple_music">{providerLabels.apple_music}</option>
            <option value="yandex_music">{providerLabels.yandex_music}</option>
            <option value="vk_music">{providerLabels.vk_music}</option>
            <option value="spotify">{providerLabels.spotify}</option>
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
          />
        </div>
      </div>

      {provider === "apple_music" && (
        <div className="relative">
          <select
            className="h-11 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-3 pr-10 text-sm font-medium text-stone-700 shadow-sm outline-none transition focus:border-stone-300 focus:ring-1 focus:ring-stone-300"
            value={selectedPlaylist}
            onChange={handlePlaylistChange}
          >
            {playlists.map((group, index) => (
              <optgroup key={index} label={group.category}>
                {group.playlist.map((playlist, subIndex) => (
                  <option key={subIndex} value={playlist.link}>
                    {playlist.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
          />
        </div>
      )}

      {provider !== "apple_music" && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-3">
          <div className="text-sm font-semibold text-stone-700">{providerLabels[provider]} connection</div>
          <div className="text-xs text-stone-500">
            No built-in playlist embed configured for this provider yet. Connect account to load your playlists.
          </div>
          <input
            value={authKey}
            onChange={(e) => setAuthKey(e.target.value)}
            placeholder="Access token / session key"
            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-300 focus:ring-1 focus:ring-stone-300"
          />
          <UiButton
            variant="secondary"
            className="h-10 w-full rounded-lg bg-stone-900 text-white hover:bg-stone-800"
            onClick={() => {}}
            disabled={!authKey.trim()}
          >
            Connect Provider
          </UiButton>
        </div>
      )}

      <div
        className="relative flex-1 min-h-0 w-full overflow-hidden rounded-xl border border-stone-200 bg-white"
        style={compact ? { minHeight: 360 } : undefined}
      >
        {provider === "apple_music" ? (
          <iframe
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            frameBorder="0"
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            src={selectedPlaylist}
            title="Apple Music Playlist"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-stone-500">
            Authorize {providerLabels[provider]} to load playlists in this panel.
          </div>
        )}
      </div>
    </div>
  );
};
