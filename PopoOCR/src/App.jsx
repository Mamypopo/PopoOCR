import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ImageUpload from './components/ImageUpload'
import OCRProcessor from './components/OCRProcessor'
import OCRResult from './components/OCRResult'

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isPDF, setIsPDF] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [error, setError] = useState('')

  const handleImageSelect = (image, isPdfFile = false) => {
    setSelectedImage(image)
    setIsPDF(isPdfFile)
    setOcrText('')
    setError('')
  }

  const handleOCRResult = (text) => {
    setOcrText(text)
    setError('')
  }

  const handleOCRError = (errorMessage) => {
    setError(errorMessage)
    setOcrText('')
  }

  const handleReset = () => {
    setSelectedImage(null)
    setIsPDF(false)
    setOcrText('')
    setError('')
  }

  const handleCancelOCR = () => {
    setSelectedImage(null)
    setIsPDF(false)
    setOcrText('')
    setError('')
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#1d1d1f] dark:via-[#1a1a1c] dark:to-[#1d1d1f] transition-colors duration-300 relative">
        {/* MacBook Style Dark Mode Background */}
        <div className="fixed inset-0 -z-10 dark:block hidden">
          <div className="absolute inset-0 bg-[#1d1d1f]"></div>
          {/* Subtle gradient overlay with accent color */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1d1d1f] via-[#1a1a1c] to-[#1d1d1f] opacity-100"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        </div>
        <Navbar />
        
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Hero />
          
          <div className="space-y-6 sm:space-y-8">
            {/* Image Upload Section */}
            <ImageUpload 
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onError={handleOCRError}
            />

            {/* OCR Processing Section */}
            {selectedImage && !ocrText && !error && (
              <OCRProcessor
                image={selectedImage}
                isPDF={isPDF}
                onResult={handleOCRResult}
                onError={handleOCRError}
                onCancel={handleCancelOCR}
              />
            )}

            {/* Error Display */}
            {error && (
              <div className="glass rounded-2xl p-6 shadow-xl border-l-4 border-red-500 dark:border-red-400 dark-glow">
                <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                  เกิดข้อผิดพลาด
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors duration-200 shadow-md dark:shadow-red-500/20"
                >
                  ลองใหม่
                </button>
              </div>
            )}

            {/* OCR Result Section */}
            {ocrText && (
              <OCRResult 
                text={ocrText}
                onReset={handleReset}
              />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} by <span className="gradient-text gradient-text-dark font-semibold">Mamypopo</span></p>
        </footer>
      </div>
    </ThemeProvider>
  )
}

export default App

