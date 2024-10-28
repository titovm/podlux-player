"use client"

import { useState, useRef, useEffect, Fragment } from 'react';
import { Button } from './ui/button';
import { Track } from '@/types/track';
import { S3Item } from '@/types/s3-item';
import { Howl } from 'howler';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download 
} from 'lucide-react';

interface PlayerProps {
  initialItems: S3Item[];
  onFolderClick?: (prefix: string) => void;
}

export function Player({ initialItems, onFolderClick }: PlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef<Howl | null>(null);
  const progressInterval = useRef<NodeJS.Timer>();

  const tracks: Track[] = initialItems
    .filter(item => item.type === 'file')
    .map(item => ({
      key: item.key,
      url: item.url!,
      title: item.title
    }));

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playTrack = (track: Track) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    soundRef.current?.stop();
    
    const sound = new Howl({
      src: [track.url],
      html5: true,
      format: ['mp3'],
      onplay: () => {
        setIsPlaying(true);
        setDuration(sound.duration());
        
        // Start progress tracking
        progressInterval.current = setInterval(() => {
          setProgress(sound.seek());
        }, 1000);
      },
      onpause: () => {
        setIsPlaying(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      },
      onstop: () => {
        setIsPlaying(false);
        setProgress(0);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      },
      onend: () => skipTrack('next'),
      onloaderror: (id, error) => console.error('Loading error:', error),
      onplayerror: (id, error) => console.error('Play error:', error),
    });

    soundRef.current = sound;
    setCurrentTrack(track);
    sound.play();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!soundRef.current || !duration) return;
    
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / bar.offsetWidth;
    const newPosition = duration * percent;
    
    soundRef.current.seek(newPosition);
    setProgress(newPosition);
  };

  const handlePlay = () => {
    if (!soundRef.current) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  const skipTrack = (direction: 'prev' | 'next') => {
    if (!currentTrack) return;
    
    const currentIndex = tracks.findIndex(t => t.key === currentTrack.key);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= tracks.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = tracks.length - 1;
    
    playTrack(tracks[nextIndex]);
  };

  const handleItemClick = (item: S3Item) => {
    if (item.type === 'folder') {
      onFolderClick?.(item.key);
    } else {
      const track = {
        key: item.key,
        url: item.url!,
        title: item.title
      };
      playTrack(track);
    }
  };

  const handleDownload = async (e: React.MouseEvent, item: S3Item) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(item.url!);
      const blob = await response.blob();
      
      // Create a temporary link element
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = item.title; // Set the filename
      
      // Append to document, click, and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Fragment>
      {/* Fixed player at top */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => skipTrack('prev')}
                title="Previous"
              >
                <SkipBack size={24} />
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={handlePlay}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => skipTrack('next')}
                title="Next"
              >
                <SkipForward size={24} />
              </Button>
            </div>
            
            {currentTrack && (
              <div className="flex-1">
                <div className="text-sm font-medium">{currentTrack.title}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{formatTime(progress)}</span>
                  <div 
                    className="flex-1 h-2 bg-gray-200 rounded cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="h-full bg-blue-500 rounded"
                      style={{ width: `${(progress / duration) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{formatTime(duration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable file list */}
      <div className="container mx-auto px-4 pt-24 pb-4 min-h-screen">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Tracks</h2>
          {initialItems.map(item => (
            <div
              key={item.key}
              className={`flex items-center justify-between hover:bg-gray-100 p-2 rounded ${
                currentTrack?.key === item.key ? 'bg-gray-100' : ''
              } ${item.type === 'folder' ? 'font-semibold' : ''}`}
            >
              <button
                onClick={() => handleItemClick(item)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                {item.type === 'folder' ? '📁' : '🎵'} {item.title}
              </button>
              {item.type === 'file' && (
                <button
                  onClick={(e) => handleDownload(e, item)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Download size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Fragment>
  );
}
