import { Upload, Image as ImageIcon, X, FileText, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { pdfToImage, isPDF } from '../utils/pdfToImage'

const ImageUpload = ({ onImageSelect, selectedImage, onError }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith('image/') || isPDF(file))) {
      handleFile(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = async (file) => {
    try {
      setIsProcessing(true)
      
      if (isPDF(file)) {
        // แปลง PDF เป็นภาพ (หน้าแรก) - ใช้ scale 4.0 สำหรับความละเอียดสูงสุด
        const imageDataUrl = await pdfToImage(file, 1, 4.0)
        onImageSelect(imageDataUrl, true) // ส่ง flag ว่าเป็น PDF
      } else if (file.type.startsWith('image/')) {
        // อ่านไฟล์ภาพปกติ
        const reader = new FileReader()
        reader.onload = (e) => {
          onImageSelect(e.target.result, false) // ส่ง flag ว่าไม่ใช่ PDF
        }
        reader.readAsDataURL(file)
      } else {
        throw new Error('รูปแบบไฟล์ไม่รองรับ กรุณาเลือกไฟล์ภาพหรือ PDF')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      if (onError) {
        onError(error.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    onImageSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (selectedImage) {
    return (
      <div className="relative group">
        <div className="glass rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="relative">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto rounded-xl shadow-lg max-h-96 object-contain mx-auto"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="ลบภาพ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="glass rounded-2xl p-8 sm:p-12 border-2 border-dashed border-orange-400 dark:border-orange-500/50">
        <div className="text-center">
          <div className="inline-flex p-4 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 dark:border dark:border-orange-500/20 rounded-full mb-4 dark-glow">
            <Loader2 className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            กำลังประมวลผลไฟล์...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            กรุณารอสักครู่
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`glass rounded-2xl p-8 sm:p-12 border-2 border-dashed transition-all duration-300 ${
        isDragging
          ? 'border-orange-500 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:bg-gradient-to-br dark:from-orange-500/10 dark:to-red-500/10 dark:border-orange-400 scale-[1.02] dark:shadow-orange-500/10'
          : 'border-gray-300 dark:border-white/10 hover:border-orange-400 dark:hover:border-orange-500/50 dark:hover:shadow-orange-500/10'
      }`}
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 dark:border dark:border-orange-500/20 rounded-full mb-4 dark-glow">
          {isDragging ? (
            <Upload className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-bounce" />
          ) : (
            <>
              <ImageIcon className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              <FileText className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            </>
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          {isDragging ? 'วางไฟล์ที่นี่' : 'ลากวางไฟล์หรือคลิกเพื่อเลือก'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          รองรับไฟล์ PNG, JPG, JPEG, WEBP, PDF
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-6 py-3 gradient-primary gradient-primary-hover text-white font-medium rounded-xl shadow-lg hover:shadow-xl dark:shadow-orange-500/20 dark:hover:shadow-orange-500/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          เลือกไฟล์
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default ImageUpload

