import React, { useState, useRef, useEffect } from 'react';
import { askAssistant } from '../../services/api';
import { useInvestigation } from '../../context/InvestigationContext';
import { Shield, Paperclip, Send, Brain, Target, Search } from 'lucide-react';
import { Panel } from '../Dashboard/DashboardWidgets';
import { Dropdown } from '../UI/Dropdown';

const AIAvatar = () => (
  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Brain size={18} color="#60a5fa" />
  </div>
);

const UserAvatar = () => (
  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
    INV
  </div>
);

const TypingDots = () => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '8px 4px' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', animation: 'typingBounce 1s infinite ease-in-out', animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

const AIContent = ({ content, isLatest, onType }) => {
  const [displayed, setDisplayed] = useState(isLatest ? '' : content);
  
  useEffect(() => {
    if (!isLatest) {
      setDisplayed(content);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(content.slice(0, i));
      if (onType && i % 4 === 0) onType();
      i++;
      if (i > content.length) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [content, isLatest, onType]);

  const isTyping = isLatest && displayed.length < content.length;

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {displayed}
      {isTyping && <span style={{ display: 'inline-block', width: '6px', height: '14px', background: '#60a5fa', marginLeft: '4px', verticalAlign: 'middle', animation: 'cursorBlink 1s step-end infinite' }} />}
    </div>
  );
};

export default function Assistant() {
  const { evidenceList, selectedEvidenceId, setSelectedEvidenceId, selectedEvidenceItem, intelligence } = useInvestigation();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  const handleInput = (e) => {
    setInputValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const response = await askAssistant({
        question: userMessage.content,
        history: historyPayload,
        active_case_id: 'INV-2026-092',
        selected_evidence_id: selectedEvidenceId || null,
        conversation_id: 'session-1',
        case_wide_search: !selectedEvidenceId
      });
      setMessages(prev => [...prev, {
        role: 'ai',
        content: response.data.answer,
        confidence: response.data.confidence,
        sources: response.data.sources,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Error: Failed to connect to NETHRA Intelligence backend.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const evidenceOptions = [
    { value: 'NONE', label: '-- Ask general investigation questions --' },
    ...evidenceList.map(e => ({ value: e.evidence_id, label: e.original_filename }))
  ];

  return (
    <>
      <style>{`
        @keyframes typingBounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-4px); opacity: 1; } }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .asst-textarea::-webkit-scrollbar { width: 4px; }
        .asst-textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
      
      <div style={{ display: 'flex', flex: 1, padding: '24px 28px', gap: '20px', minHeight: '700px' }}>
        
        {/* Left Panel: Investigation Context */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ zIndex: 20, position: 'relative' }}>
            <Panel title="Investigation Context" icon={Target}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>Active Operation</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Operation Phantom</div>
                <div className="mono-sm" style={{ color: '#60a5fa', marginTop: '2px' }}>ID: INV-2026-092</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>Active Evidence Focus</div>
                <Dropdown 
                  value={selectedEvidenceId || 'NONE'}
                  onChange={val => setSelectedEvidenceId(val === 'NONE' ? null : val)}
                  options={evidenceOptions}
                  placeholder="Select evidence context..."
                />
              </div>

              {selectedEvidenceItem && (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px', wordBreak: 'break-all' }}>
                    {selectedEvidenceItem.original_filename}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
                    <span>Source:</span> <span style={{ color: 'var(--text-2)' }}>{selectedEvidenceItem.source_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)' }}>
                    <span>Entities Extracted:</span> <span style={{ color: 'var(--text-2)' }}>{intelligence?.entities?.length || 0}</span>
                  </div>
                </div>
              )}
            </Panel>
          </div>

          <div style={{ zIndex: 10, position: 'relative' }}>
            <Panel title="Suggested Actions" icon={Brain}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Summarize selected evidence', 'List extracted entities', 'Detect anomalies', 'Generate Investigation Report'].map((action, i) => (
                  <button key={i} onClick={() => { setInputValue(action); textareaRef.current?.focus(); }} style={{ textAlign: 'left', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.1)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                    {action}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* Center Panel: Assistant Conversation */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain size={18} color="#60a5fa" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.05em' }}>NETHRA Intelligence Assistant</span>
            </div>
            {selectedEvidenceItem && (
              <div style={{ fontSize: '11px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)' }}>
                Context: {selectedEvidenceItem.original_filename}
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.length === 0 && !isLoading && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <Search size={32} color="var(--text-3)" style={{ marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Ask a question about the current investigation or selected evidence.</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isLatestAI = msg.role === 'ai' && idx === messages.length - 1;
              const isUser = msg.role === 'user';
              
              return (
                <div key={idx} style={{ display: 'flex', gap: '16px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                  {isUser ? <UserAvatar /> : <AIAvatar />}
                  
                  <div style={{
                    maxWidth: '80%', padding: '16px 20px', borderRadius: '8px', fontSize: '14px', lineHeight: 1.6,
                    background: isUser ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                    border: isUser ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.05)',
                    color: isUser ? '#e2e8f0' : 'var(--text-1)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {isUser ? msg.content : <AIContent content={msg.content} isLatest={isLatestAI} onType={scrollToBottom} />}
                    
                    {!isUser && msg.confidence !== undefined && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Confidence: {Math.round(msg.confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <AIAvatar />
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', transition: 'border-color 0.2s' }}>
              <textarea
                ref={textareaRef}
                className="asst-textarea"
                placeholder={selectedEvidenceItem ? `Ask about ${selectedEvidenceItem.original_filename}...` : "Type your query here..."}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                disabled={isLoading}
                rows={1}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                  color: '#fff', fontSize: '14px', padding: '16px 50px 16px 16px', minHeight: '52px', maxHeight: '200px'
                }}
              />
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '8px' }}>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', padding: '8px', cursor: 'pointer', borderRadius: '6px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  title="Attach Evidence"
                >
                  <Paperclip size={16} />
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading || !inputValue.trim()}
                  style={{
                    background: inputValue.trim() ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                    color: inputValue.trim() ? '#fff' : 'var(--text-4)',
                    border: 'none', padding: '8px 12px', borderRadius: '6px',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '8px', textAlign: 'center' }}>
              NETHRA AI Investigation Assistant. Responses are AI-generated and should be verified against source evidence.
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
