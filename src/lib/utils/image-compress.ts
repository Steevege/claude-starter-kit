/**
 * Compression d'image côté client avant envoi à l'API
 * Utilise Canvas HTML5 pour redimensionner et exporter en JPEG
 */

export interface CompressedImage {
  base64: string // Sans préfixe data:...;base64,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * Compresser une image File en base64 JPEG
 * - Redimensionne à maxWidth (conserve les proportions)
 * - Exporte en JPEG avec quality donnée
 */
export function compressImageToBase64(
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = () => {
      img.onload = () => {
        // Calculer les dimensions
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        // Dessiner sur un canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Exporter en JPEG base64
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]

        resolve({
          base64,
          mediaType: 'image/jpeg',
        })
      }

      img.onerror = () => reject(new Error('Impossible de charger l\'image'))
      img.src = reader.result as string
    }

    reader.onerror = () => reject(new Error('Impossible de lire le fichier'))
    reader.readAsDataURL(file)
  })
}
