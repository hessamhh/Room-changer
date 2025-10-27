import React, { useRef, useState } from 'react';
import type { ImageFile } from '../types';
import { SparklesIcon, UploadIcon, CameraIcon, StopCircleIcon } from './icons';

interface ControlPanelProps {
  onGenerate: (image: ImageFile, prompt: string) => void;
  isLoading: boolean;
  onImageSelect: (image: ImageFile | null) => void;
  onScreenCapture: () => void;
  onRecapture: () => void;
  onStopCapture: () => void;
  isCapturing: boolean;
  originalImage: ImageFile | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  isLoading, 
  onImageSelect,
  onScreenCapture,
  onRecapture,
  onStopCapture,
  isCapturing,
  originalImage,
}) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage = {
          base64: reader.result as string,
          mimeType: file.type,
          name: file.name,
        };
        onImageSelect(newImage);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = () => {
    if (!originalImage) {
      setError('Please provide an image first.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please describe the theme you want.');
      return;
    }
    setError(null);
    onGenerate(originalImage, prompt);
  };
  
  return (
    <div className="bg-gray-800/30 p-6 rounded-lg shadow-lg border border-gray-700/50 backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left side: Prompt */}
        <div className="flex flex-col gap-3 h-full">
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the desired room style... e.g., enchanted forest, cyberpunk city"
            className="w-full flex-grow bg-gray-900/50 border border-gray-600 rounded-md p-3 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none min-h-[120px] md:min-h-full"
            rows={5}
          />
        </div>
        
        {/* Right side: Image Input */}
        <div className="flex flex-col gap-3">
          {isCapturing ? (
            <div className="flex flex-col gap-3 h-full justify-center">
               <button 
                  onClick={onRecapture} 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-all"
               >
                 <CameraIcon className="w-5 h-5" />
                 Recapture Frame
              </button>
              <button onClick={onStopCapture} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all">
                 <StopCircleIcon className="w-5 h-5" />
                 Stop Sharing
              </button>
            </div>
          ) : (
            <>
              <div 
                className="w-full h-full min-h-[100px] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-400 transition-all duration-300 cursor-pointer p-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <div className="text-center">
                  <UploadIcon className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Drop image or <span className="text-indigo-400">click to browse</span></p>
                </div>
              </div>
               <button 
                onClick={onScreenCapture}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-lg transition-all"
              >
                <CameraIcon className="w-5 h-5" />
                Or Capture Screen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom: Error and Generate Button */}
      <div className="mt-6">
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <button
          onClick={handleGenerateClick}
          disabled={isLoading || !originalImage || !prompt.trim()}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 disabled:from-indigo-900/50 disabled:to-cyan-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 text-lg"
        >
          {isLoading ? (
            'Generating...'
          ) : (
            <>
              <SparklesIcon className="w-6 h-6" />
              Change Environment
            </>
          )}
        </button>
      </div>
    </div>
  );
};
