import { h } from 'preact'

const InfoBox = () => {
    if (!show) return null

    return (
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center animate-fade-in">
          <h2 class="text-xl font-semibold mb-3">⚠️ Attention!</h2>
          <p class="text-gray-700">{message}</p>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={onClose}
          >
            Okay
          </button>
        </div>
      </div>
    )
}

export default InfoBox
