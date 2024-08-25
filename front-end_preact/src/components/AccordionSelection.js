import { h } from 'preact';
import numberOneImage from '../assets/images/number-one.png';
import numerTwoImage from '../assets/images/number-two.png';

const AccordionSelection = ({ exercises, onSelectExercise }) => {
    const robotImages = [numberOneImage, numerTwoImage];
    return (
        <div id="accordion-collapse" data-accordion="collapse">
            {exercises.map((exercise) => (
                <div key={exercise.id}>
                    <h2 id={`accordion-collapse-heading-${exercise.id}`}>
                        <button
                            type="button"
                            class="flex items-center justify-between w-full py-2 pr-2 font-medium text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 dark:focus:ring-gray-800 dark:border-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 gap-3"
                            data-accordion-target={`#accordion-collapse-body-${exercise.id}`}
                            aria-expanded={exercise.isOpen}
                            aria-controls={`accordion-collapse-body-${exercise.id}`}
                            onClick={() => onSelectExercise(exercise)}
                        >
                            <span className="flex items-center">
                                <img class="h-12 w-12 m-2" src={robotImages[exercise.id-1]} alt="logo" loading="lazy"/>
                                <h2 className="text-lg font-bold bg-gradient-to-br from-sky-500 to-cyan-400 bg-clip-text text-transparent">{exercise.name}</h2>
                            </span>
                            <svg
                                data-accordion-icon
                                class={`w-3 h-3 ${exercise.isOpen ? '' : 'rotate-180'} shrink-0`}
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 10 6"
                            >
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                            </svg>
                        </button>
                    </h2>
                    <div
                        id={`accordion-collapse-body-${exercise.id}`}
                        class={`${exercise.isOpen ? '' : 'hidden'}`}
                        aria-labelledby={`accordion-collapse-heading-${exercise.id}`}
                    >
                        <div class="py-5 px-2 border border-b-0 border-gray-200 rounded-b-lg dark:border-gray-700 dark:bg-gray-900">
                            <p class="mb-2 text-gray-500 dark:text-gray-400">{exercise.content}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AccordionSelection;