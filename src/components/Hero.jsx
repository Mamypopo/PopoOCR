const Hero = () => {
  return (
    <div className="text-center py-12 px-4 sm:py-16">
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 gradient-text gradient-text-dark">
         OCR
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        แปลงภาพและ PDF เป็นข้อความ รองรับภาษาไทยและอังกฤษ
        <br className="hidden sm:block" />
        <span className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
          ลากวางไฟล์หรือคลิกเพื่อเลือกภาพ/PDF
        </span>
      </p>
    </div>
  )
}

export default Hero

