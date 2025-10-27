import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { ImageDisplay } from './components/ImageDisplay';
import { UploadIcon } from './components/icons';
import { editImage, detectRoomCoordinates, extendImageTo16x9 } from './services/geminiService';
import type { ImageFile } from './types';

function App() {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImage, setEditedImage] = useState<ImageFile | null>(null);
  const [originalImageAspectRatio, setOriginalImageAspectRatio] = useState<number | undefined>(undefined);
  const [editedImageAspectRatio, setEditedImageAspectRatio] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const streamRef = useRef<MediaStream | null>(null);

  const getImageAspectRatio = (imageFile: ImageFile): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img.width / img.height);
      };
      img.onerror = () => {
        resolve(16 / 9); // Default on error
      };
      img.src = imageFile.base64;
    });
  };

  const handleImageSelect = async (image: ImageFile | null) => {
    setError(null);
    setEditedImage(null);
    setEditedImageAspectRatio(undefined);
    setOriginalImage(image);
    
    if (image) {
      const ar = await getImageAspectRatio(image);
      setOriginalImageAspectRatio(ar);
    } else {
      setOriginalImageAspectRatio(undefined);
    }
    
    if (streamRef.current) {
      handleStopCapture(); // Stop capture if a file is uploaded
    }
  };

  const cropImageByCoords = (imageFile: ImageFile, box: { x: number; y: number; width: number; height: number; }): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = box.width;
        canvas.height = box.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
          const croppedBase64 = canvas.toDataURL(imageFile.mimeType);
          resolve({
            ...imageFile,
            base64: croppedBase64,
          });
        } else {
            reject(new Error("Could not get canvas context for cropping."));
        }
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for cropping."));
      };
      img.src = imageFile.base64;
    });
  };

  const captureFrame = async () => {
    setError(null);
    if (!streamRef.current) {
        setError("No active screen capture session.");
        return;
    }
    
    setIsLoading(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setError("Could not get canvas context.");
        setIsLoading(false);
        return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const mimeType = 'image/jpeg';
    const base64 = canvas.toDataURL(mimeType);
    
    const fullImage: ImageFile = {
        base64,
        mimeType,
        name: 'screenshot.jpg',
    };

    try {
        const coords = await detectRoomCoordinates(fullImage);
        const smartCroppedImage = await cropImageByCoords(fullImage, coords);
        setOriginalImage(smartCroppedImage);
        const ar = await getImageAspectRatio(smartCroppedImage);
        setOriginalImageAspectRatio(ar);
        setEditedImage(null);
        setEditedImageAspectRatio(undefined);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError('Failed to process screen capture.');
      setOriginalImage(fullImage); // Fallback to full image if smart crop fails
      const ar = await getImageAspectRatio(fullImage);
      setOriginalImageAspectRatio(ar);
    } finally {
        setIsLoading(false);
    }
  };

  const handleScreenCapture = async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true, audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        video.play();
        setIsCapturing(true);
        video.onloadedmetadata = () => {
            captureFrame();
        };
    } catch (err) {
        console.error("Error starting screen capture:", err);
        setError("Could not start screen capture. Please grant permission.");
        setIsCapturing(false);
    }
  };
  
  const handleStopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const handleGenerate = async (image: ImageFile, prompt: string) => {
    setIsLoading(true);
    setEditedImage(null);
    setEditedImageAspectRatio(undefined);
    setError(null);
    try {
      // Step 1: Transform the original image with the new theme
      const transformedImage = await editImage(image, prompt);

      // Step 2: Check aspect ratio of the transformed image
      const aspectRatio = await getImageAspectRatio(transformedImage);
      const targetAspectRatio = 16 / 9;

      let finalImage = transformedImage;
      // Step 3: If not 16:9, extend it
      if (Math.abs(aspectRatio - targetAspectRatio) > 0.01) {
        finalImage = await extendImageTo16x9(transformedImage);
      }
      
      setEditedImage(finalImage);
      const finalAr = await getImageAspectRatio(finalImage);
      setEditedImageAspectRatio(finalAr);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage.base64;
    
    const fileExtension = editedImage.mimeType.split('/')[1] || 'png';
    const originalFileName = originalImage?.name.split('.')[0] || 'image';
    
    link.download = `${originalFileName}-edited.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ImagePlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center text-gray-500 p-4">
      <p className="text-center">Capture or upload an image to begin</p>
    </div>
  );
  
  const EditedImagePlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center text-gray-500">
      <p className="text-center">Your transformed image will appear here</p>
    </div>
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-start">
            <ImageDisplay 
              label="Original"
              image={originalImage}
              isLoading={isLoading && !originalImage}
              placeholder={<ImagePlaceholder />}
              aspectRatio={originalImageAspectRatio}
            />
            <ImageDisplay
              label="Transformed"
              image={editedImage}
              isLoading={isLoading && !!originalImage && !editedImage}
              placeholder={<EditedImagePlaceholder />}
              onDownload={handleDownload}
              aspectRatio={editedImageAspectRatio}
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-center" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <ControlPanel 
            onGenerate={handleGenerate}
            isLoading={isLoading}
            onImageSelect={handleImageSelect}
            onScreenCapture={handleScreenCapture}
            onRecapture={captureFrame}
            onStopCapture={handleStopCapture}
            isCapturing={isCapturing}
            originalImage={originalImage}
          />
        </main>
      </div>
    </div>
  );
}

export default App;