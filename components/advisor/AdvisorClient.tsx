'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'What style would suit my living room?',
  'How should I arrange my bedroom furniture?',
  'What colors pair well with walnut wood?',
  'Suggest a color palette for a cozy reading nook',
  'Which items on my wishlist should I prioritize?',
  'How can I make a small space feel larger?',
  'What plants work well in low-light rooms?',
  'How do I mix Mid-Century Modern with Scandinavian styles?',
];

function getMessageText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts) return '';
  return msg.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('');
}

export function AdvisorClient() {
  const [mode, setMode] = useState<'quick' | 'deep'>('quick');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/advisor/chat',
        body: { mode },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]
  );

  const { messages, sendMessage, status } = useChat({ transport });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isStreaming = status === 'streaming' || status === 'submitted';

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSuggestion(s: string) {
    setInput(s);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" /> Design Advisor
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI design advice powered by your home data (local Ollama)
          </p>
        </div>
        {/* Mode toggle */}
        <div className="flex rounded-md border overflow-hidden text-sm">
          {(['quick', 'deep'] as const).map((m) => (
            <button key={m}
              className={`px-3 py-1.5 transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => setMode(m)}>
              {m === 'quick' ? '⚡ Quick' : '🔍 Deep'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm text-center py-8">
              Ask me anything about your home decor, furniture arrangement, or style choices.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSuggestion(s)}
                  className="text-left text-sm border rounded-lg p-3 hover:bg-muted transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {getMessageText(msg as unknown as { parts?: Array<{ type: string; text?: string }> })}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{getMessageText(msg as unknown as { parts?: Array<{ type: string; text?: string }> })}</p>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-4 py-3 text-sm text-muted-foreground animate-pulse">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about furniture, color palettes, room layout..."
          className="resize-none"
          rows={2}
          disabled={isStreaming}
        />
        <Button onClick={handleSend} disabled={!input.trim() || isStreaming} className="h-full px-4">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
