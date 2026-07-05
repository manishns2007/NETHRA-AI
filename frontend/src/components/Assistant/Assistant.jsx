import React, { useState, useRef, useEffect } from 'react';
import { askAssistant } from '../../services/api';

const Assistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    
    // Prepare history for API, excluding the current message
    const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Assuming askAssistant takes an object with question and history
      const response = await askAssistant({ question: userMessage.content, history: historyPayload });
      const aiMessage = { 
        role: 'ai', 
        content: response.data.answer, 
        confidence: response.data.confidence,
        sources: response.data.sources 
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Assistant Error:", error);
      const errorMessage = { 
        role: 'ai', 
        content: "Sorry, I encountered an error while processing your request. Please ensure the backend is running and API keys are configured." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-800 p-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-slate-200">AI Investigation Assistant</h2>
        <p className="text-sm text-slate-400">Ask questions about your digital evidence.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500">
            Start by asking a question about the evidence vault.
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {msg.role === 'ai' && msg.confidence !== undefined && (
                <div className="mt-2 text-xs font-medium text-emerald-400">
                  Confidence: {Math.round(msg.confidence * 100)}%
                </div>
              )}
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Sources</h4>
                  <ul className="text-xs space-y-1">
                    {msg.sources.map((src, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        <span className="font-medium text-indigo-300">{src.type}:</span> 
                        <span className="text-slate-300">
                          {src.title || src.name || src.id}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 rounded-lg rounded-bl-none p-4 flex items-center gap-2 border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="ml-2">Analyzing evidence...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="E.g., What emails are mentioned in the WhatsApp chat?"
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
