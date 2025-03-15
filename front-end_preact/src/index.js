import { h, render } from "preact"
import { useEffect, useState } from "preact/hooks"
import {
  useExercises,
  useCurrentExercise,
  useProgramFiles,
  useCurrentProgram,
  useAppActions,
  useCurrentCode,
} from './store'
import useAppStore from './store'
import VideoPlayer from "./components/VideoPlayer"
import CodeEditorMonaco from "./components/CodeEditorMonaco"
import ErrorModal from "./components/ErrorModal"
import "video.js/dist/video-js.css"
import styles from "./style/index.css"
import designerImage from "./assets/images/designer.svg"
import facebookIcon from "./assets/images/facebook-icon.png"
import youtubeIcon from "./assets/images/youtube-icon.png"

const App = () => {
  const [isVideoVisible, setToggleVideoVisible] = useState(true)
  const [error, setError] = useState({stateGotten: false, message: ""})
  const [activeTabFile, setActiveTabFile] = useState({})
  const toggleVideoVisible = () => setToggleVideoVisible(!isVideoVisible)
  const exercises = useExercises()
  const currentExercise = useCurrentExercise()
  const programFiles = useProgramFiles()
  const { setProgramFiles, setCurrentProgram, currentProgram } = useAppStore()
  const { setExercises, setCurrentExercise } = useAppStore()
  const currentCode = useCurrentCode()
  const video_src = 'http://192.168.1.71:8001/'
  const base_url = 'http://192.168.1.71:8000'
  useEffect(() => {
    fetch(`${base_url}/api/state`)
      .then((res) => res.json())
      .then((data) => {
        console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        if(!data.programs)
          data.programs = [{
            id: "1234",
            name: "Primer archivo",
            content: ""
          }]
        else setProgramFiles(data.programs)
        setExercises(data.exercises)
        setError({stateGotten: true, message: ""})
      }).catch((err) => {
        console.error(err)
        setError({stateGotten: false, message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`})
      })
  }, [])
  const handleTabChange = (tab) => {
    let currentTab = programFiles.find(file => file.id === tab)
    if (!currentTab) console.error(`Tab ${tab} not found`)
    setActiveTabFile(currentTab)
    setCurrentProgram(currentTab)
  }
  const handleExerciseListChange = (exerciseId) => {
    let currentExercise = exercises.find(exercise => exercise.id === exerciseId)
    if (!currentExercise) console.error(`Exercise ${exerciseId} not found`)
    setCurrentExercise(currentExercise)
  }
  const saveCurrentFile = () => {
    
    /* fetch(`${base_url}/api/programs/${currentProgram.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(currentProgram),
      mode: "no-cors",
    })
      .then((res) => !res ? res.json():'')
      .then((data) => {
        console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        setError({stateGotten: true, message: ""})
      }).catch((err) => {
        console.error(err)
        setError({stateGotten: false, message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`})
      }) */
  }
  return (
    !error.stateGotten ?
      <ErrorModal message={error.message} onClose={() => setError(true)} />
      :
      <div class="h-screen">
        {/* <!-- Header --> */}
        <header class="shadow-md py-4 px-6">
          <div class="flex space-x-4 justify-between items-center">
            <div class="flex-1 items-center space-x-4">
              <div class="flex items-center space-x-2">
                <img src={designerImage} alt="Logo" class="w-20" />
                <h1 class="text-xl font-bold flex-1">Educatrónica</h1>
                <div class="flex-1">
                  <div class="flex items-center flex-col sm:flex-row justify-end">
                    <img src={facebookIcon} class="h-12 w-12 flex-none"
                            alt="Youtube icon"
                            loading="lazy"/>
                    <img src={youtubeIcon} class="h-12 w-12 flex-none"
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
        <main class="flex flex-col lg:flex-row items-center">
            {/* <!-- Programming Section --> */}
            <section class="p-6 shadow-md">
              {/* <!-- InfoBox --> */}
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold mx-3 whitespace-nowrap">{ currentExercise && currentExercise.name || 'Selecciona un ejercicio para ver su contenido'}</h2>
                <div class="flex items-center space-x-2">
                  <label class="flex items-center space-x-2">
                    <span>Modo de Bloques</span>
                    <input type="checkbox" class="toggle-checkbox"/>
                  </label>
                  <select onchange={ (event) => handleExerciseListChange(event.target.value) } class="border border-gray-300 rounded-md px-2 py-1 text-sm text-black">
                    <option disabled selected>{`${!exercises.length ? 'No hay ejercicios para mostrar':'Lista de Ejercicios'}`}</option>
                    { exercises &&
                        exercises.map((exercise) => <option value={exercise.id} > {exercise.name} </option>)
                    }
                  </select>
                </div>
              </div>
              <div class="flex space-x-4 mx-3 my-5">
                { currentExercise && currentExercise.content || 'Cuando selecciones un ejercicio aquí se mostrará su contenido' }
              </div>
              {/* <!-- Tabs --> */}
              <div class="border-b border-gray-300 flex items-center justify-between">
                <ul class="flex space-x-4 text-sm">
                  { programFiles && 
                      programFiles.map(
                        (file) => 
                        <li>
                          <a href="#"
                              onclick={() => handleTabChange(file.id)}
                              class={activeTabFile.id === file.id 
                                  ? 
                                'text-blue-500 border-b-2 border-blue-500'
                                :
                                'text-gray-200 border-b-2 border-blue-100'}
                          >
                            {file.name}
                          </a>
                        </li>
                      )
                  }
                </ul>
                <button class="px-2 py-1 text-xs font-medium text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800"
                  onclick={() => {console.log('New File taking the current textArea content')}}
                >
                  (+) Nuevo archivo
                </button>
              </div>
              {/* <!-- Code Editor --> */}
              <div class="flex m-0 p-0 justify-end">
                <button class={`${currentProgram?'visible':'invisible'} px-2 py-1 mt-1 text-xs font-medium text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 rounded-lg text-center me-2 mb-1 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900`}
                  onclick={() => {console.log('Delete the current file')}}
                >
                  - Borrar archivo
                </button>
              </div>
              <CodeEditorMonaco/>
              <div class="flex space-x-4 mt-4">
                <button class="px-4 py-2 bg-blue-500 text-white rounded-md">Ejecutar</button>
                <button class="px-4 py-2 text-white rounded-md bg-blue-500"
                  onClick={() => saveCurrentFile()}
                >
                  Guardar
                </button>
                {
                  !isVideoVisible && (
                    <button
                      class="px-4 py-2 bg-purple-500 text-white rounded-md mx-3 hover:bg-purple-700"
                      onclick={toggleVideoVisible}
                      style="position: absolute;right: 5%;"
                    >
                      Mostrar video
                    </button>
                  )
                }
              </div>
            </section>
            {/* <!-- Live Video Section --> */}
            {
              isVideoVisible && (
                <section class="lg:w-1/3 sm:w-2/3">
                  <div class="shadow-md p-4">
                    <div class="flex justify-between items-center">
                      <h2 class="text-lg font-semibold mx-5">Video en vivo</h2>
                      <button
                        class="px-4 py-2 bg-purple-500 text-white rounded-md mx-3 hover:bg-purple-700"
                        onclick={toggleVideoVisible}
                      >
                        Ocultar video
                      </button>
                    </div>
                    <VideoPlayer streamUrl={video_src}/>
                  </div>
                </section>
              )
            }
        </main>

        {/* <!-- Footer --> */}
        <footer class="shadow-md py-5 my-5 text-center text-sm">
          Pie de Página Copyright Educatrónica - 2025
        </footer>
      </div>
  )
}

render(<App />, document.getElementById("root"))
