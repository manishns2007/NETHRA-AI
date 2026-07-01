import React, { useState } from 'react';
import { uploadEvidence } from '../../services/api';

export default function EvidenceUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sourceType, setSourceType] = useState('whatsapp_export');

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    await processUpload(files[0]);
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    await processUpload(files[0]);
  };

  const processUpload = async (file) => {
    setIsUploading(true);
    try {
      const response = await uploadEvidence(file, sourceType);
      onUploadSuccess(response.data);
    } catch (error) {
      console.error("Upload failed", error);
      alert(error.response?.data?.detail || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-4 mb-4">
        <label className="text-slate-300">Source Type:</label>
        <select 
          value={sourceType} 
          onChange={(e) => setSourceType(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-slate-100 rounded px-3 py-1 outline-none focus:border-blue-500"
        >
          <option value="whatsapp_export">WhatsApp Export</option>
          <option value="telegram_export">Telegram Export</option>
          <option value="pdf_document">PDF Document</option>
          <option value="image_evidence">Image Evidence</option>
        </select>
      </div>

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileUpload').click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragging ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-slate-600 bg-slate-800 hover:border-slate-400'
        }`}
      >
        <input 
          id="fileUpload" 
          type="file" 
          className="hidden" 
          onChange={handleFileSelect}
        />
        {isUploading ? (
          <span className="text-blue-400 animate-pulse font-semibold">Calculating SHA-256 and Securing Evidence...</span>
        ) : (
          <span className="text-slate-300">Drag and drop evidence files here, or click to browse.</span>
        )}
      </div>
    </div>
  );
}
