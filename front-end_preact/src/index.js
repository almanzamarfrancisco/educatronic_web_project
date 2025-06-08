import { h, render } from "preact"
import { useEffect, useState } from "preact/hooks"
import {
  useExercises,
  useCurrentExercise,
  useProgramFiles,
  useCurrentCode,
  useIsBlocklySelected,
  useCurrentFloor,
  useInfoBoxExpanded,
} from './store'
import useAppStore from './store'
import VideoPlayer from "./components/VideoPlayer"
import CodeEditorMonaco from "./components/CodeEditorMonaco"
import ErrorModal from "./components/ErrorModal"
import RenameFileModal from "./components/RenameFileModal"
import DeleteFileModal from "./components/DeleteFileModal"
import StatusIcon from "./components/StatusIcon"
import BlocklyInterface from "./components/BlocklyInterface"
import InfoBox from "./components/InfoBox"
import "video.js/dist/video-js.css"
import "./style/tailwind.css";
import "./style/index.css"
import designerImage from "./assets/images/designer.svg"
import facebookIcon from "./assets/images/facebook-icon.png"
import youtubeIcon from "./assets/images/youtube-icon.png"
import IPNLogo from "./assets/images/IPN-logo.png"
import ESCOMLogo from "./assets/images/ESCOM-logo.png"
import UNAMLogo from "./assets/images/UNAM-logo.png"
import ICATLogo from "./assets/images/UNAM-ICAT-logo.png"
import educatronicaTitle from "./assets/images/educatronica.png"
import trash from "./assets/images/trash-can.png"
import NewFileModal from "./components/NewFileModal"
import { LexicalAnalyzer } from "./utils/LexicalAnalyzer";
import ExercisesSection from "./components/ExercisesSection"

const App = () => {
  const [isVideoVisible, setToggleVideoVisible] = useState(true)
  const [error, setError] = useState({stateGotten: true, message: "", closeButton: false})
  const [activeTabFile, setActiveTabFile] = useState({})
  const [statusIcon, setStatusIcon] = useState({isOpen: true, status: "neutral"})
  const [isExecuteDisabled, setExecuteDisabled] = useState(false);
  const [infoBoxExpanded, setinfoBoxExpanded] = useState(false);
  const toggleVideoVisible = () => setToggleVideoVisible(!isVideoVisible)
  const exercises = useExercises()
  const currentExercise = useCurrentExercise()
  const programFiles = useProgramFiles()
  const currentFloor = useCurrentFloor()
  const isInfoBoxExpanded = useInfoBoxExpanded()
  const isBlocklySelected = useIsBlocklySelected()
  const { setProgramFiles, setCurrentProgram, currentProgram, setCompileOutput, setBlocklySelected, setCurrentFloor } = useAppStore()
  const { setExercises, setCurrentExercise } = useAppStore()
  const { isRenameModalOpen, fileToRename, openRenameModal, closeRenameModal } = useAppStore()
  const { isDeleteModalOpen, fileToDelete, openDeleteModal, closeDeleteModal } = useAppStore()
  const { isNewFileModalOpen, openNewFileModal, newFileRequestFrom, closeNewFileModal } = useAppStore()
  const currentCode = useCurrentCode()
  const streamURL = 'https://stream-educatronica.ngrok.app/'
  // const streamURL = 'http://192.168.1.71:8001'
  const base_url = 'https://educatronica.ngrok.app'
  // const base_url = 'http://192.168.1.71:8000'
  const noExercisesArray = [{
    id: '1234',
    name: "Archivo sin nombre",
    content: "",
    exerciseId: "any"
  }]
  useEffect(() => {
    fetch(`${base_url}/api/state`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        // console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        if(!data.exercises || !data.exercises.length) {
          setError({stateGotten: false, message: "No se encontraron ejercicios", closeButton: true})
          console.log(`Error: ${JSON.stringify(error)}`)
          setProgramFiles(noExercisesArray)
          return
        }
        setExercises(data.exercises)
        setProgramFiles(data.programs)
        setCurrentExercise(data.exercises[0])
        // setCurrentFloor(Number(data.currentFloor))
        return
      })
      .catch((err) => {
        console.error(err)
        /* setError({
          stateGotten: false,
          message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`,
          closeButton: false
        }) */
      })
  }, [ setExercises, setProgramFiles, setError ])
  const onCloseErrorScreen = () => {
    setError({stateGotten: true, message: "", closeButton: false})
    handleTabChange('1234')
  }
  const handleTabChange = (tab) => {
    let currentTab = programFiles.find(file => file.id === tab)
    if (!currentTab) {
      console.error(`Tab ${tab} not found`)
      currentTab = {}
    }
    setActiveTabFile(currentTab)
    setCurrentProgram(currentTab)
    // console.log(currentProgram)
  }
  const handleExerciseListChange = (exerciseId) => {
    let currentExercise = exercises.find(exercise => exercise.id === exerciseId)
    if (!currentExercise) console.error(`Exercise ${exerciseId} not found`)
    setCurrentExercise(currentExercise)
    const firstProgram = programFiles.find(file => file.exercise_id === exerciseId)
    handleTabChange(firstProgram?.id)
  }
  const updateFileOnServer = (id, file, withIconUpdate) => {
    console.log(`Updating file ${id} on server and file ${JSON.stringify(file, null, 2)}`)
    setStatusIcon({isOpen: true, status: "loading"})
    fetch(`${base_url}/api/programs/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(file),
      // mode: "no-cors",
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json();
      })
      .then((data) => {
        console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        setError({stateGotten: true, message: ""})
        if (withIconUpdate){
          setStatusIcon({isOpen: true, status: "success"})
          setTimeout(() => {
            setStatusIcon({isOpen: false, status: "neutral"})
          }, 3000)
        }
      }).catch((err) => {
        console.error(err)
        setError({
          stateGotten: false,
          message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`,
          closeButton: false
        })
      })
  }
  const saveCurrentFile = () => {
    if(!currentProgram) {
      console.log(`There is any file selected, making one`)
      openNewFileModal('Guardar')
      return
    }
    console.log(currentProgram)
    currentProgram.content = currentCode
    setProgramFiles(programFiles.map(file => file.id === currentProgram.id ? currentProgram : file))
    updateFileOnServer(currentProgram.id, currentProgram, true)
  }
  const renameFile = (file, newName) => {
    if(!file) { console.log(`There is any file selected`); return }
    if(!newName) { console.log(`There is no new name`); return }
    file.name = newName
    setProgramFiles(programFiles.map(f => f.id === file.id ? file : f))
    updateFileOnServer(file.id, file, true)
  }
  const deleteFile = (fileId) => {
    console.log(`Deleting file ${fileId}`)
    const notDeletedFiles = programFiles.filter(file => file.id !== fileId)
    setProgramFiles(notDeletedFiles)
    setCurrentProgram(programFiles[0])
    setActiveTabFile(programFiles[0])
    setStatusIcon({isOpen: true, status: "loading"})
    fetch(`${base_url}/api/programs/delete/${fileId}`,{
        method: 'DELETE',
        // mode: "no-cors",
      })
      .then((res) => !res ? res.json():'')
      .then((data) => {
        console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        setError({stateGotten: true, message: ""})
        setStatusIcon({isOpen: true, status: "success"})
        setTimeout(() => {
          setStatusIcon({isOpen: false, status: "neutral"})
        }, 3000)
      }).catch((err) => {
        console.error(err)
        setError({
          stateGotten: false,
          message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`,
          closeButton: false
        })
      }
    )
  }
  const createFile = (fileName) => {
    if(!fileName) { console.log(`There is no file name`); return }
    console.log(`Request to ${base_url}/api/programs/create : ${JSON.stringify({name: fileName, content: currentCode, exercise_id: currentExercise.id}, null, 2)}`)
    fetch(`${base_url}/api/programs/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: fileName,
        content: newFileRequestFrom !== 'Nuevo archivo' ? currentCode: "",
        exercise_id: currentExercise.id
      }),
      // mode: "cors",
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json();
      })
      .then((data) => {
        console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        const newFile = {
          id: data.newProgramId,
          name: fileName,
          exercise_id: currentExercise.id,
          content: newFileRequestFrom !== 'Nuevo archivo' ? currentCode: ""
        }
        setProgramFiles([...programFiles, newFile])
        setStatusIcon({isOpen: true, status: "success"})
        setTimeout(() => {
          setStatusIcon({isOpen: false, status: "neutral"})
        }, 3000)
        // selectTab(newFile.id)
        setCurrentProgram(newFile)
        setActiveTabFile(newFile)
      }).catch((err) => {
        console.error(err)
        setError({
          stateGotten: false,
          message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`,
          closeButton: false
        })
      })
  }
  const compileAndExecuteCode = () => {
    if(!currentProgram) {
      console.log(`There is any file selected, making one`)
      openNewFileModal('Ejecutar')
      return
    }
    console.log(currentProgram)
    currentProgram.content = currentCode
    setProgramFiles(programFiles.map(file => file.id === currentProgram.id ? currentProgram : file))
    updateFileOnServer(currentProgram.id, currentProgram, false)

    setExecuteDisabled(true)
    const lexer = new LexicalAnalyzer()
    setStatusIcon({isOpen: true, status: "loading"})
    const validationResult = lexer.analyze(currentCode)
    setCompileOutput(validationResult)
    if(validationResult !== `Sintaxis válida.`) {
      setTimeout(() => {
        setStatusIcon({isOpen: false, status: "fail"})
        setExecuteDisabled(false)
      }, 1000)
      return
    }
    console.log(`Request to ${base_url}/api/programs/execute : ${JSON.stringify({code: currentCode, programId: currentProgram.id}, null, 2)}`)
    setStatusIcon({isOpen: true, status: "loading"})
    fetch(`${base_url}/api/programs/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: currentCode,
        programId: currentProgram.id
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        if(data.current_floor && data.status === 'ok'){
          setCompileOutput(`Ejecución exitosa. Piso final: ${data.current_floor}`)
          // setCurrentFloor(data.current_floor)
          setStatusIcon({isOpen: true, status: "success"})
          setTimeout(() => {
            setStatusIcon({isOpen: false, status: "neutral"})
            setExecuteDisabled(false)
          }, 3000)
        }
        else if (data.status === 'error' && data.line){
          setCompileOutput(`Error en la ejecución, línea: ${data.line}`)
          setStatusIcon({isOpen: true, status: "fail"})
          setExecuteDisabled(false)
          setTimeout(() => {
            setStatusIcon({isOpen: false, status: "neutral"})
          }, 3000)
        }
        setError({stateGotten: true, message: ""})
      }).catch((err) => {
        console.error(err)
        setError({
          stateGotten: false,
          message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`,
          closeButton: false
        })
      })
  }
  return (
    !error.stateGotten ?
      <ErrorModal message={error.message} closeButton={error.closeButton} onClose={() => {onCloseErrorScreen()}} />
      :
      <div class="h-screen w-full overflow-x-hidden flex flex-col items-center text-black">
        {/* <!-- Header --> */}
        <header class="shadow-md py-4 px-6 bg-sky-800 w-full m-0">
          <div class="flex space-x-4 justify-between items-center">
            <div class="flex-1 items-center space-x-4">
              <div class="flex items-center space-x-2">
                <img src={designerImage} alt="Logo" class="w-20"/>
                <h1 class="text-5xl flex-1 font-semibold" style="padding-left: 0.4em;">
                  <img src={educatronicaTitle} class="h-10 flex-none inline"/>
                  <p className="text-base pl-10 font-semibold" style="padding-top: 0.4em; font-size: 1.3rem;color: #021d34">Aprendiendo a aprender</p>
                </h1>
                <div class="flex-1">
                  <div class="flex items-center flex-col sm:flex-row justify-end">
                    <img src={facebookIcon} class="h-10 w-10 flex-none mx-2"
                            alt="Youtube icon"
                            loading="lazy"/>
                    <img src={youtubeIcon} class="h-10 w-10 flex-none mx-2"
                          alt="Youtube icon"
                        loading="lazy"/>
                  </div>
                </div>
              </div>
            </div>
            {/* <NavBar /> */}
          </div>
        </header>

        {/* <!-- Main Content --> */}
        <main class="flex flex-col items-center w-full">
          <section className="flex sm:flex-col-reverse sm:flex lg:flex-row w-full mt-5"> {/* Top section */}
            {/* Exercises */}
            <div className="m-5 lg:w-1/2 sm:w-full sm:m-auto">
              {/* Excercise header */}
              <ExercisesSection handleExerciseListChange={handleExerciseListChange} />
              {/* Blockly switch */}
              <div class={`flex items-center space-x-2 whitespace-nowrap mx-3 w-full ${isInfoBoxExpanded?'items-end h-full':''}`}>
                  <label class="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      class="sr-only peer toggle-checkbox"
                      checked={isBlocklySelected}
                      onChange={(e) => setBlocklySelected(e.target.checked)}
                    />
                    <div class="mx-2 relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                    <span class="ms-3 text-sm font-bold" style="color: rgb(2, 29, 52);">Modo de bloques</span>
                  </label>
                </div> 
            </div>
            {/* Infobox */}
            <div className="m-5 p-5 lg:w-1/2 sm:w-full sm:m-auto">
              <InfoBox/>
            </div>
          </section> 
          <section className="flex lg:flex-row sm:flex-col sm:mx-auto sm:px-auto w-full"> {/* Bottom section */}
            {/* <!-- Programming Section --> */}
            <div className={`lg:pl-5 sm:mx-auto sm:px-2 lg:pr-2 shadow-md sm:w-full ${isVideoVisible ? 'lg:1/2 xl:w-2/5':'w-full'}`}>
              {/* <!-- Tabs --> */}
              <div class="border-b border-gray-300 flex items-baseline justify-between">
                <ul class="flex space-x-4 text-sm container overflow-x-auto overflow-y-clip" id="tabs">
                  { programFiles && 
                      programFiles.filter(
                        (file) => file.exercise_id === currentExercise.id
                      ).map(
                        (file) => 
                        <li className="min-w-fit">
                          <a href="#tabs"
                              onclick={() => handleTabChange(file.id)}
                              class={activeTabFile.id === file.id 
                                  ? 
                                'text-sky-900 border-b-2 border-violet-500'
                                :
                                'text-gray-900 border-b-2 border-blue-100'}
                          >
                            {file.name}
                          </a>
                        </li>
                      )
                  }
                </ul>
                <button class="px-4 py-2 bg-violet-700 text-white rounded-md m-3 hover:bg-blue-600"
                  onclick={() => {openNewFileModal('Nuevo archivo')}}
                >
                  (+) Nuevo archivo
                </button>
              </div>
              {/* <!-- Code Editor --> */}
              <div class="flex m-0 p-0 justify-end">
                <button class={`${currentProgram?'visible':'invisible'} px-2 py-1 mt-1 text-xs font-medium text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center me-2 mb-1 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-600 dark:focus:ring-blue-900`}
                  onclick={() => openRenameModal(currentProgram)}
                >
                  Cambiar nombre
                </button>
                <button class={`${currentProgram?'visible':'invisible'} px-2 py-1 mt-1 text-xs font-medium text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 rounded-lg text-center me-2 mb-1 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-900 dark:focus:ring-red-900`}
                  onclick={() => openDeleteModal(currentProgram)}
                >
                  <img src={trash} class="h-5 w-5 mx-2 flex-none inline"
                    alt="Engranes"
                    loading="lazy"
                    display="inline-block"
                  />
                  Borrar archivo
                </button>
              </div>
              {isBlocklySelected ?
                <BlocklyInterface/>
                :
                <CodeEditorMonaco/>}
              <div class="flex space-x-4 mt-4 w-full">
                <button
                  class={`px-4 py-2 bg-sky-800 hover:bg-sky-900 text-white rounded-md ${isExecuteDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => compileAndExecuteCode()}
                  disabled={isExecuteDisabled}
                >
                  Ejecutar
                </button>
                <button class="px-4 py-2 text-white rounded-md bg-sky-800 hover:bg-sky-900"
                  onClick={() => saveCurrentFile()}
                >
                  Guardar
                </button>
                <StatusIcon status={statusIcon.status} size={32} />
                {
                  !isVideoVisible && (
                    <button
                      class="px-4 py-2 bg-violet-700 text-white rounded-md mx-3 hover:bg-blue-600"
                      onclick={toggleVideoVisible}
                    >
                      Mostrar video
                    </button>
                  )
                }
              </div>
            </div>
            {/* <!-- Live Video Section --> */}
            {
              isVideoVisible && (
                <div class="lg:1/2 xl:w-3/5 sm:w-full flex-row sm:mx-auto sm:px-2 lg:pr-5 lg:pl-2 items-center flex">
                  <div class="shadow-md p-4 items-center w-full">
                    <div class="flex justify-center items-center">
                      <div class="w-3 h-3 bg-red-500 rounded-full animate-blink"></div>
                      <h2 class="text-2xl mx-5">Video en vivo</h2>
                      <button
                        class="px-4 py-2 bg-violet-700 text-white rounded-md mx-3 hover:bg-blue-600"
                        onclick={toggleVideoVisible}
                      >
                        Ocultar video
                      </button>
                    </div>
                    <VideoPlayer streamUrl={streamURL}/>
                  </div>
                </div>
              )
            }
          </section> 
          <RenameFileModal 
            isOpen={isRenameModalOpen}
            onClose={closeRenameModal}
            file={fileToRename}
            onRename={(newName) => renameFile(fileToRename, newName) }
          />
          <DeleteFileModal
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            file={fileToDelete}
            onDelete={deleteFile}
          />
          <NewFileModal
            isOpen={isNewFileModalOpen}
            onClose={closeNewFileModal}
            onCreate={(fileName) => createFile(fileName, 'Nuevo archivo')}
          />
        </main>
        {/* <!-- Footer --> */}
        <footer class="shadow-md py-5 my-5 text-center w-full bg-sky-800 text-white">
          <div style="padding-bottom: 1.2em;">
           &copy;Todos los derechos resevados Educatrónica&#174; - 2025
          </div>
          <div class="flex justify-center items-center space-x-4 mt-2">
            <a href="https://www.ipn.mx/" target="_blank" rel="noopener noreferrer">
              <img src={IPNLogo} class="h-20"
                alt="IPN logo"
                loading="lazy"
              />
            </a>
            <a href="https://www.escom.ipn.mx/" target="_blank" rel="noopener noreferrer">
              <img src={ESCOMLogo} class="h-20"
                alt="ESCOM IPN logo"
                loading="lazy"
              />
            </a>
            <a href="https://www.unam.mx/" target="_blank" rel="noopener noreferrer">
              <img src={UNAMLogo} class="h-20"
                alt="UNAM logo"
                loading="lazy"
              />
            </a>
            <a href="https://www.icat.unam.mx/" target="_blank" rel="noopener noreferrer">
              <img src={ICATLogo} class="h-20"
                alt="ICAT UNAM logo"
                loading="lazy"
              />
            </a>
          </div>
        </footer>
      </div>
  )
}

render(<App />, document.getElementById("root"))
