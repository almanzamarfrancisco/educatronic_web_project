import { h, render } from "preact";
import { useEffect, useState } from "preact/hooks";
import VideoPlayer from "./components/VideoPlayer";
import "video.js/dist/video-js.css";
import CodeEditor from "./components/CodeEditor";
import styles from "./style/index.css";
import designerImage from "./assets/images/designer.svg";
import logoImage from "./assets/images/logo.svg";
import facebookIcon from "./assets/images/facebook-icon.png";
import youtubeIcon from "./assets/images/youtube-icon.png";
import NavBar from "./components/NavBar";

const App = () => {
  const [isCollapsibleVisible, setCollapsibleVisible] = useState(true);
  const toggleCollapsible = () => {
    setCollapsibleVisible(!isCollapsibleVisible);
  };
  const src = ""
  const video_src = 'https://37c7a4898d68.ngrok.app'
  const default_src = src + "/api/code/get_default"
  const run_code_src = src + "/api/code/execute"
  const save_code_src = src + "/api/code/save"
  const [programs, setPrograms] = useState([])
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState(exercises[0] || null)
  const [activeTab, setActiveTab] = useState("0")
  const handleExerciseSelect = (exerciseClicked) => {
    const isAlreadyOpen = exercises.find(
      (exercise) => exercise.id === exerciseClicked.id,
    )?.isOpen;
    if (isAlreadyOpen) return;
    setExercises(
      exercises.map((exercise) => ({
        ...exercise,
        isOpen: exercise.id === exerciseClicked.id,
      })),
    );
    setSelectedExercise(exerciseClicked);
    setPrograms(exerciseClicked.programs);
    setActiveTab(exerciseClicked.programs[0].fileId);
  };
  const handleTabChange = (tab) => setActiveTab(tab);
  const getCurrentFile = () =>
    programs.filter((program) => program.fileId === activeTab)[0];
  const handleCodeChange = (event) => {
    console.log("activeTab: ", activeTab);
    getCurrentFile().code = event.target.value;
    setPrograms([...programs]);
  };
  const getCode = () => {
    let current_file = programs.filter(
      (file) => file.fileId === activeTab + "",
    )[0];
    if (current_file) return current_file.code;
    return "";
  };
  const saveCode = () => {
    const body_data = {
      exerciseId: selectedExercise.id + "",
      programId: activeTab,
      code: getCode().replaceAll("\n", "{new_line}"),
    };
    console.log("Sending code...", JSON.stringify(body_data));
    fetch(save_code_src, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body_data),
      mode: "no-cors",
    })
      .then((r) => r.json())
      .catch((err) => {
        console.log(err);
        // enable(false);
      });
  };
  const sendCode = () => {
    const body_data = {
      exerciseId: selectedExercise.id + "",
      programId: activeTab,
      code: getCode().replaceAll("\n", "{new_line}"),
    };
    console.log("Sending code...", JSON.stringify(body_data));
    fetch(run_code_src, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body_data),
      mode: "no-cors",
    })
      .then((r) => r.json())
      .catch((err) => {
        console.log(err);
        // enable(false);
      });
  };
  const addNewProgram = () => {
    // TODO: make request to add new file
    const newFileId = (programs.length + 1).toString();
    const newFile = {
      fileId: newFileId,
      name: "New File",
      code: "Code, here...",
    };
    setPrograms([...programs, newFile]);
    setActiveTab(newFileId);
  };
  const deleteProgram = (fileId) => {
    // TODO: make request to delete file
    if (programs.length <= 1) return;
    const updatedPrograms = programs.filter((file) => file.fileId !== fileId);
    setPrograms(updatedPrograms);
    if (activeTab === fileId) {
      setActiveTab(updatedPrograms.length > 0 ? updatedPrograms[0].fileId : "");
    }
  };
  useEffect(() => {
    fetch(default_src)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Network response was not ok, status: ${response.status}`,
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Data fetched successfully:", data);
        const fetched_programs = data.programs.map((program) => {
          return {
            fileId: program.fileId + "",
            name: program.name,
            code: program.code,
            exerciseId: program.exercise_id,
          };
        });
        const fetched_exercises = data.exercises.map((exercise) => {
          return {
            id: exercise.exercise_id,
            name: exercise.name,
            programs: fetched_programs.filter(
              (program) => program.exerciseId === exercise.exercise_id,
            ),
            content: exercise.content || "Exercise content here...",
            isOpen: exercise.exerciseId == 1 ? true : false, // used for the accordion
          };
        });
        setExercises(fetched_exercises);
        setSelectedExercise(exercises[0] || null);
        setPrograms(selectedExercise.programs);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);
  useEffect(() => {
    if (exercises) setSelectedExercise(exercises[0] || null);
  }, [exercises, selectedExercise]);
  // console.log(selectedExercise)
  return (
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
              <h2 class="text-lg font-semibold mx-3">Ejercicio 1</h2>
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
                <li><a href="#" class="lg:pb-2 border-b-2 border-blue-500">Primer archivo</a></li>
                <li><a href="#" class="lg:pb-2 text-gray-500">Segundo archivo</a></li>
                <li><a href="#" class="lg:pb-2 text-gray-500">Versión definitiva</a></li>
              </ul>
            </div>
            {/* <!-- Code Editor --> */}
            <textarea
              class="w-full h-60 border border-gray-300 mt-4 rounded-md p-2 font-mono text-sm text-black bg-gray-50"
              spellcheck="false">
              I
              S 6
              P 2
              B 3
              F 
            </textarea>
            <div class="flex space-x-4 mt-4">
              <button class="px-4 py-2 bg-blue-500 text-white rounded-md">Guardar</button>
              <button class="px-4 py-2 bg-blue-500 text-white rounded-md">Ejecutar</button>
            </div>
          </section>
          {/* <!-- Live Video Section --> */}
          <section class="lg:w-1/3 sm:w-2/3 p-6">
            <div class="shadow-md p-4">
              <div class="flex justify-between items-center">
                <h2 class="text-lg font-semibold mx-5">Video en vivo</h2>
                <button class="px-4 py-2 bg-purple-500 text-white rounded-md mx-3">Mostrar/Ocultar</button>
              </div>
              {/* <VideoPlayer streamUrl={video_src}/> */}
              <VideoPlayer src="https://www.w3schools.com/html/mov_bbb.mp4" />
            </div>
          </section>
      </main>

      {/* <!-- Footer --> */}
      <footer class="shadow-md py-4 text-center text-sm">
        Pie de Página Copyright Educatrónica
      </footer>
    </div>
  );
};

render(<App />, document.getElementById("root"));
