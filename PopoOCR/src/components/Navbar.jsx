import { Moon, Sun, Scan } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const Navbar = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="glass-strong sticky top-0 z-50 border-b border-gray-200/50 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 gradient-primary rounded-xl shadow-lg dark:shadow-orange-500/20 dark-glow transition-all duration-300">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text gradient-text-dark">
                PopoOCR
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">ภาพเป็นข้อความ</p>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md dark:border dark:border-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

