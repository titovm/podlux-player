"use client"

import { Fragment, useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Track } from '@/types/track';
import { S3Item } from '@/types/s3-item';
import { Howl } from 'howler';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download,
  Volume2,
  VolumeX 
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from "./ThemeToggle"

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
  const progressInterval = useRef<NodeJS.Timeout>();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const handleTrackEnd = useCallback(() => {
    const currentIndex = initialItems.findIndex(item => item.url === currentTrack?.url);
    if (currentIndex === -1) return;
    const isLastTrack = currentIndex === initialItems.length - 1;
    const nextIndex = isLastTrack ? 0 : currentIndex + 1;
    const nextTrack = initialItems[nextIndex];
    setCurrentTrack(nextTrack);
  }, [currentTrack, initialItems]);

  useEffect(() => {
    if (currentTrack) {
      // Stop and unload previous Howl instance
      if (soundRef.current) {
        soundRef.current.off(); // Remove all event handlers
        soundRef.current.stop();
        soundRef.current.unload();
        soundRef.current = null;
      }

      // Create new Howl instance
      const sound = new Howl({
        src: [currentTrack.url],
        volume: isMuted ? 0 : volume,
        onend: handleTrackEnd,
      });

      soundRef.current = sound;
      sound.play();
      setIsPlaying(true);

      // Update progress and duration
      const updateProgress = () => {
        if (sound.playing()) {
          setProgress(sound.seek() as number);
          setDuration(sound.duration());
        }
      };

      // Start progress interval
      progressInterval.current = setInterval(updateProgress, 1000);

      return () => {
        // Clean up
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = undefined;
        }
        if (soundRef.current) {
          soundRef.current.off();
          soundRef.current.stop();
          soundRef.current.unload();
          soundRef.current = null;
        }
      };
    }
  }, [currentTrack, handleTrackEnd, isMuted, volume]);

  const handlePlayPause = () => {
    if (soundRef.current) {
      if (isPlaying) {
        soundRef.current.pause();
        setIsPlaying(false);
      } else {
        soundRef.current.play();
        setIsPlaying(true);
      }
    }
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

  const skipTrack = (direction: 'prev' | 'next') => {
    if (!currentTrack) return;
    
    const currentIndex = initialItems.findIndex(t => t.url === currentTrack.url);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= initialItems.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = initialItems.length - 1;
    
    setCurrentTrack(initialItems[nextIndex]);
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
      setCurrentTrack(track);
    }
  };

  const handleDownload = async (e: React.MouseEvent, item: S3Item) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(item.url!);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = item.title;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (soundRef.current) {
      soundRef.current.volume(newVolume);
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (soundRef.current) {
      if (isMuted) {
        soundRef.current.volume(volume);
        setIsMuted(false);
      } else {
        soundRef.current.volume(0);
        setIsMuted(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Fragment>
      {/* Fixed player at top */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md z-50">
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-4 mb-2">
            {/* Left side: Playback controls */}
            <div className="flex gap-2 shrink-0">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => skipTrack('prev')}
                title="Previous"
                className="dark:hover:bg-gray-800"
              >
                <SkipBack size={24} className="dark:text-gray-200" />
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
                className="dark:hover:bg-gray-800"
              >
                {isPlaying ? <Pause size={24} className="dark:text-gray-200" /> : <Play size={24} className="dark:text-gray-200" />}
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => skipTrack('next')}
                title="Next"
                className="dark:hover:bg-gray-800"
              >
                <SkipForward size={24} className="dark:text-gray-200" />
              </Button>
            </div>
            
            {/* Middle: Track info and progress */}
            <div className="flex-1 min-w-0">
              {currentTrack ? (
                <>
                  <div className="text-sm font-medium truncate dark:text-gray-200">
                    {currentTrack.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {formatTime(progress)}
                    </span>
                    <div 
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="h-full bg-blue-500 dark:bg-blue-400 rounded"
                        style={{ width: `${(progress / duration) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {formatTime(duration)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No track selected
                </div>
              )}
            </div>

            {/* Right side: Volume control and theme toggle */}
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="dark:hover:bg-gray-800"
              >
                {isMuted ? (
                  <VolumeX size={24} className="dark:text-gray-200" />
                ) : (
                  <Volume2 size={24} className="dark:text-gray-200" />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable file list */}
      <div className="container mx-auto p-4 min-h-screen rounded-lg dark:bg-gray-900">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold dark:text-gray-200">Tracks</h2>
          {initialItems.map(item => (
            <div
              key={item.key}
              className={`flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded 
                ${currentTrack?.key === item.key ? 'bg-gray-100 dark:bg-gray-800' : ''} 
                ${item.type === 'folder' ? 'font-semibold' : ''} 
                dark:text-gray-200`}
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
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
