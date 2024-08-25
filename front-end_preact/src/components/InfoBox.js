import { h } from 'preact';
import infoIcon from '../assets/images/Infobox_info_icon.svg';
import AccordionSelection from './AccordionSelection';

const InfoBox = ({ exercises, onSelectExercise }) => {
    return (
        <div className="flex flex-col h-full p-3">
            <div className="flex items-center">
                <img class="h-12 w-12 m-2 flex flex-row" src={infoIcon} alt="Info" loading="lazy" style="width: 1.5rem;height: 1.5rem"/>
                <h2 className="text-lg font-bold flex flex-row bg-gradient-to-br from-sky-500 to-cyan-400 bg-clip-text text-transparent">
                    Exercises to practice
                </h2>
            </div>
            <p> => Here, you can find the exercises and make progress. </p>
            <p className="mb-3"> => Hit the run button {/* or press the enter key */} and watch in the video the execution</p>
            <p className="mb-3"> => You can have up to 5 programs in each exercise and you can save them only with the 'Save' button</p>
            <AccordionSelection exercises={exercises} onSelectExercise={onSelectExercise}/>
        </div>
    );
};

export default InfoBox;
