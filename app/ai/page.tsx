'use client';
import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { Sparkles, Send, Mic, Camera } from 'lucide-react';

export default function AIPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hi! I am your Digital Bazar AI assistant. Tell me what you need - e.g., "Mujhe 2 bathroom ke liye plumbing material chahiye" or "I need waterproof outdoor paint"' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content })
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: JSON.stringify(data.response, null, 2), raw: data.response }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: 'Error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 80, maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: 'var(--brand)', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={18} /></div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700 }}>AI Shopping Assistant</h1>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Powered by OpenAI • Grounded in real catalog • Hinglish supported</div>
            </div>
          </div>

          <div className="card" style={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--brand)' : 'var(--surface-muted)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  padding: '10px 14px', borderRadius: 12, maxWidth: '85%', fontSize: '14px', whiteSpace: 'pre-wrap'
                }}>
                  {msg.role === 'assistant' && msg.raw?.type === 'shopping_list' ? (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{msg.raw.message}</div>
                      {msg.raw.items?.map((item: any, i: number) => (
                        <div key={i} style={{ background: 'var(--surface)', padding: 8, borderRadius: 6, marginBottom: 6, color: 'var(--text-primary)' }}>
                          <div style={{ fontWeight: 500 }}>{item.name} × {item.quantity} {item.unit}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.reason}</div>
                        </div>
                      ))}
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Add All to Cart (Review First)</button>
                    </div>
                  ) : msg.content}
                </div>
              ))}
              {loading && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI is thinking...</div>}
            </div>

            <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm"><Mic size={16} /></button>
              <button className="btn btn-ghost btn-sm"><Camera size={16} /></button>
              <input className="form-input" placeholder='Try: "Mujhe 500 bricks aur 10 cement chahiye"' value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={sendMessage}><Send size={16} /></button>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              'Mujhe 2 bathroom ke liye plumbing material chahiye',
              'I need waterproof outdoor wall paint',
              '500 bricks and 10 cement bags',
              'Which products are low in stock?',
            ].map(q=>(
              <button key={q} className="btn btn-secondary btn-sm" onClick={()=>{setInput(q);}}>{q}</button>
            ))}
          </div>

          <div className="card" style={{ marginTop: 16, padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 6 }}>AI Capabilities</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              • Smart Shopping List: Understands Hinglish, generates structured list with quantities<br/>
              • Natural Language Search: "waterproof outdoor paint" → structured filters → real catalog<br/>
              • Product Categorization: Auto-suggests category, size, material<br/>
              • Image Search: Upload photo → vision AI → matching products<br/>
              • Voice: Speech to text → intent → cart<br/>
              • Business Assistant: "Which products sold most?" → actual DB queries
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
