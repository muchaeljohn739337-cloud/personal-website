/**
 * Example: Using Supabase in Client Components
 *
 * This example demonstrates how to use Supabase in Next.js Client Components
 * to fetch and interact with data from your Supabase database.
 */

'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

interface Todo {
  id: string;
  title?: string;
  name?: string;
  completed?: boolean;
  [key: string]: unknown;
}

export default function SupabaseClientExample() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase.from('todos').select('*');

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          setTodos(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch todos');
        console.error('Error fetching todos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading todos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todos (Client Component)</h1>
      <ul className="space-y-2">
        {todos.length === 0 ? (
          <li className="p-2 text-gray-500">No todos found</li>
        ) : (
          todos.map((todo) => (
            <li key={todo.id} className="p-2 border rounded">
              {todo.title || todo.name || JSON.stringify(todo)}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
