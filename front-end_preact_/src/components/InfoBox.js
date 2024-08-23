import { h } from 'preact';
import infoIcon from '../assets/images/Infobox_info_icon.svg';
import RobotSelection from './RobotSelection';

const InfoBox = ({ robots, onRobotSelect }) => {
    return (
        <div className="flex flex-col h-full p-3">
            <div className="flex items-center">
                <img class="h-12 w-12 m-2 flex flex-row" src={infoIcon} alt="Info" loading="lazy" style="width: 1.5rem;height: 1.5rem"/>
                <h2 className="text-lg font-bold flex flex-row bg-gradient-to-br from-sky-500 to-cyan-400 bg-clip-text text-transparent">Robots you can program</h2>
            </div>
            <p>Here, you can find the robots you can programm with the sintaxes described,</p>
            <p className="mb-3">hit the run button {/* or press the enter key */} and watch in the video the execution</p>
            <RobotSelection robots={robots} onRobotSelect={onRobotSelect}/>
        </div>
    );
};

export default InfoBox;
