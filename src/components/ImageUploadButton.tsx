import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { fileToResizedDataUrl } from '../lib/imageUpload';

interface ImageUploadButtonProps {
  /** Reçoit la data URL de l'image importée (redimensionnée/compressée) */
  onImage: (dataUrl: string) => void;
  /** Dimension maximale du redimensionnement (défaut 480px) */
  maxDim?: number;
  label?: string;
  className?: string;
}

/**
 * Bouton d'import d'une image depuis l'ordinateur : ouvre le sélecteur de
 * fichier, redimensionne l'image localement et transmet la data URL.
 */
export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImage,
  maxDim = 480,
  label = "Importer depuis l'ordinateur",
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const dataUrl = await fileToResizedDataUrl(file, maxDim);
      onImage(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de lecture du fichier.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        data-testid="image-upload-input"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Choisir une image depuis votre ordinateur"
        className={`inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 disabled:opacity-60 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${className}`}
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        <span>{busy ? 'Import…' : label}</span>
      </button>
      {error && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{error}</p>}
    </div>
  );
};
