import React from 'react';
import { MagicWandIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="text-center mb-6">
      <div className="inline-flex items-center justify-center bg-indigo-500/10 p-3 rounded-full mb-4 border border-indigo-500/30">
        <MagicWandIcon className="w-8 h-8 text-indigo-400"/>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
        Image Environment Changer
      </h1>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto">
        Transform your room with a simple prompt. Capture your screen or upload an image to begin.
      </p>
    </header>
  );
};
