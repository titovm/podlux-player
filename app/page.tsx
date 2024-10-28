"use client"
import { useState, useEffect } from 'react';
import { listItems } from '@/lib/s3';
import { Player } from '@/components/Player';
import { S3Item } from '@/types/s3-item';

export default function Home() {
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [items, setItems] = useState<S3Item[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const result = await listItems(currentPrefix);
      setItems(result);
    };
    
    fetchItems();
  }, [currentPrefix]);

  const goBack = () => {
    // Remove the last folder from the prefix
    const newPrefix = currentPrefix.split('/').slice(0, -2).join('/') + '/';
    setCurrentPrefix(newPrefix);
  };

  return (
    <main className="container mx-auto pt-20">
      <h1 className="text-2xl font-bold my-4">MP3 Player</h1>
      {currentPrefix && (
        <button
          onClick={goBack}
          className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2"
        >
          ⬅️ Back
        </button>
      )}
      <Player 
        initialItems={items} 
        onFolderClick={(prefix) => setCurrentPrefix(prefix)} 
      />
    </main>
  );
}
