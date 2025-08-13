import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';

export default function InboxTest() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function test() {
      console.log('InboxTest: Starting query...');
      
      try {
        // Most basic query possible
        const { data: result, error: err } = await supabase
          .from('inbox_conversations')
          .select('id, participant_name')
          .limit(5);
        
        console.log('InboxTest result:', { result, err });
        
        if (err) {
          setError(err.message);
        } else {
          setData(result);
        }
      } catch (e: any) {
        console.error('InboxTest exception:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    
    test();
  }, []);

  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded">
      <h3 className="font-bold mb-2">Inbox Test Component</h3>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {data && (
        <div>
          <p className="text-green-600">Success! Found {data.length} items</p>
          {data.map((item: any) => (
            <p key={item.id} className="text-sm">{item.participant_name}</p>
          ))}
        </div>
      )}
    </div>
  );
}