import React from 'react';
import type { ImageFile } from '../types';
import { Spinner } from './Spinner';
import { DownloadIcon } from './icons';

interface ImageDisplayProps {
  label: string;
  image: ImageFile | null;
  isLoading: boolean;
  placeholder?: React.ReactNode;
  onDownload?: () => void;
  aspectRatio?: number;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ label, image, isLoading, placeholder, onDownload, aspectRatio }) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-center text-gray-300">{label}</h2>
      <div 
        className="relative w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700"
        style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : '16 / 9' }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 z-10">
            <Spinner />
          </div>
        ) : image ? (
          <>
            <img
              src={image.base64}
              alt={label}
              className="w-full h-full object-cover"
            />
            {onDownload && (
              <button
                onClick={onDownload}
                className="absolute top-3 right-3 p-2 bg-gray-900/50 hover:bg-gray-900/80 rounded-full text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                aria-label="Download image"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          placeholder
        )}
      </div>
    </div>
  );
};