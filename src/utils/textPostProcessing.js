/**
 * Text Post-Processing Utilities สำหรับปรับปรุงผลลัพธ์ OCR
 */

/**
 * ลบอักขระแปลกๆ ที่ดูไม่เหมือนข้อความจริง (เช่น &, [, ], |, #, » ที่อยู่คนเดียว)
 */
export const removeNoiseCharacters = (text) => {
  if (!text) return text
  
  // ลบอักขระแปลกๆ ที่อยู่คนเดียวหรือมีอัตราส่วนสูง
  // แต่เก็บไว้ถ้ามีตัวอักษรปกติอยู่ด้วย
  let cleaned = text
  
  // ลบอักขระพิเศษที่ดูไม่เหมือนข้อความ (เช่น &, [, ], |, #, », <, >) ที่มีอัตราส่วนสูง
  const specialChars = /[&\[\]|#»<>]/g
  const lines = cleaned.split('\n')
  
  const cleanedLines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.length === 0) return line
    
    // นับอักขระพิเศษ
    const specialCount = (trimmed.match(specialChars) || []).length
    const specialRatio = specialCount / trimmed.length
    
    // ถ้ามีอักขระพิเศษมากกว่า 30% และไม่มีตัวอักษรไทย/อังกฤษมากพอ
    const normalChars = (trimmed.match(/[ก-๙a-zA-Z0-9]/g) || []).length
    const normalRatio = normalChars / trimmed.length
    
    if (specialRatio > 0.3 && normalRatio < 0.3) {
      // ลบอักขระพิเศษเหล่านั้น
      return line.replace(specialChars, ' ').replace(/\s+/g, ' ').trim()
    }
    
    return line
  })
  
  return cleanedLines.join('\n')
}

/**
 * ลบบรรทัดที่ผิดปกติ (เช่นบาร์โค้ด, เส้นกรอบ) - แบบระมัดระวังมาก
 */
export const filterAbnormalLines = (text) => {
  if (!text) return text

  const lines = text.split('\n')
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim()
    if (trimmed.length === 0) return true // เก็บบรรทัดว่าง

    // ลบบรรทัดที่มีแต่ตัวเลขติดกันมากกว่า 12 ตัว (น่าจะเป็นบาร์โค้ด)
    // และต้องไม่มีตัวอักษรเลย
    if (/^\d{12,}$/.test(trimmed)) {
      return false
    }

    // ลบบรรทัดที่ดูเหมือนเส้นกรอบ (มีอักขระพิเศษซ้ำๆ เช่น |, _, -, =, ─, │)
    // เพิ่มเกณฑ์ให้เข้มงวดขึ้น - ลบเฉพาะกรณีที่แน่ใจว่าเป็นเส้นกรอบเท่านั้น
    const borderChars = (trimmed.match(/[|_\-=─│━┃┄┅┆┇┈┉┊┋┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┝┞┟┠┡┢┣┤┥┦┧┨┩┪┫┬┭┮┯┰┱┲┳┴┵┶┷┸┹┺┻┼┽┾┿╀╁╂╃╄╅╆╇╈╉╊╋╌╍╎╏═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬]/g) || []).length
    const borderCharRatio = borderChars / trimmed.length
    // เพิ่มเกณฑ์ให้เข้มงวดขึ้น - ลบเฉพาะกรณีที่มีอักขระเส้นกรอบมากกว่า 80% และไม่มีตัวอักษรปกติเลย
    if (borderCharRatio > 0.8 && !/[ก-๙a-zA-Z0-9]/.test(trimmed)) {
      return false
    }

    // ลบบรรทัดที่มีอักขระแปลกๆ เยอะมาก (มากกว่า 75%) และสั้นมาก (น้อยกว่า 10 ตัว)
    // และไม่มีตัวอักษรปกติเลย - เพิ่มเกณฑ์ให้เข้มงวดขึ้น
    const weirdChars = (trimmed.match(/[^\w\sก-๙\-\.\,\:\/\(\)]/g) || []).length
    const weirdCharRatio = weirdChars / trimmed.length
    if (weirdCharRatio > 0.75 && trimmed.length < 10 && !/[ก-๙a-zA-Z]/.test(trimmed)) {
      return false
    }

    // ลบบรรทัดที่มีแต่เครื่องหมายซ้ำๆ (เช่น | | | หรือ - - -)
    if (/^[\s|_\-=─│━┃┄┅┆┇┈┉┊┋┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┝┞┟┠┡┢┣┤┥┦┧┨┩┪┫┬┭┮┯┰┱┲┳┴┵┶┷┸┹┺┻┼┽┾┿╀╁╂╃╄╅╆╇╈╉╊╋╌╍╎╏═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬]+$/.test(trimmed)) {
      return false
    }

    // ลบบรรทัดที่มีอักขระพิเศษ (&, [, ], |, #, », <, >) มากกว่า 60% และไม่มีตัวอักษรปกติ
    // เพิ่มเกณฑ์ให้เข้มงวดขึ้น - ลบเฉพาะกรณีที่แน่ใจว่าไม่ใช่ข้อความจริง
    const specialChars = (trimmed.match(/[&\[\]|#»<>]/g) || []).length
    const specialCharRatio = specialChars / trimmed.length
    const normalChars = (trimmed.match(/[ก-๙a-zA-Z0-9]/g) || []).length
    if (specialCharRatio > 0.6 && normalChars < 3) {
      return false
    }

    // เก็บทุกอย่างอื่น (ไม่กรองมากเกินไป)
    return true
  })

  return filteredLines.join('\n')
}

/**
 * แก้ไขข้อผิดพลาดทั่วไปที่เกิดจาก OCR
 */
export const fixCommonOCRErrors = (text) => {
  if (!text) return text

  let fixed = text

  // แก้ไขข้อผิดพลาดเฉพาะ - ใช้เฉพาะกรณีที่แน่ใจเท่านั้น
  const safeFixes = [
    // แก้ไขเฉพาะกรณีที่แน่ใจ
    [/f23%9e3/g, 'f239e3'], // f23%9e3 -> f239e3
  ]

  // แก้ไขข้อผิดพลาดภาษาไทยที่พบบ่อย - ใช้เฉพาะกรณีที่แน่ใจ
  const thaiFixes = [
    // แก้ไขเฉพาะกรณีที่แน่ใจมาก
    [/เวิป/g, 'เว็บ'], // เวิป -> เว็บ
    [/เวป/g, 'เว็บ'], // เวป -> เว็บ
    [/f23%9e3/g, 'f239e3'], // f23%9e3 -> f239e3
  ]

  // ใช้การแก้ไขที่ปลอดภัย
  safeFixes.forEach(([pattern, replacement]) => {
    fixed = fixed.replace(pattern, replacement)
  })

  // ใช้การแก้ไขภาษาไทย (เฉพาะกรณีที่แน่ใจ)
  thaiFixes.forEach(([pattern, replacement]) => {
    fixed = fixed.replace(pattern, replacement)
  })

  // แก้ไขช่องว่างที่ผิดปกติ
  fixed = fixed.replace(/ {2,}/g, ' ') // หลายช่องว่าง
  fixed = fixed.replace(/\n{3,}/g, '\n\n') // หลายบรรทัดว่าง
  fixed = fixed.replace(/ \n/g, '\n') // ช่องว่างก่อนขึ้นบรรทัด
  fixed = fixed.replace(/\n /g, '\n') // ช่องว่างหลังขึ้นบรรทัด

  // แก้ไขเครื่องหมายวรรคตอน
  fixed = fixed.replace(/\.{2,}/g, '.') // หลายจุด
  fixed = fixed.replace(/\,{2,}/g, ',') // หลายจุลภาค

  return fixed.trim()
}

/**
 * ทำความสะอาดข้อความ
 */
export const cleanText = (text) => {
  if (!text) return text

  let cleaned = text

  // ลบอักขระควบคุมที่ไม่จำเป็น
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  // ลบอักขระแปลกๆ ที่ดูไม่เหมือนข้อความจริง
  cleaned = removeNoiseCharacters(cleaned)
  
  // แก้ไขช่องว่าง
  cleaned = cleaned.replace(/[\t\r]+/g, ' ')
  cleaned = cleaned.replace(/ {2,}/g, ' ')
  
  // แก้ไขบรรทัดใหม่
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  // ลบช่องว่างที่ต้นและท้ายบรรทัด
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n')
  
  // ลบบรรทัดว่างที่ต้นและท้าย
  cleaned = cleaned.replace(/^\n+|\n+$/g, '')

  // กรองบรรทัดที่ผิดปกติ (บาร์โค้ด, ข้อความแปลกๆ)
  cleaned = filterAbnormalLines(cleaned)

  return cleaned
}

/**
 * คำนวณคะแนนคุณภาพของข้อความ (ความยาว, ความหลากหลายของตัวอักษร)
 * เพิ่มการพิจารณาจำนวนตัวอักษรไทย
 */
export const calculateTextQuality = (text) => {
  if (!text || text.length === 0) return 0

  const trimmed = text.trim()
  if (trimmed.length === 0) return 0

  // นับจำนวนตัวอักษรไทย
  const thaiChars = (trimmed.match(/[ก-๙]/g) || []).length
  const thaiRatio = thaiChars / trimmed.replace(/\s/g, '').length

  // คะแนนพื้นฐานจากความยาว
  let score = Math.min(trimmed.length / 100, 1) * 25

  // คะแนนจากความหลากหลายของตัวอักษร
  const uniqueChars = new Set(trimmed.replace(/\s/g, '')).size
  score += Math.min(uniqueChars / 50, 1) * 25

  // คะแนนจากอัตราส่วนตัวอักษรต่อช่องว่าง (ไม่ควรมีช่องว่างมากเกินไป)
  const charRatio = trimmed.replace(/\s/g, '').length / trimmed.length
  score += charRatio * 15

  // คะแนนจากจำนวนบรรทัด (ไม่ควรมีบรรทัดว่างมากเกินไป)
  const lines = trimmed.split('\n').filter(line => line.trim().length > 0)
  const lineRatio = lines.length / Math.max(trimmed.split('\n').length, 1)
  score += lineRatio * 15

  // เพิ่มคะแนนถ้ามีตัวอักษรไทย (เพราะเราต้องการผลลัพธ์ที่มีภาษาไทย)
  if (thaiRatio > 0.1) {
    score += Math.min(thaiRatio * 20, 20) // เพิ่มคะแนนสูงสุด 20
  }

  return Math.min(score, 100)
}

/**
 * เปรียบเทียบผลลัพธ์ OCR หลายแบบและเลือกที่ดีที่สุด
 * ปรับให้เลือกผลลัพธ์ที่ยาวกว่า (ถ้า confidence ใกล้เคียง)
 */
export const selectBestOCRResult = (results) => {
  if (!results || results.length === 0) return null

  // คำนวณคะแนนสำหรับแต่ละผลลัพธ์
  const scoredResults = results.map(result => ({
    text: result.text,
    confidence: result.confidence || 0,
    quality: calculateTextQuality(result.text),
    length: result.text.trim().length,
    combinedScore: (result.confidence || 0) * 0.5 + calculateTextQuality(result.text) * 0.3 + Math.min(result.text.trim().length / 500, 1) * 20 // เพิ่มคะแนนจากความยาว
  }))

  // เรียงตามคะแนนรวม
  scoredResults.sort((a, b) => b.combinedScore - a.combinedScore)

  // เลือกผลลัพธ์ที่ดีที่สุด
  const best = scoredResults[0]

  // ถ้าผลลัพธ์ดีที่สุดสั้นเกินไป ให้ลองดูอันอื่น
  if (best.length < 50 && scoredResults.length > 1) {
    // หาผลลัพธ์ที่ยาวกว่า (ยาวกว่า 1.5 เท่า)
    const longerResults = scoredResults.filter(r => r.length >= best.length * 1.5)
    if (longerResults.length > 0) {
      // เลือกผลที่ยาวที่สุดที่มี confidence ใกล้เคียง (ไม่ต่ำกว่า 70% ของ best)
      const acceptableLonger = longerResults.filter(r => r.confidence >= best.confidence * 0.7)
      if (acceptableLonger.length > 0) {
        // เรียงตามความยาว
        acceptableLonger.sort((a, b) => b.length - a.length)
        return acceptableLonger[0].text
      }
    }
  }

  return best.text
}

/**
 * รวมข้อความจากหลายผลลัพธ์ OCR (ถ้าจำเป็น)
 */
export const mergeOCRResults = (results) => {
  if (!results || results.length === 0) return ''
  if (results.length === 1) return results[0].text

  // เลือกผลลัพธ์ที่ดีที่สุด
  return selectBestOCRResult(results)
}

