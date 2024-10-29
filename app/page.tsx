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
      // Ensure result items have required url property
      const validItems = result.map(item => ({
        ...item,
        url: item.url || '' // Provide default empty string if url is undefined
      }));
      setItems(validItems);
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
          className="flex items-center gap-1 mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200"
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
