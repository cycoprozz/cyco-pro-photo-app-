import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onFileSelected: (base64: string, mimeType: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelected }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Extract base64 part only for the data, but we also have the full data URL
        const base64 = reader.result.split(',')[1];
        onFileSelected(base64, file.type || 'application/octet-stream');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div 
        className={`
          relative group cursor-pointer 
          border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
          ${dragActive 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-slate-600 hover:border-indigo-400 hover:bg-slate-800/50 bg-slate-800/30'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${dragActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400 group-hover:text-indigo-400 transition-colors'}`}>
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload your file</h3>
            <p className="text-slate-400 text-sm">
              Drag & drop or click to browse<br/>
              <span className="text-xs opacity-70">Supports any file type or codec</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50 pointer-events-none select-none">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-lg bg-slate-800 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
};