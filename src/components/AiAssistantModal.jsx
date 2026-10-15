import React, { useState, useEffect, useRef } from 'react';
import { aiApi } from '../api/client';

export default function AiAssistantModal({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your MediCareBook AI Assistant. Describe your symptoms for specialty recommendations, or ask questions about booking and platform policies.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const responseCache = useRef({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingSeconds(0);
      interval = setInterval(() => {
        setLoadingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const cacheKey = query.toLowerCase();

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Check fast session cache
    if (responseCache.current[cacheKey]) {
      const cached = responseCache.current[cacheKey];
      setMessages((prev) => [
        ...prev,
        {
          ...cached,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const res = await aiApi.chat(query, user?.id || user?._id || null);
      const assistantMsg = {
        sender: 'assistant',
        text: res.data.reply,
        suggestedSpecialty: res.data.suggestedSpecialty,
        matchingDoctors: res.data.matchingDoctors || [],
        source: res.data.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      responseCache.current[cacheKey] = assistantMsg;
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I am currently unable to reach the AI navigation service. The cloud server may still be waking up. Please try asking again in a moment, or explore doctors directly via the Doctor Directory.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Which doctors are available?',
    'I have chest pain & palpitations',
    'How do I book an appointment?',
    'Red skin rash and severe itching',
    'What are the consultation fees?',
    'What is the cancellation policy?',
  ];

  const renderFormattedText = (text, isUser) => {
    if (!text) return null;
    return text.split('\n').map((line, lIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={lIdx} className="block min-h-[1.25em]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong
                  key={pIdx}
                  className={isUser ? 'font-bold text-white' : 'font-semibold text-slate-950'}
                >
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          aria-label="Open AI Healthcare Assistant"
        >
          <div className="relative">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </div>
          <span className="text-sm font-semibold tracking-wide">
            {isOpen ? 'Close Assistant' : 'MediCare AI'}
          </span>
          <svg className="w-5 h-5 text-emerald-100 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 h-[600px] animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-lg">
                AI
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  MediCareBook AI
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-medium border border-emerald-400/30">
                    RAG Active
                  </span>
                </h3>
                <p className="text-xs text-slate-300">Clinical Specialty & Navigation Guide</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Suggestions Pills */}
          <div className="bg-slate-50 border-b border-slate-200 p-2.5 overflow-x-auto flex gap-1.5 scrollbar-thin">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors shrink-0 shadow-2xs font-medium"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <div className="space-y-0.5">{renderFormattedText(msg.text, msg.sender === 'user')}</div>

                  {/* Matching Doctors preview badges if available */}
                  {msg.matchingDoctors && msg.matchingDoctors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <p className="text-xs font-semibold text-emerald-700">Verified Specialists:</p>
                      {msg.matchingDoctors.map((doc, dIdx) => (
                        <div
                          key={dIdx}
                          className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl px-2.5 py-1.5 font-medium flex items-center justify-between"
                        >
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block mt-1 text-[10px] ${
                      msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-slate-600 text-xs p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="flex space-x-1 shrink-0">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce"></div>
                </div>
                <span className="leading-tight">
                  {loadingSeconds < 3 && 'Analyzing clinical guidelines...'}
                  {loadingSeconds >= 3 && loadingSeconds < 12 && 'Waking up cloud server (Render free tier spin-up)...'}
                  {loadingSeconds >= 12 && 'Server almost ready, loading AI response...'}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe symptoms or ask about platform..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              MediCareBook AI provides navigation guidance only. Not clinical medical advice.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
