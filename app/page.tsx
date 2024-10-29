"use client"
import { useState, useEffect } from 'react';
import { listItems } from '@/lib/s3';
import { Player } from '@/components/Player';
import { S3Item } from '@/types/s3-item';

const PASSWORD = 'podgorica';

export default function Home() {
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [items, setItems] = useState<S3Item[]>([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
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
    }
  }, [currentPrefix, isAuthenticated]);

  const goBack = () => {
    // Remove the last folder from the prefix
    const newPrefix = currentPrefix.split('/').slice(0, -2).join('/') + '/';
    setCurrentPrefix(newPrefix);
  };

  const handlePasswordSubmit = () => {
    if (password === PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (!isClient) {
    return null; // Render nothing on the server
  }

  if (!isAuthenticated) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-700">Enter Password</h1>
          <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 w-full mb-4"
              placeholder="Password"
            />
            <button 
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              type="submit"
            >
              Submit
            </button>
          </form>
        </div>
      </main>
    );
  }

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
