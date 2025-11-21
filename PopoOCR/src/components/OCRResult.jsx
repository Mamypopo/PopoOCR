import { Copy, Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const OCRResult = ({ text, onReset }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 shadow-xl dark-glow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          ผลลัพธ์ OCR
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-2.5 gradient-primary gradient-primary-hover text-white rounded-xl shadow-md hover:shadow-lg dark:shadow-orange-500/20 dark:hover:shadow-orange-500/30 transition-all duration-200 flex items-center space-x-2"
            aria-label="คัดลอก"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-sm">คัดลอก</span>
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="p-2.5 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl shadow-md hover:shadow-lg dark:border dark:border-white/10 transition-all duration-200 flex items-center space-x-2"
            aria-label="เริ่มใหม่"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">เริ่มใหม่</span>
          </button>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-white/10">
        <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
          {text || 'ไม่มีข้อความที่ตรวจจับได้'}
        </pre>
      </div>
    </div>
  )
}

export default OCRResult

