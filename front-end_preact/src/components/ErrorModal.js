import { h } from 'preact'
import { useEffect } from 'preact/hooks'

const ErrorModal = ({ message, closeButton, onClose }) => (
  <div class="h-screen flex items-center justify-center">
    <div class="inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 align-middle">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center animate-fade-in">
        <h2 class="text-xl font-semibold mb-3 text-black">⚠️ Atención!</h2>
        <p class="text-gray-700">{message ? message : 'Lo sentimos. Algo salió muy mal x('}</p>
        <button onClick={onClose}
          className={`px-2 py-1 text-xs font-medium text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800 ${closeButton ? 'visible':'invisible'}`}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)

export default ErrorModal
