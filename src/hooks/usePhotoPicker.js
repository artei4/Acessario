import { useCallback, useState } from 'react';
import { resizeImageFile } from '../utils/image.js';

/** Escolha de foto com redução de tamanho antes do envio (vira data URL JPEG). */
export function usePhotoPicker({ maxSize = 640 } = {}) {
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const pick = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('Escolha um arquivo de imagem.');
        return;
      }
      setProcessing(true);
      setError(null);
      try {
        setPhoto(await resizeImageFile(file, maxSize));
      } catch {
        setError('Não foi possível ler essa imagem.');
      } finally {
        setProcessing(false);
      }
    },
    [maxSize],
  );

  const clear = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  return { photo, error, processing, pick, clear };
}
