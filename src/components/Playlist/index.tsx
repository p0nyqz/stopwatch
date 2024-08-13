import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const playlists = [
  { 
    category: 'Набросошная',
    playlist: [ 
      { name: 'Набросошная', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F/pl.u-oZylMvYsGAe9rM" },
      { name: 'Universal', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-universal/pl.u-WabZlZ3He9XD1j" },
      { name: 'Active', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-active/pl.u-NpXmYYpC46Z3GP" },
      { name: 'Magic', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-magic/pl.u-jV899dJuDgkyWZ" },
      { name: 'Pop', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-pop/pl.u-8aAVoV9iv6GKyg" }
    ],
  },
  { 
    category: 'Unique',
    playlist: [ 
      { name: 'Ethnos', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-ethnos/pl.u-8aAVodeCv6GKyg" },
      { name: 'Retro', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-retro/pl.u-NpXmYqGI46Z3GP" },
      { name: 'Rap', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-rap/pl.u-8aAVXLjfv6GKyg" },
      { name: 'Classic', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-classic/pl.u-WabZlMjFe9XD1j" }
    ],
  },
  { 
    category: 'Electronic',
    playlist: [ 
      { name: 'Electronic', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-electronic/pl.u-WabZl9Gte9XD1j" },
      { name: 'Dance', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-dance/pl.u-gxblldmIbJXoKL" }
    ],
  },
  { 
    category: 'Rock',
    playlist: [ 
      { name: 'Rock', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-rock/pl.u-8aAVoGasv6GKyg" },
      { name: 'Modern Rock', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-modern-rock/pl.u-KVXBBPJtLyg3bk" },
      { name: 'Indie Rock', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-indie-rock/pl.u-GgA55dgFoklKP9" },
      { name: 'Classic Rock', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D1%81%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-classical-rock/pl.u-jV89e1DFDgkyWZ" },
      { name: 'Hardcore', link: "https://embed.music.apple.com/me/playlist/%D0%BD%D0%B0%D0%B1%D1%80%D0%BE%D1%81%D0%BE%D1%88%D0%BD%D0%B0%D1%8F-hardcore/pl.u-WabZZGAHe9XD1j" },
    ],
  },
];


export const Playlist: React.FC = () => {
  const [selectedPlaylist, setSelectedPlaylist] = useState(playlists[0].playlist[0].link);

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlaylist(e.target.value);
  };


  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <select onChange={handlePlaylistChange} 
      style={{ marginBottom: '20px', 
              padding: '10px', 
              paddingRight: '20px',
              borderRadius: '5px', 
              width: '100%',
              backgroundPositionX: '10px',
              // appearance: 'none',
              // WebkitAppearance: 'none',
              backgroundColor: '#ffffff',
              paddingRight: '40px',
              // background: 'url(../public/react.svg) no-repeat right 10px center'
              // background: `url(${ChevronDown}) no-repeat right 10px center`,
              }}>
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
      <div style={{ left: 0, width: '400px', height: '500px', position: 'relative' }}>
      <iframe
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        frameBorder="0"
        style={{ top: 0, left: 0, width: '100%', height: '100%', position: 'absolute', border: 0 }}
        allowFullScreen
        src={selectedPlaylist}
      ></iframe>
    </div>


      {/* <div style="left: 0; width: 100%; height: 800px; position: relative;">
        <iframe
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          frameBorder="0"
          height="460px"
          style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;"
          allowfullscreen
          // style={{ width: '100%', maxWidth: '600px', overflow: 'hidden', borderRadius: '10px' }}
          // sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          src={selectedPlaylist}
        ></iframe>
      </div> */}
    </div>
  );
};
