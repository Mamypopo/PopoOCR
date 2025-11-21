import * as pdfjsLib from 'pdfjs-dist'

// ตั้งค่า worker path สำหรับ pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

/**
 * แปลง PDF เป็นภาพ (หน้าแรก)
 * @param {File|ArrayBuffer|string} pdfFile - ไฟล์ PDF หรือ data URL
 * @param {number} pageNumber - หมายเลขหน้าที่ต้องการ (เริ่มที่ 1)
 * @param {number} scale - ขนาดการ scale (default: 4.0 สำหรับความละเอียดสูงสุด - เพิ่มขึ้นเพื่อความแม่นยำ OCR)
 * @returns {Promise<string>} - Data URL ของภาพ
 */
export const pdfToImage = async (pdfFile, pageNumber = 1, scale = 4.0) => {
  try {
    let pdfData
    
    // จัดการ input หลายรูปแบบ
    if (pdfFile instanceof File) {
      const arrayBuffer = await pdfFile.arrayBuffer()
      pdfData = { data: arrayBuffer }
    } else if (pdfFile instanceof ArrayBuffer) {
      pdfData = { data: pdfFile }
    } else if (typeof pdfFile === 'string') {
      // ถ้าเป็น data URL หรือ URL
      pdfData = pdfFile
    } else {
      throw new Error('รูปแบบไฟล์ PDF ไม่รองรับ')
    }

    // โหลด PDF document
    const loadingTask = pdfjsLib.getDocument(pdfData)
    const pdf = await loadingTask.promise

    // ตรวจสอบจำนวนหน้า
    const numPages = pdf.numPages
    if (pageNumber > numPages) {
      throw new Error(`PDF มี ${numPages} หน้า แต่ต้องการหน้า ${pageNumber}`)
    }

    // ดึงหน้าที่ต้องการ
    const page = await pdf.getPage(pageNumber)

    // สร้าง viewport
    const viewport = page.getViewport({ scale })

    // สร้าง canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    // Render หน้า PDF ลงบน canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    }

    await page.render(renderContext).promise

    // แปลง canvas เป็น data URL
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error converting PDF to image:', error)
    throw new Error(`ไม่สามารถแปลง PDF เป็นภาพได้: ${error.message}`)
  }
}

/**
 * แปลง PDF ทั้งหมดเป็นภาพ (ทุกหน้า)
 * @param {File|ArrayBuffer|string} pdfFile - ไฟล์ PDF
 * @param {number} scale - ขนาดการ scale
 * @returns {Promise<string[]>} - Array ของ Data URLs
 */
export const pdfToImages = async (pdfFile, scale = 2.0) => {
  try {
    let pdfData
    
    if (pdfFile instanceof File) {
      const arrayBuffer = await pdfFile.arrayBuffer()
      pdfData = { data: arrayBuffer }
    } else if (pdfFile instanceof ArrayBuffer) {
      pdfData = { data: pdfFile }
    } else if (typeof pdfFile === 'string') {
      pdfData = pdfFile
    } else {
      throw new Error('รูปแบบไฟล์ PDF ไม่รองรับ')
    }

    const loadingTask = pdfjsLib.getDocument(pdfData)
    const pdf = await loadingTask.promise
    const numPages = pdf.numPages

    const images = []
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const image = await pdfToImage(pdfFile, pageNum, scale)
      images.push(image)
    }

    return images
  } catch (error) {
    console.error('Error converting PDF pages to images:', error)
    throw error
  }
}

/**
 * ตรวจสอบว่าไฟล์เป็น PDF หรือไม่
 * @param {File} file - ไฟล์ที่ต้องการตรวจสอบ
 * @returns {boolean}
 */
export const isPDF = (file) => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

