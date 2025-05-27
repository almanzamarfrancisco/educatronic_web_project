import { useEffect, useRef, useState } from "preact/hooks"
import tingle from "tingle.js"
import "tingle.js/dist/tingle.css"
import useAppStore from '../store'


const NewFileModal = ({ isOpen, onClose, onCreate }) => {
  const modalRef = useRef(null)
  const [fileName, setFileName] = useState("")
  const { newFileRequestFrom } = useAppStore()

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
      let instruction = ''
      switch(newFileRequestFrom) {
        case 'Nuevo Archivo':
          instruction = ''
          break
        case 'Guardar':
          instruction = `Para guardar el programa, debes crear un archivo`
          break
        case 'Ejecutar':
          instruction = `Para ejecutar el programa, debes crear un archivo`
          break
      }
      modalRef.current.setContent(`
        <div class="p-6 bg-gray-900 text-white rounded-lg shadow-lg">
          <h2 class="text-2xl font-semibold mb-4 text-green-400">Crear Nuevo Archivo</h2>
          ${instruction ? `
              <div class="flex items-center p-4 mb-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800" role="alert">
                <svg class="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                </svg>
                <span class="sr-only">Info</span>
                <div>
                  <span class="font-medium">Importante!</span> ${instruction}.
                </div>
              </div>
            `:''}
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
