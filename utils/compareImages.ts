import html2canvas from 'html2canvas'
import pixelmatch from 'pixelmatch'

// Normalize LaTeX by removing extra spaces and normalizing some common variations
function normalizeLatex(latex: string): string {
  return latex
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .trim()
}

// Quick check for basic LaTeX equivalence before pixel comparison
function quickCheck(latex1: string, latex2: string): boolean {
  const norm1 = normalizeLatex(latex1)
  const norm2 = normalizeLatex(latex2)
  return norm1 === norm2
}

export async function compareRenderedLatex(
  element1: HTMLElement, 
  element2: HTMLElement,
  latex1: string,
  latex2: string
): Promise<boolean> {
  try {
    // First do a quick text comparison with normalized LaTeX
    if (quickCheck(latex1, latex2)) {
      return true
    }

    // Get the computed styles
    const style1 = window.getComputedStyle(element1)
    const style2 = window.getComputedStyle(element2)

    // Check if basic properties match
    if (style1.fontSize !== style2.fontSize ||
        style1.fontFamily !== style2.fontFamily) {
      return false
    }

    // Strict width check - must be exactly equal
    if (element1.offsetWidth !== element2.offsetWidth) {
      return false
    }

    // Strict height check - must be exactly equal
    if (element1.offsetHeight !== element2.offsetHeight) {
      return false
    }

    // Capture screenshots of both elements with higher quality settings
    const canvas1 = await html2canvas(element1, {
      backgroundColor: null,
      scale: 2, // Higher scale for better accuracy
      logging: false,
      removeContainer: true,
      useCORS: true,
      allowTaint: true
    })
    const canvas2 = await html2canvas(element2, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      removeContainer: true,
      useCORS: true,
      allowTaint: true
    })

    // Strict dimension check for rendered output
    if (canvas1.width !== canvas2.width || 
        canvas1.height !== canvas2.height) {
      return false
    }

    // Get image data
    const ctx1 = canvas1.getContext('2d')
    const ctx2 = canvas2.getContext('2d')
    
    if (!ctx1 || !ctx2) return false

    const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height)
    const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height)

    // Use pixelmatch with stricter settings
    const diff = pixelmatch(
      imageData1.data,
      imageData2.data,
      null,
      canvas1.width,
      canvas1.height,
      { 
        threshold: 0.1,      // Stricter threshold
        includeAA: true,     // Include anti-aliased pixels
        alpha: 0.5,          // Stricter alpha tolerance
        diffColor: [255, 0, 0],  // Red for debugging
        aaColor: [255, 255, 0],  // Yellow for debugging
      }
    )

    // Much stricter tolerance - almost exact match required
    // Allow only 0.1% of pixels to be different (for anti-aliasing)
    const totalPixels = canvas1.width * canvas1.height
    const tolerance = Math.max(1, Math.floor(totalPixels * 0.001))
    
    return diff <= tolerance
  } catch (error) {
    console.error('Error comparing images:', error)
    return false
  }
}

