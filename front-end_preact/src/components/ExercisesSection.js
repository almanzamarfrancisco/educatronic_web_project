import { h } from 'preact'
import useAppStore from '../store'
import gears from "../assets/images/gears.png"

const ExercisesSection = ({ handleExerciseListChange }) => {
    const { exercises = [], currentExercise = null } = useAppStore()

    return (
        <div>
            <div className="flex items-center justify-start mb-4">
                <h2 className="text-4xl mx-3 whitespace-normal">
                    <img
                        src={gears}
                        className="h-10 w-15 mx-2 flex-none inline"
                        alt="Engranes"
                        loading="lazy"
                    />
                    <span className="font-semibold">
                        {currentExercise?.name || 'Selecciona un ejercicio para ver su contenido'}
                    </span>
                </h2>
                <div className="flex items-center space-x-2 ml-10">
                    <select
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm text-black w-25"
                        style="background-color: rgb(116, 152, 182); color: rgb(1, 46, 70);"
                        value={currentExercise?.id || ''}
                        onChange={(e) => handleExerciseListChange(e.target.value)}
                    >
                        <option value="" disabled>
                            {!exercises.length
                                ? 'No hay ejercicios para mostrar'
                                : 'Lista de Ejercicios'}
                        </option>
                        {exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                                {exercise.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Exercise description */}
            <div className="justify-between mx-3 my-5 flex">
                <div className="space-x-4 mx-3 my-5 flex-row">
                    {currentExercise ? (
                        currentExercise.content.split('\n').map((line, index) => (
                            <p key={index}>
                                {line}
                                <br />
                            </p>
                        ))
                    ) : (
                        <pre>Cuando selecciones un ejercicio aquí se mostrará su contenido</pre>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ExercisesSection
