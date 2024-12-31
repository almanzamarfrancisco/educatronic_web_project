import { h } from 'preact';

const InfoBox = () => {
    return (
        <div>
            <div class="flex items-center space-x-2">
                <label class="flex items-center space-x-2">
                    <span>Modo de Bloques</span>
                    <input type="checkbox" class="toggle-checkbox"/>
                </label>
                <select class="border border-gray-300 rounded-md px-2 py-1 text-sm text-black">
                    <option>Lista de Ejercicios (Sin ejercicio)</option>
                    <option>Ejercicio 1</option>
                    <option>Ejercicio 2</option>
                    <option>Ejercicio 3</option>
                </select>
            </div>
            <div class="flex space-x-4 mx-3 my-5">
                lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
        </div>
    );
};

export default InfoBox;
