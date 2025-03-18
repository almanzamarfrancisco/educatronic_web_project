import { useEffect, useRef, useState } from "preact/hooks"
import tingle from "tingle.js"
import "tingle.js/dist/tingle.css"

const NewFileModal = ({ isOpen, onClose, onCreate }) => {
  const modalRef = useRef(null)
  const [fileName, setFileName] = useState("")

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
    // Add Create button
    modalRef.current.addFooterBtn("Crear", "px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition", function () {
      try {
        let input = document.getElementById("new-file-input")
        onCreate(input.value.trim())
      } catch(error) {
        console.error(`Error: ${error}`)
      }
    //   modalRef.current.close()
    })
    return () => {
      modalRef.current.destroy()
      modalRef.current = null
    }
  }, [onClose, onCreate, fileName])

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.setContent(`
        <div class="p-6 bg-gray-900 text-white rounded-lg shadow-lg">
          <h2 class="text-2xl font-semibold mb-4 text-green-400">Crear Nuevo Archivo</h2>
          <input id="new-file-input" type="text" 
                 placeholder="Ingresa el nombre del archivo" 
                 class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white"
                 value="${fileName}" 
                 autocomplete="off"
                 oninput="this.value && (window.newFileModalInputValue = this.value)"/>
        </div>
      `)

      window.newFileModalInputValue = fileName
      if (isOpen) modalRef.current.open()
      else modalRef.current.close()
    }
  }, [isOpen, fileName])

  return null
}

export default NewFileModal
