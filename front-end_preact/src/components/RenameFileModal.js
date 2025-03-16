import { useEffect, useRef, useState } from "preact/hooks"
import tingle from "tingle.js"
import "tingle.js/dist/tingle.css"

const RenameFileModal = ({ isOpen, onClose, file, onRename }) => {
  const modalRef = useRef(null)
  useEffect(() => {
    modalRef.current = new tingle.modal({
      footer: true,
      stickyFooter: false,
      closeMethods: ['overlay', 'button', 'escape'],
      closeLabel: "Close",
      cssClass: ['custom-tingle-modal'],
      onClose: () => {
        onClose()
      }
    })
    modalRef.current.addFooterBtn('Cancelar', 'px-4 py-2 my-1 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition', function () {
      modalRef.current.close()
    })
    modalRef.current.addFooterBtn('Renombrar', 'px-4 py-2 my-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition', function () {
      const input = document.getElementById("rename-file-input")
      const newName = input ? input.value.trim() : ""
      if (newName && newName !== file?.name) {
        onRename(newName)
      }
      modalRef.current.close()
    })
    return () => {
      modalRef.current.destroy()
      modalRef.current = null
    }
  }, [onClose, onRename, file])
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.setContent(`
        <div class="p-6 bg-gray-800 text-white rounded-lg">
          <h2 class="text-2xl font-semibold mb-4 text-blue-400">Renombrar Archivo</h2>
          <input id="rename-file-input" type="text" 
                 placeholder="Ingresa el nuevo nombre del archivo" 
                 class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                 value="${file?.name || ""}" />
        </div>
      `)
      if (isOpen) modalRef.current.open()
      else modalRef.current.close()
    }
  }, [isOpen, file])

  return null
}

export default RenameFileModal