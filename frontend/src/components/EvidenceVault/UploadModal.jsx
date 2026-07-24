import React, { useState } from 'react';
import { X, UploadCloud, FileType, CheckCircle2 } from 'lucide-react';
import { uploadEvidence } from '../../services/api';
import { Dropdown } from '../UI/Dropdown';

const SOURCE_OPTIONS = [
  { value: 'whatsapp_export', label: 'WhatsApp Export' },
  { value: 'telegram_export', label: 'Telegram Export' },
  { value: 'pdf_document',    label: 'PDF Document' },
  { value: 'image_evidence',  label: 'Image Evidence' },
];

export const UploadModal = ({ onClose, onSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sourceType, setSourceType] = useState('whatsapp_export');

  const processUpload = async (file) => {
    setIsUploading(true);
    try {
      const response = await uploadEvidence(file, sourceType);
      onSuccess(response.data);
    } catch (error) {
      console.error("Upload failed", error);
      const detail = error.response?.data?.detail;
      const statusText = error.response?.statusText;
      const msg = detail || statusText || error.message || "Upload failed";
      alert(`Upload failed: ${msg}`);
      setIsUploading(false); // only reset on fail, on success unmount happens
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    await processUpload(files[0]);
  };

  const handleFileSelect = async (e) => {
    if (isUploading) return;
    const files = e.target.files;
    if (files.length === 0) return;
    await processUpload(files[0]);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', animation: 'fadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={{
        background: '#0d0d17',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.01)'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', letterSpacing: '0.01em' }}>Ingest Evidence</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>Upload local files to the intelligence platform.</div>
          </div>
          <button 
            onClick={!isUploading ? onClose : undefined}
            disabled={isUploading}
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--text-3)', 
              cursor: isUploading ? 'not-allowed' : 'pointer', padding: '4px', borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => !isUploading && (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => !isUploading && (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Source Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              <FileType size={14} /> Expected Source Format
            </label>
            <Dropdown 
              value={sourceType}
              onChange={setSourceType}
              options={SOURCE_OPTIONS}
              style={{ zIndex: 101 }}
            />
          </div>

          {/* Dropzone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && document.getElementById('evidenceUploadInput').click()}
            style={{
              border: `2px dashed ${isDragging ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
              background: isDragging ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)',
              borderRadius: '12px', padding: '40px 20px', textAlign: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <input 
              id="evidenceUploadInput" type="file" style={{ display: 'none' }}
              onChange={handleFileSelect} disabled={isUploading}
            />
            
            {isUploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', marginBottom: '4px' }}>Processing Evidence...</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Calculating SHA-256 and initiating ingestion.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: isDragging ? 1 : 0.7 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={24} color={isDragging ? '#60a5fa' : 'var(--text-2)'} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>Drag & drop evidence here</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>or click to browse local files</div>
                </div>
              </div>
            )}
          </div>

          {!isUploading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-4)' }}>
              <CheckCircle2 size={12} /> Secure local transfer. No data leaves this network.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
