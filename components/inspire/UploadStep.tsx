'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
};

export function UploadStep({ onUpload, isAnalyzing, selectedFile, previewUrl }: Props) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    };
  }, [pendingUrl]);

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    const url = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingUrl(url);
  }, [pendingUrl]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    disabled: isAnalyzing,
  });

  function handleReset() {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setPendingFile(null);
    setPendingUrl(null);
  }

  // Analyzing state — show preview with overlay
  if (isAnalyzing && (previewUrl || pendingUrl)) {
    const url = previewUrl ?? pendingUrl!;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Uploading..." className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <p className="text-white text-sm font-medium">Analyzing your image...</p>
          </div>
        </div>
      </div>
    );
  }

  // File selected — show preview + confirm
  if (pendingFile && pendingUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-6">
        <div className="relative w-72 h-72 rounded-2xl overflow-hidden shadow-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pendingUrl} alt={pendingFile.name} className="w-full h-full object-cover" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground truncate max-w-xs">{pendingFile.name}</p>
        </div>
        <Button
          size="lg"
          className="px-8"
          onClick={() => onUpload(pendingFile)}
        >
          Analyze with AI →
        </Button>
        <button
          onClick={handleReset}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Choose different image
        </button>
      </div>
    );
  }

  // Default dropzone
  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center min-h-[60vh] px-4 transition-colors ${
        isDragActive ? 'bg-primary/5' : ''
      }`}
    >
      <input {...getInputProps()} />
      <div
        className={`w-full max-w-lg rounded-3xl border-2 border-dashed transition-all duration-200 p-12 flex flex-col items-center gap-5 ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50'
        }`}
      >
        <div className={`rounded-full p-5 transition-colors ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
          <Camera className={`h-10 w-10 transition-colors ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>

        {isDragActive ? (
          <p className="text-2xl font-semibold text-primary">Drop it!</p>
        ) : (
          <>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold">Drop any image here</p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                A room you love, a sunset, a painting — anything that moves you
              </p>
            </div>
            <Button variant="outline" onClick={open} className="mt-2">
              Browse files
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF</p>
          </>
        )}
      </div>
    </div>
  );
}
