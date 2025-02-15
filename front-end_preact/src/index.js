import { h, render } from "preact"
import { useEffect, useState } from "preact/hooks"
import useAppStore from './store'
import VideoPlayer from "./components/VideoPlayer"
import ErrorModal from "./components/ErrorModal"
import "video.js/dist/video-js.css"
import styles from "./style/index.css"
import designerImage from "./assets/images/designer.svg"
import facebookIcon from "./assets/images/facebook-icon.png"
import youtubeIcon from "./assets/images/youtube-icon.png"

const App = () => {
  const [isVideoVisible, setToggleVideoVisible] = useState(true)
  const [error, setError] = useState({stateGotten: false, message: ""})
  const toggleVideoVisible = () => setToggleVideoVisible(!isVideoVisible)
  const { programFiles, setProgramFiles, setCurrentProgram } = useAppStore()
  const video_src = 'https://47f9d06986f4.ngrok.app'
  useEffect(() => {
    fetch('http://192.168.1.71:8000/api/state')
      .then((res) => res.json())
      .then((data) => {
        console.log(`Gotten data: ${JSON.stringify(data, null, 2)}`)
        setProgramFiles(data.programs)
        setError({stateGotten: true, message: ""})
      }).catch((err) => {
        console.error(err)
        setError({stateGotten: false, message: `Ocurrió un error de comunicación con el servidor, por favor intente más tarde ${err}`})
      })
  }, [])
  const state = {
    programFiles: programFiles,
  }
  const [activeTabFile, setActiveTabFile] = useState({})
  const handleTabChange = (tab) => {
    let currentTab = state.programFiles.find(file => file.id === tab)
    if (!currentTab) console.error(`Tab ${tab} not found`)
    setActiveTabFile(currentTab)
    setCurrentProgram(currentTab)
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
        <main class="flex-1 flex flex-col lg:flex-row items-center">
            {/* <!-- Programming Section --> */}
            <section class="flex-1 p-6 shadow-md">
              {/* <!-- InfoBox --> */}
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold mx-3 whitespace-nowrap">Ejercicio 1</h2>
                <div class="flex items-center space-x-2">
                  <label class="flex items-center space-x-2">
                    <span>Modo de Bloques</span>
                    <input type="checkbox" class="toggle-checkbox"/>
                  </label>
                  <select class="border border-gray-300 rounded-md px-2 py-1 text-sm text-black">
                    <option>Lista de Ejercicios</option>
                    <option>Ejercicio 1</option>
                    <option>Ejercicio 2</option>
                    <option>Ejercicio 3</option>
                  </select>
                </div>
              </div>
              <div class="flex space-x-4 mx-3 my-5">
                lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </div>
              {/* <!-- Tabs --> */}
              <div class="border-b border-gray-300">
                <ul class="flex space-x-4 text-sm">
                  { state.programFiles && 
                      state.programFiles.map(
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
              </div>
              {/* <!-- Code Editor --> */}
              <textarea
                class="w-full h-60 border border-gray-300 mt-4 rounded-md p-2 font-mono text-sm text-black bg-gray-50"
                spellcheck="false">
                {
                  activeTabFile.content
                }
              </textarea>
              <div class="flex space-x-4 mt-4">
                <button class="px-4 py-2 bg-blue-500 text-white rounded-md">Guardar</button>
                <button class="px-4 py-2 bg-blue-500 text-white rounded-md">Ejecutar</button>
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
