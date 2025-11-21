/**
 * Image Preprocessing Utilities สำหรับปรับปรุงความแม่นยำของ OCR
 */

/**
 * แปลง Data URL เป็น Image Element
 */
const dataURLToImage = (dataURL) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataURL
  })
}

/**
 * แปลง Image Element เป็น Canvas
 */
const imageToCanvas = (image) => {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  // เพิ่ม willReadFrequently เพื่อเพิ่มประสิทธิภาพเมื่ออ่านข้อมูลบ่อยๆ
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  return canvas
}

/**
 * ปรับ Contrast และ Brightness ของภาพ
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} contrast - ค่า contrast (0-2, default: 1.2)
 * @param {number} brightness - ค่า brightness (-100 to 100, default: 10)
 */
export const adjustContrastBrightness = (canvas, contrast = 1.2, brightness = 10) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
  const brightnessAdjust = brightness

  for (let i = 0; i < data.length; i += 4) {
    // R, G, B
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128 + brightnessAdjust))
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128 + brightnessAdjust))
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128 + brightnessAdjust))
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * แปลงภาพเป็น Grayscale
 */
export const toGrayscale = (canvas) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * เพิ่มความคมชัด (Sharpen) ให้กับภาพ - แบบเข้มข้น
 */
export const sharpen = (canvas, intensity = 1) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height

  // Sharpen kernel แบบเข้มข้น
  const kernel = [
    0, -1 * intensity, 0,
    -1 * intensity, 5 + (intensity * 2), -1 * intensity,
    0, -1 * intensity, 0
  ]

  const newData = new Uint8ClampedArray(data)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const kernelIdx = (ky + 1) * 3 + (kx + 1)
          r += data[idx] * kernel[kernelIdx]
          g += data[idx + 1] * kernel[kernelIdx]
          b += data[idx + 2] * kernel[kernelIdx]
        }
      }

      const idx = (y * width + x) * 4
      newData[idx] = Math.min(255, Math.max(0, r))
      newData[idx + 1] = Math.min(255, Math.max(0, g))
      newData[idx + 2] = Math.min(255, Math.max(0, b))
    }
  }

  ctx.putImageData(new ImageData(newData, width, height), 0, 0)
  return canvas
}

/**
 * Binarization ด้วย Otsu's Method - แปลงเป็นขาวดำเพื่อความคมชัด
 */
export const binarizeOtsu = (canvas) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height

  // คำนวณ histogram
  const histogram = new Array(256).fill(0)
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
    histogram[gray]++
  }

  // คำนวณ Otsu's threshold
  let total = width * height
  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i]
  }

  let sumB = 0
  let wB = 0
  let wF = 0
  let maxVariance = 0
  let threshold = 0

  for (let i = 0; i < 256; i++) {
    wB += histogram[i]
    if (wB === 0) continue
    wF = total - wB
    if (wF === 0) break

    sumB += i * histogram[i]
    let mB = sumB / wB
    let mF = (sum - sumB) / wF
    let variance = wB * wF * (mB - mF) * (mB - mF)

    if (variance > maxVariance) {
      maxVariance = variance
      threshold = i
    }
  }

  // แปลงเป็นขาวดำ
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
    const value = gray > threshold ? 255 : 0
    data[i] = value
    data[i + 1] = value
    data[i + 2] = value
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * ลดสัญญาณรบกวน (Noise Reduction) ด้วย Median Filter
 */
export const reduceNoise = (canvas) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height
  const newData = new Uint8ClampedArray(data)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      const neighbors = []

      // เก็บค่าเพื่อหาค่ามัธยฐาน
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nIdx = ((y + ky) * width + (x + kx)) * 4
          neighbors.push(data[nIdx]) // ใช้ค่า R (grayscale)
        }
      }

      // หาค่ามัธยฐาน
      neighbors.sort((a, b) => a - b)
      const median = neighbors[4] // ค่ากลาง

      newData[idx] = median
      newData[idx + 1] = median
      newData[idx + 2] = median
    }
  }

  ctx.putImageData(new ImageData(newData, width, height), 0, 0)
  return canvas
}

/**
 * ลบเส้นกรอบและเส้นตรง (Border/Line Removal)
 * ระมัดระวังมาก - ลบเฉพาะเส้นที่ยาวมากจริงๆ และไม่ลบข้อความที่อยู่ใกล้เส้น
 */
export const removeBorders = (canvas) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height
  const threshold = 120 // เพิ่ม threshold ให้สูงขึ้นเพื่อระมัดระวังมากขึ้น

  // เก็บตำแหน่งเส้นที่ต้องลบ (ไม่ลบทันทีเพื่อไม่ให้กระทบการตรวจสอบ)
  const linesToRemove = {
    vertical: new Set(),
    horizontal: new Set()
  }

  // ตรวจสอบและบันทึกเส้นตรงแนวตั้ง (vertical lines) - เข้มงวดมาก
  for (let x = 0; x < width; x++) {
    let consecutiveDark = 0
    let maxConsecutive = 0
    let totalDark = 0
    let startY = -1
    
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
      
      if (gray < threshold) {
        if (startY === -1) startY = y
        consecutiveDark++
        maxConsecutive = Math.max(maxConsecutive, consecutiveDark)
        totalDark++
      } else {
        consecutiveDark = 0
        startY = -1
      }
    }
    
    // เข้มงวดมาก - ลบเฉพาะเส้นที่ยาวมากจริงๆ (มากกว่า 95% ของความสูง)
    // และต้องมีจุดดำมากกว่า 90% เพื่อไม่ให้ลบข้อความที่อยู่ใกล้เส้นกรอบ
    if (maxConsecutive > height * 0.95 && totalDark > height * 0.9) {
      linesToRemove.vertical.add(x)
    }
  }

  // ตรวจสอบและบันทึกเส้นตรงแนวนอน (horizontal lines) - เข้มงวดมาก
  for (let y = 0; y < height; y++) {
    let consecutiveDark = 0
    let maxConsecutive = 0
    let totalDark = 0
    let startX = -1
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
      
      if (gray < threshold) {
        if (startX === -1) startX = x
        consecutiveDark++
        maxConsecutive = Math.max(maxConsecutive, consecutiveDark)
        totalDark++
      } else {
        consecutiveDark = 0
        startX = -1
      }
    }
    
    // เข้มงวดมาก - ลบเฉพาะเส้นที่ยาวมากจริงๆ (มากกว่า 95% ของความกว้าง)
    // และต้องมีจุดดำมากกว่า 90% เพื่อไม่ให้ลบข้อความที่อยู่ใกล้เส้นกรอบ
    if (maxConsecutive > width * 0.95 && totalDark > width * 0.9) {
      linesToRemove.horizontal.add(y)
    }
  }

  // ลบเฉพาะเส้นที่บันทึกไว้ (ไม่ลบพื้นที่รอบๆ)
  for (const x of linesToRemove.vertical) {
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4
      data[idx] = 255
      data[idx + 1] = 255
      data[idx + 2] = 255
    }
  }

  for (const y of linesToRemove.horizontal) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      data[idx] = 255
      data[idx + 1] = 255
      data[idx + 2] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Morphological Dilation - ขยายตัวอักษรให้หนาขึ้น
 */
export const dilate = (canvas, iterations = 1) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const width = canvas.width
  const height = canvas.height

  for (let iter = 0; iter < iterations; iter++) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newData = new Uint8ClampedArray(data)

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        let maxVal = data[idx]

        // หาค่าสูงสุดในเพื่อนบ้าน
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * width + (x + kx)) * 4
            maxVal = Math.max(maxVal, data[nIdx])
          }
        }

        newData[idx] = maxVal
        newData[idx + 1] = maxVal
        newData[idx + 2] = maxVal
      }
    }

    ctx.putImageData(new ImageData(newData, width, height), 0, 0)
  }

  return canvas
}

/**
 * Preprocess ภาพสำหรับ OCR - รวมทุกขั้นตอน (แบบเข้มข้น)
 * @param {string} imageDataURL - Data URL ของภาพ
 * @param {object} options - ตัวเลือกการ preprocessing
 * @returns {Promise<string>} - Data URL ของภาพที่ผ่านการปรับปรุงแล้ว
 */
export const preprocessImageForOCR = async (imageDataURL, options = {}) => {
  const {
    contrast = 1.5,
    brightness = 25,
    useGrayscale = true,
    useSharpen = true,
    useBinarize = true,
    useNoiseReduction = true,
    useDilate = false,
    useRemoveBorders = false, // ปิดการลบเส้นกรอบโดย default (เพื่อไม่ให้ลบข้อความที่อยู่ใกล้เส้น)
    scale = 1.0,
    mode = 'enhanced' // 'standard' หรือ 'enhanced'
  } = options

  try {
    // แปลง Data URL เป็น Image
    const image = await dataURLToImage(imageDataURL)
    
    // สร้าง Canvas
    let canvas = imageToCanvas(image)

    // Scale ภาพถ้าจำเป็น (สำหรับเพิ่มความละเอียด)
    if (scale !== 1.0) {
      const scaledCanvas = document.createElement('canvas')
      scaledCanvas.width = canvas.width * scale
      scaledCanvas.height = canvas.height * scale
      const scaledCtx = scaledCanvas.getContext('2d', { willReadFrequently: true })
      // ใช้ imageSmoothingEnabled = false เพื่อความคมชัด
      scaledCtx.imageSmoothingEnabled = false
      scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height)
      canvas = scaledCanvas
    }

    // ปรับ Contrast และ Brightness (ขั้นตอนแรก)
    adjustContrastBrightness(canvas, contrast, brightness)

    // แปลงเป็น Grayscale (ช่วยให้ OCR ทำงานได้ดีขึ้น)
    if (useGrayscale) {
      toGrayscale(canvas)
    }

    // ลดสัญญาณรบกวน (ทำก่อน sharpen)
    if (useNoiseReduction && mode === 'enhanced') {
      reduceNoise(canvas)
    }

    // เพิ่มความคมชัด (แบบเข้มข้น)
    if (useSharpen) {
      sharpen(canvas, mode === 'enhanced' ? 1.5 : 1.0)
    }

    // Binarization (แปลงเป็นขาวดำ) - สำหรับความคมชัดสูงสุด
    if (useBinarize && mode === 'enhanced') {
      binarizeOtsu(canvas)
    }

    // Morphological Dilation (ขยายตัวอักษร) - ใช้เฉพาะเมื่อจำเป็น
    if (useDilate && mode === 'enhanced') {
      dilate(canvas, 1)
    }

    // ลบเส้นกรอบ (ทำหลัง preprocessing อื่นๆ) - ปิดโดย default เพื่อไม่ให้ลบข้อความที่อยู่ใกล้เส้น
    if (useRemoveBorders) {
      removeBorders(canvas)
    }

    // แปลงกลับเป็น Data URL
    return canvas.toDataURL('image/png', 1.0)
  } catch (error) {
    console.error('Error preprocessing image:', error)
    // ถ้าเกิดข้อผิดพลาด ให้คืนค่าเดิม
    return imageDataURL
  }
}

