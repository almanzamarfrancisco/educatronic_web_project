import { useEffect, useRef } from "preact/hooks"
import tingle from "tingle.js"
import "tingle.js/dist/tingle.css"

const DeleteFileModal = ({ isOpen, onClose, file, onDelete }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    modalRef.current = new tingle.modal({
      footer: true,
      stickyFooter: false,
      closeMethods: ["overlay", "button", "escape"],
      closeLabel: "Close",
      cssClass: ["custom-tingle-modal"],
      onClose: () => onClose()
    })

    // Add Cancel button
    modalRef.current.addFooterBtn("Cancelar", "px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition", function () {
      modalRef.current.close()
    })

    // Add Delete button (danger styling)
    modalRef.current.addFooterBtn("Eliminar", "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition", function () {
      onDelete(file.id) // Call delete function
      modalRef.current.close()
    })

    return () => {
      modalRef.current.destroy()
      modalRef.current = null
    }
  }, [onClose, onDelete, file])

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.setContent(`
        <div class="p-6 bg-gray-900 text-white rounded-lg">
          <h2 class="text-2xl font-semibold mb-4 text-red-400">Eliminar Archivo</h2>
          <p class="text-gray-300">¿Estás seguro de que deseas eliminar <strong>${file?.name || "este archivo"}</strong>? Esta acción no se puede deshacer.</p>
        </div>
      `)
      if (isOpen) modalRef.current.open()
      else modalRef.current.close()
    }
  }, [isOpen, file])

  return null
}

export default DeleteFileModal
