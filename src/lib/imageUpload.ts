/**
 * Convertit un fichier image local en data URL redimensionnée et compressée.
 *
 * L'image est redimensionnée sur un canvas (dimension max `maxDim`) puis
 * exportée en JPEG/PNG compressé : la data URL reste légère et peut être
 * enregistrée telle quelle (formulaire → API → SQLite).
 *
 * @param file  Fichier image choisi par l'utilisateur
 * @param maxDim Dimension maximale (largeur ou hauteur), pixels
 * @param quality Qualité JPEG (0 à 1)
 */
export function fileToResizedDataUrl(
  file: File,
  maxDim = 480,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error("Le fichier sélectionné n'est pas une image (PNG, JPG, WEBP…)."));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error("L'image est trop lourde (15 Mo maximum)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("L'image est invalide ou corrompue."));
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Le redimensionnement n'est pas supporté par ce navigateur."));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);

          const isPng = file.type === 'image/png';
          resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : quality));
        } catch {
          reject(new Error("Erreur lors du traitement de l'image."));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
