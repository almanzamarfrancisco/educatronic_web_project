import { h, render } from "preact"
import { useEffect, useState } from "preact/hooks"
import {
  useExercises,
  useCurrentExercise,
  useProgramFiles,
  useCurrentCode,
  useIsBlocklySelected,
  useCurrentFloor,
} from './store'
import useAppStore from './store'
import VideoPlayer from "./components/VideoPlayer"
import CodeEditorMonaco from "./components/CodeEditorMonaco"
import ErrorModal from "./components/ErrorModal"
import RenameFileModal from "./components/RenameFileModal"
import DeleteFileModal from "./components/DeleteFileModal"
import StatusIcon from "./components/StatusIcon"
import BlocklyInterface from "./components/BlocklyInterface"
import "video.js/dist/video-js.css"
import "./style/tailwind.css";
import "./style/index.css"
import designerImage from "./assets/images/designer.svg"
import facebookIcon from "./assets/images/facebook-icon.png"
import youtubeIcon from "./assets/images/youtube-icon.png"
import gears from "./assets/images/gears.png"
import trash from "./assets/images/trash-can.png"
import NewFileModal from "./components/NewFileModal"
import { LexicalAnalyzer } from "./utils/LexicalAnalyzer";

const App = () => {
  const [isVideoVisible, setToggleVideoVisible] = useState(true)
  const [error, setError] = useState({stateGotten: true, message: "", closeButton: false})
  const [activeTabFile, setActiveTabFile] = useState({})
  const [statusIcon, setStatusIcon] = useState({isOpen: true, status: "neutral"})
  const [isExecuteDisabled, setExecuteDisabled] = useState(false);
  const toggleVideoVisible = () => setToggleVideoVisible(!isVideoVisible)
  const exercises = useExercises()
  const currentExercise = useCurrentExercise()
  const programFiles = useProgramFiles()
  const currentFloor = useCurrentFloor()
  const isBlocklySelected = useIsBlocklySelected()
  const { setProgramFiles, setCurrentProgram, currentProgram, setCompileOutput, setBlocklySelected, setCurrentFloor } = useAppStore()
  const { setExercises, setCurrentExercise } = useAppStore()
  const { isRenameModalOpen, fileToRename, openRenameModal, closeRenameModal } = useAppStore()
  const { isDeleteModalOpen, fileToDelete, openDeleteModal, closeDeleteModal } = useAppStore()
  const { isNewFileModalOpen, openNewFileModal, closeNewFileModal } = useAppStore()
  const currentCode = useCurrentCode()
  // const streamURL = 'https://stream-educatronic.ngrok.app/'
  const streamURL = 'http://localhost:8001'
  // const base_url = 'https://educatronic.ngrok.app'
  const base_url = 'http://localhost:8000'
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
        setCurrentFloor(Number(data.currentFloor))
        return
      })
      .catch((err) => {
        console.error(err)
        setError({
          stateGotten: false,
          message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`,
          closeButton: false
        })
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
  const updateFileOnServer = (id, file) => {
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
      })
  }
  const saveCurrentFile = () => {
    if(!currentProgram) { console.log(`There is any file selected`); return }
    console.log(currentProgram)
    currentProgram.content = currentCode
    setProgramFiles(programFiles.map(file => file.id === currentProgram.id ? currentProgram : file))
    updateFileOnServer(currentProgram.id, currentProgram)
  }
  const renameFile = (file, newName) => {
    if(!file) { console.log(`There is any file selected`); return }
    if(!newName) { console.log(`There is no new name`); return }
    file.name = newName
    setProgramFiles(programFiles.map(f => f.id === file.id ? file : f))
    updateFileOnServer(file.id, file)
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
    console.log(`Creating file ${fileName}`)
    if(!fileName) { console.log(`There is no file name`); return }
    console.log(`Creating file ${fileName}`)
    setStatusIcon({isOpen: true, status: "loading"})
    fetch(`${base_url}/api/programs/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        name: "",
        content: "",
        exercise_id: currentExercise.id
      },
      // mode: "no-cors",
    })
      .then((res) => !res ? res.json():'')
      .then((data) => {
        console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        const newFile = {
          id: data.newProgramId,
          name: fileName,
          content: ""
        }
        setProgramFiles([...programFiles, newFile])
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
      })
  }
  const compileAndExecuteCode = () => {
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
          setCompileOutput(`Ejecución exitosa. Piso actual: ${data.current_floor}`)
          setCurrentFloor(data.current_floor)
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
      <div class="h-screen w-full flex flex-col items-center">
        {/* <!-- Header --> */}
        <header class="shadow-md py-4 px-6 bg-sky-800 w-full">
          <div class="flex space-x-4 justify-between items-center">
            <div class="flex-1 items-center space-x-4">
              <div class="flex items-center space-x-2">
                <img src={designerImage} alt="Logo" class="w-20"/>
                <h1 class="text-5xl flex-1">Educatrónica <p className="text-sm pl-10">Aprendiendo a aprender</p></h1>
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
        <main class="flex flex-col items-center min-w-screen">
          <section className="flex flex-row w-full"> {/* Top section */}
            {/* Exercises */}
            <div className="m-5 lg:w-2/3">
              {/* Excercise header */}
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-4xl mx-3 whitespace-normal">
                  <img src={gears} class="h-10 w-15 mx-2 flex-none inline"
                    alt="Engranes"
                    loading="lazy"
                    display="inline-block"
                  />
                  <span>{ currentExercise && currentExercise.name || 'Selecciona un ejercicio para ver su contenido'}</span>
                </h2>
                <div class="flex items-center space-x-2">
                  <select onchange={ (event) => handleExerciseListChange(event.target.value) } class="border border-gray-300 rounded-md px-2 py-1 text-sm text-black w-25">
                    <option disabled>{`${!exercises.length ? 'No hay ejercicios para mostrar':'Lista de Ejercicios'}`}</option>
                    { exercises &&
                        exercises.map((exercise, index) => <option value={exercise.id} selected={!index?'selected':''} > {exercise.name} </option>)
                    }
                  </select>
                </div>
                <div class="flex items-center space-x-2 whitespace-nowrap mx-3">
                  <label class="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      class="sr-only peer toggle-checkbox"
                      checked={isBlocklySelected}
                      onChange={(e) => setBlocklySelected(e.target.checked)}
                    />
                    <div class="mx-2 relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                    <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Modo de bloques</span>
                  </label>
                </div>
              </div>
              {/* Excercise description */}
              <div className="justify-between mx-3 my-5 flex">
                <div class="space-x-4 mx-3 my-5 flex-row">
                { currentExercise && currentExercise.content.split('\n').map((line, index) => (
                  <p key={index}>{line}<br/></p>
                )) || <pre>Cuando selecciones un ejercicio aquí se mostrará su contenido</pre> }
                </div>
                <div className="flex-row items-center space-x-2 border-l-2 border-gray-300 pl-5">
                  <h1 class="text-xl mx-3 text-center">Piso Actual </h1>
                  <h3
                    class="text-5xl m-2 p-3 bg-cyan-800 text-center rounded-lg transition transform duration-500 ease-in-out">
                      {currentFloor ?? '0'}
                  </h3>
                </div>
              </div>
            </div>
            <div className="m-5 lg:w-1/3">
              <h1 className="text-4xl mx-1 px-1">¿Cómo programar el robot? </h1>
              <p className="py-2">
                lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus.
              </p>
              <p className="py-2">
                lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus.
              </p>
              <p className="py-2">
                lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus.
              </p>
            </div>
          </section> 
          <section className="flex flex-row w-full"> {/* Bottom section */}
            {/* <!-- Programming Section --> */}
            <div className={`pl-5 pr-2 shadow-md ${isVideoVisible ? 'lg:w-2/3':'w-full'}`}>
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
                                'text-violet-500 border-b-2 border-violet-500'
                                :
                                'text-gray-200 border-b-2 border-blue-100'}
                          >
                            {file.name}
                          </a>
                        </li>
                      )
                  }
                </ul>
                <button class="px-4 py-2 bg-violet-700 text-white rounded-md m-3 hover:bg-violet-500"
                  onclick={() => {openNewFileModal()}}
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
              <div class="flex space-x-4 mt-4">
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
                      class="px-4 py-2 bg-violet-700 text-white rounded-md mx-3 hover:bg-violet-900"
                      onclick={toggleVideoVisible}
                      style="position: absolute;right: 5%;"
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
                <div class="lg:w-1/3 sm:w-full flex-row pr-5 pl-2 items-center flex">
                  <div class="shadow-md p-4 items-center w-full">
                    <div class="flex justify-center items-center">
                      <div class="w-3 h-3 bg-red-500 rounded-full animate-blink"></div>
                      <h2 class="text-2xl mx-5">Video en vivo</h2>
                      <button
                        class="px-4 py-2 bg-violet-700 text-white rounded-md mx-3 hover:bg-violet-900"
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
            onCreate={(fileName) => createFile(fileName)}
          />
        </main>
        {/* <!-- Footer --> */}
        <footer class="shadow-md py-5 my-5 text-center text-sm min-w-screen">
          Copyright Educatrónica - 2025
        </footer>
      </div>
  )
}

render(<App />, document.getElementById("root"))
