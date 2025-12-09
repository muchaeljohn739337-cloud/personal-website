/**
 * Example: Using Supabase in Server Components
 *
 * This example demonstrates how to use Supabase in Next.js Server Components
 * to fetch data from your Supabase database.
 */

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function SupabaseServerExample() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Example: Fetch todos from Supabase
  const { data: todos, error } = await supabase.from('todos').select('*');

  if (error) {
    console.error('Error fetching todos:', error);
    return <div>Error loading todos</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todos (Server Component)</h1>
      <ul className="space-y-2">
        {todos?.map((todo) => (
          <li key={todo.id} className="p-2 border rounded">
            {todo.title || todo.name || JSON.stringify(todo)}
          </li>
        ))}
      </ul>
    </div>
  );
}
