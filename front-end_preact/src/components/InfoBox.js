import { h } from 'preact';
import infoIcon from '../assets/images/Infobox_info_icon.svg';
import AccordionSelection from './AccordionSelection';

const InfoBox = ({ exercises, onSelectExercise }) => {
    return (
        <div className="flex flex-col h-full p-3">
            <div className="flex items-center">
                <img class="h-12 w-12 m-2 flex flex-row" src={infoIcon} alt="Info" loading="lazy" style="width: 1.5rem;height: 1.5rem"/>
                <h2 className="text-lg font-bold flex flex-row bg-gradient-to-br from-sky-500 to-cyan-400 bg-clip-text text-transparent">
                    Ejercicios para practicar
                </h2>
            </div>
            <p> =&gt; Aquí podrás encontrar los ejercicios y progresar. </p>
            <p className="mb-3"> =&gt; Presiona el botón ejecutar {/* or press the enter key */} y mira en el video la ejecución</p>
            <p className="mb-3"> =&gt; Puedes tener hasta 5 programas en cada ejercicio y puedes guardarlos solo con el botón 'Guardar'</p>
            <AccordionSelection exercises={exercises} onSelectExercise={onSelectExercise}/>
        </div>
    );
};

export default InfoBox;
