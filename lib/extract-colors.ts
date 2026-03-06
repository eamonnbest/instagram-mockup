/**
 * Extract dominant colors from an image URL using canvas sampling.
 * Returns an array of hex color strings.
 */
export async function extractColors(imageUrl: string, count = 5): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const size = 50 // sample at small size for speed
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve([])
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const imageData = ctx.getImageData(0, 0, size, size).data

        // Simple k-means-ish: bucket colors and find most common
        const colorMap = new Map<string, number>()
        for (let i = 0; i < imageData.length; i += 4) {
          // Quantize to reduce color space (round to nearest 32)
          const r = Math.min(Math.round(imageData[i] / 32) * 32, 255)
          const g = Math.min(Math.round(imageData[i + 1] / 32) * 32, 255)
          const b = Math.min(Math.round(imageData[i + 2] / 32) * 32, 255)
          const key = `${r},${g},${b}`
          colorMap.set(key, (colorMap.get(key) || 0) + 1)
        }

        const sorted = [...colorMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, count)
          .map(([key]) => {
            const [r, g, b] = key.split(",").map(Number)
            return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
          })

        resolve(sorted)
      } catch {
        resolve([])
      }
    }
    img.onerror = () => resolve([])
    img.src = imageUrl
  })
}
