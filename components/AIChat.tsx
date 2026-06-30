'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Source {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export default function AIChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hide on admin routes — the widget is for public visitors only.
  if (pathname?.startsWith('/jadmin')) return null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const send = async () => {
    const question = input.trim();
    if (!question || streaming) return;

    const userMsgId = `u_${Date.now()}`;
    const asstMsgId = `a_${Date.now() + 1}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: question },
      { id: asstMsgId, role: 'assistant', content: '' },
    ]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let errMsg = 'Алдаа гарлаа. Дахин оролдоно уу.';
        try {
          const j = await res.json();
          if (j?.error) errMsg = j.error;
        } catch {}
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId ? { ...m, content: errMsg } : m
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gotSources = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // First line may carry __SOURCES__<json>
        if (!gotSources) {
          const newlineIdx = buffer.indexOf('\n');
          if (newlineIdx !== -1) {
            const firstLine = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            gotSources = true;
            if (firstLine.startsWith('__SOURCES__')) {
              try {
                const sources: Source[] = JSON.parse(
                  firstLine.slice('__SOURCES__'.length)
                );
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, sources } : m
                  )
                );
              } catch {}
            } else {
              // No sources prefix — treat first line as content
              buffer = firstLine + '\n' + buffer;
            }
          }
        }

        if (gotSources && buffer.length > 0) {
          const chunk = buffer;
          buffer = '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsgId ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      }

      // Flush remaining buffer
      if (buffer.length > 0) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId ? { ...m, content: m.content + buffer } : m
          )
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI chat error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? { ...m, content: 'Сүлжээний алдаа. Дахин оролдоно уу.' }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-white font-medium transition-all hover:scale-105"
          style={{ backgroundColor: '#02251A' }}
          aria-label="AI туслахаас асуух"
        >
          <Sparkles className="h-5 w-5" style={{ color: '#C8FF00' }} />
          <span className="hidden sm:inline">AI-аас асуу</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex flex-col bg-white sm:rounded-2xl shadow-2xl border border-gray-200 sm:w-[400px] sm:h-[600px] sm:max-h-[calc(100vh-3rem)]">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 sm:rounded-t-2xl"
            style={{ backgroundColor: '#02251A', color: 'white' }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: '#C8FF00' }} />
              <span className="font-semibold">LIME AI туслах</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="Хаах"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8 px-4">
                <Sparkles
                  className="h-8 w-8 mx-auto mb-3"
                  style={{ color: '#02251A' }}
                />
                <p className="font-medium text-gray-700 mb-1">
                  LIME тусламжийн AI туслах
                </p>
                <p>
                  Сүлжээ, төлбөр, бүртгэл зэрэг асуудлаараа асуугаарай.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                  style={
                    m.role === 'user' ? { backgroundColor: '#02251A' } : undefined
                  }
                >
                  {m.role === 'assistant' && !m.content && streaming ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}

                  {m.role === 'assistant' &&
                    m.sources &&
                    m.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-1.5">
                          Эх сурвалж:
                        </p>
                        <div className="space-y-1">
                          {m.sources.slice(0, 3).map((s) => (
                            <a
                              key={s.id}
                              href={s.url}
                              className="block text-xs hover:underline truncate"
                              style={{ color: '#02251A' }}
                            >
                              → {s.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white sm:rounded-b-2xl">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Асуултаа бичнэ үү..."
                rows={1}
                disabled={streaming}
                className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#02251A]/30 focus:border-[#02251A] max-h-32"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                className="flex-shrink-0 p-2 rounded-xl text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: '#02251A' }}
                aria-label="Илгээх"
              >
                {streaming ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              AI хариулт нь зөвхөн нийтэлсэн нийтлэлд үндэслэнэ
            </p>
          </div>
        </div>
      )}
    </>
  );
}
