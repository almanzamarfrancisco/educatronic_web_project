import { h } from 'preact'

const ErrorModal = ({ message, onClose }) => {
    console.log(`message: ${message}`)
    return (
      <div class="h-screen flex items-center justify-center">
        <div class="inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 align-middle">
          <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center animate-fade-in">
            <h2 class="text-xl font-semibold mb-3 text-black">⚠️ Atención!</h2>
            <p class="text-gray-700">{message ? message : 'Lo sentimos. Algo salió muy mal x('}</p>
          </div>
        </div>
      </div>
    )
  }

export default ErrorModal
