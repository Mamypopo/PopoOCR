import { createWorker } from 'tesseract.js'
import { useState, useEffect, useRef } from 'react'
import { Loader2, X } from 'lucide-react'
import { preprocessImageForOCR } from '../utils/imagePreprocessing'
import { cleanText, fixCommonOCRErrors, selectBestOCRResult } from '../utils/textPostProcessing'

const OCRProcessor = ({ image, isPDF = false, onResult, onError, onCancel }) => {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const workerRef = useRef(null)
  const isCancelledRef = useRef(false)

  useEffect(() => {
    if (!image) return

    const processOCR = async () => {
      setIsProcessing(true)
      setProgress(0)
      setStatus('กำลังเริ่มต้น...')
      isCancelledRef.current = false

      try {
        // Preprocess ภาพก่อน OCR (โดยเฉพาะ PDF) - แบบเข้มข้น
        let processedImage = image
        if (isPDF) {
          setStatus('กำลังปรับปรุงภาพสำหรับ OCR...')
          // ใช้ preprocessing แบบเบาเพื่อไม่ให้ตัวอักษรเสียหาย
          processedImage = await preprocessImageForOCR(image, {
            contrast: 1.3,           // ลด contrast (ไม่เข้มเกินไป)
            brightness: 15,          // ลด brightness (ไม่สว่างเกินไป)
            useGrayscale: true,      // ใช้ grayscale
            useSharpen: true,        // เพิ่มความคมชัด (แบบเบา)
            useBinarize: false,      // ไม่ใช้ binarization (อาจทำให้ตัวอักษรเสียหาย)
            useNoiseReduction: false, // ไม่ใช้ noise reduction (อาจทำให้ตัวอักษรเสียหาย)
            useDilate: false,        // ไม่ใช้ dilation
            useRemoveBorders: false, // ไม่ลบเส้นกรอบ (เพื่อไม่ให้ลบข้อความที่อยู่ใกล้เส้น)
            scale: 1.0,              // ไม่ scale เพิ่ม (เพราะ PDF scale แล้ว)
            mode: 'standard'         // ใช้โหมด standard (เบากว่า)
          })
          setProgress(20)
        } else {
          // สำหรับภาพปกติก็ใช้ preprocessing แบบเบา
          setStatus('กำลังปรับปรุงภาพสำหรับ OCR...')
          processedImage = await preprocessImageForOCR(image, {
            contrast: 1.3,
            brightness: 15,
            useGrayscale: true,
            useSharpen: true,
            useBinarize: false,
            useNoiseReduction: false,
            useRemoveBorders: false, // ไม่ลบเส้นกรอบ (เพื่อไม่ให้ลบข้อความที่อยู่ใกล้เส้น)
            mode: 'standard'
          })
          setProgress(10)
        }

        // ตรวจสอบว่าถูกยกเลิกหรือไม่
        if (isCancelledRef.current) {
          setIsProcessing(false)
          return
        }

        setStatus('กำลังโหลด OCR Engine...')
        // สร้าง Worker พร้อมตั้งค่า OCR Engine Mode ตั้งแต่เริ่มต้น (ต้องตั้งในช่วง initialization)
        // OEM 1 = LSTM_ONLY (ดีกับภาษาไทย)
        const worker = await createWorker('tha+eng', 1, {
          logger: (m) => {
            // กรอง warnings ที่ไม่จำเป็นออก (Parameter not found, Estimating resolution, Detected diacritics)
            if (m.status === 'recognizing text') {
              const baseProgress = isPDF ? 20 : 10
              const ocrProgress = Math.round(m.progress * 60) // 60% สำหรับ OCR
              setProgress(baseProgress + ocrProgress)
              setStatus(`กำลังประมวลผล OCR... ${baseProgress + ocrProgress}%`)
            } else if (m.status && !m.status.includes('Parameter not found') && 
                       !m.status.includes('Estimating resolution') && 
                       !m.status.includes('Detected') &&
                       !m.status.includes('Warning')) {
              // แสดงเฉพาะ status ที่สำคัญ (ไม่แสดง warnings)
              setStatus(m.status)
            }
          },
        })
        
        workerRef.current = worker

        // ตรวจสอบว่าถูกยกเลิกหรือไม่
        if (isCancelledRef.current) {
          await worker.terminate()
          setIsProcessing(false)
          return
        }

        // Multi-PSM Mode Testing - ลองหลาย PSM modes แล้วเลือกผลที่ดีที่สุด
        // สำหรับภาษาไทย: ใช้หลาย PSM modes เพื่อให้จับข้อความได้มากที่สุด
        // PSM 3 = Auto (ดีกับเอกสารทั่วไป)
        // PSM 4 = Single Column (ดีกับเอกสารที่มีคอลัมน์)
        // PSM 6 = Single Block (ดีกับภาษาไทย)
        // PSM 11 = Sparse Text (ดีกับข้อความกระจัดกระจาย)
        const psmModes = isPDF 
          ? ['3', '4', '6'] // สำหรับ PDF: Auto, Single Column, Single Block (เพิ่ม modes เพื่อจับข้อความได้มากขึ้น)
          : ['3', '4', '6'] // สำหรับภาพ: Auto, Single Column, Single Block

        setStatus('กำลังทดสอบหลายโหมด OCR...')
        const ocrResults = []

        for (let i = 0; i < psmModes.length; i++) {
          // ตรวจสอบว่าถูกยกเลิกหรือไม่
          if (isCancelledRef.current) {
            await worker.terminate()
            setIsProcessing(false)
            return
          }

          const psmMode = psmModes[i]
          const progressStart = isPDF ? 20 : 10
          const progressPerMode = 60 / psmModes.length
          const currentProgress = progressStart + (i * progressPerMode)

          setStatus(`กำลังทดสอบโหมด ${i + 1}/${psmModes.length} (PSM ${psmMode})...`)
          setProgress(currentProgress)

          try {
            // ตั้งค่า parameters (ไม่รวม tessedit_ocr_engine_mode เพราะต้องตั้งในช่วง initialization)
            await worker.setParameters({
              tessedit_pageseg_mode: psmMode,
              tessedit_char_whitelist: '', // ไม่จำกัดตัวอักษร (รองรับทั้งไทยและอังกฤษ)
              preserve_interword_spaces: '1', // รักษาช่องว่างระหว่างคำ
              // เพิ่ม parameters สำหรับภาษาไทย
              tessedit_create_hocr: '0', // ไม่สร้าง hOCR
              tessedit_create_tsv: '0', // ไม่สร้าง TSV
              // ปรับแต่งสำหรับภาษาไทย
              classify_bln_numeric_mode: '0', // ไม่จำกัดเฉพาะตัวเลข
              textord_min_linesize: '2.5', // ขนาดบรรทัดขั้นต่ำ (เหมาะกับภาษาไทย)
            })

            const result = await worker.recognize(processedImage)
            const text = result.data.text.trim()
            const confidence = result.data.confidence || 0

            if (text.length > 0) {
              ocrResults.push({
                text: text,
                confidence: confidence,
                psmMode: psmMode
              })
            }
          } catch (err) {
            console.warn(`PSM ${psmMode} failed:`, err)
          }
        }

        // ตรวจสอบว่าถูกยกเลิกหรือไม่
        if (isCancelledRef.current) {
          await worker.terminate()
          setIsProcessing(false)
          return
        }

        // เลือกผลลัพธ์ที่ดีที่สุด
        setStatus('กำลังเลือกผลลัพธ์ที่ดีที่สุด...')
        setProgress(85)

        let finalText = ''
        if (ocrResults.length > 0) {
          // ใช้ text post-processing เพื่อเลือกผลที่ดีที่สุด
          // แต่ถ้ามีหลายผลลัพธ์ ให้เลือกผลที่ยาวที่สุด (ถ้า confidence ใกล้เคียง)
          const bestResult = selectBestOCRResult(ocrResults)
          
          // ถ้าผลลัพธ์ที่ดีที่สุดสั้นเกินไป ให้ลองหาผลที่ยาวกว่า
          if (bestResult && bestResult.length < 100 && ocrResults.length > 1) {
            const longerResults = ocrResults
              .map(r => ({ text: r.text, length: r.text.length, confidence: r.confidence }))
              .filter(r => r.length > bestResult.length * 1.5) // ยาวกว่า 1.5 เท่า
              .sort((a, b) => b.length - a.length)
            
            if (longerResults.length > 0 && longerResults[0].confidence >= 30) {
              finalText = longerResults[0].text
            } else {
              finalText = bestResult
            }
          } else {
            finalText = bestResult || ocrResults[0].text
          }
        } else {
          // ถ้าไม่มีผลลัพธ์เลย ให้ลองอีกครั้งด้วย PSM 6
          setStatus('กำลังลองอีกครั้งด้วยโหมดมาตรฐาน...')
          await worker.setParameters({
            tessedit_pageseg_mode: '6',
            tessedit_char_whitelist: '',
            preserve_interword_spaces: '1',
            textord_min_linesize: '2.5',
          })
          const result = await worker.recognize(processedImage)
          finalText = result.data.text.trim()
        }

        // ตรวจสอบว่าถูกยกเลิกหรือไม่
        if (isCancelledRef.current) {
          await worker.terminate()
          setIsProcessing(false)
          return
        }

        // Post-process ข้อความ
        setStatus('กำลังปรับปรุงข้อความ...')
        setProgress(90)
        
        finalText = cleanText(finalText)
        finalText = fixCommonOCRErrors(finalText)
        
        // ตรวจสอบอีกครั้งก่อนส่งผลลัพธ์
        if (isCancelledRef.current) {
          await worker.terminate()
          setIsProcessing(false)
          return
        }
        
        setStatus('เสร็จสิ้น!')
        setProgress(100)
        onResult(finalText)
        
        await worker.terminate()
        workerRef.current = null
      } catch (error) {
        // ถ้าถูกยกเลิก ไม่ต้องแสดง error
        if (isCancelledRef.current) {
          setIsProcessing(false)
          return
        }
        console.error('OCR Error:', error)
        onError(error.message || 'เกิดข้อผิดพลาดในการประมวลผล OCR')
      } finally {
        if (!isCancelledRef.current) {
          setIsProcessing(false)
        }
      }
    }

    processOCR()

    // Cleanup function
    return () => {
      isCancelledRef.current = true
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => {})
        workerRef.current = null
      }
    }
  }, [image, isPDF, onResult, onError])

  if (!isProcessing) return null

  const handleCancel = async () => {
    isCancelledRef.current = true
    setStatus('กำลังยกเลิก...')
    if (workerRef.current) {
      try {
        await workerRef.current.terminate()
      } catch (err) {
        console.warn('Error terminating worker:', err)
      }
      workerRef.current = null
    }
    setIsProcessing(false)
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 shadow-xl dark-glow">
      <div className="text-center">
        <div className="inline-flex p-4 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 dark:border dark:border-orange-500/20 rounded-full mb-4 dark-glow">
          <Loader2 className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          กำลังประมวลผล OCR
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {status}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3 mb-4 overflow-hidden dark:border dark:border-white/10">
          <div
            className="gradient-primary h-3 rounded-full transition-all duration-300 ease-out shadow-lg dark:shadow-orange-500/30"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm font-medium gradient-text gradient-text-dark mb-4">
          {progress}%
        </p>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="px-6 py-2.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 rounded-xl shadow-md hover:shadow-lg dark:border dark:border-white/10 transition-all duration-200 flex items-center space-x-2 mx-auto"
        >
          <X className="w-4 h-4" />
          <span>ยกเลิก</span>
        </button>
      </div>
    </div>
  )
}

export default OCRProcessor

