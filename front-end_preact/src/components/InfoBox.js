import { h } from 'preact'
import useAppStore from '../store'

const InfoBox = () => {
    const { isInfoBoxExpanded, setInfoBoxExpanded } = useAppStore()
    return (
      <div>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isInfoBoxExpanded ? 'max-h-[2000px]' : 'max-h-[225px]'} bg-cyan-900 border-t-2 border-l-2 border-r border-gray-300 rounded-t-lg shadow-md p-5`}> 
          <h1 className="text-4xl mx-1 px-1">¿Cómo programar el robot?</h1>
          <p className="py-2">
            Tienes 2 opciones para programar el robot:
            <ul className="list-disc list-inside">
              <li>Usar el editor de bloques</li>
              <li>Usar el editor de texto</li>
            </ul>
            puedes cambiar entre ambos haciendo click en el switch de "Modo de bloques"
          </p>
          <p className="py-2">
            La sintaxis de los comandos es la siguiente (siempre en mayúsculas):
            <ul className="list-disc list-inside">
              <li>INICIO → Para iniciar el programa</li>
              <li>FIN → Para finalizar el programa</li>
              <li>SUBIR [número] → para subir la cantidad de pisos especificada en el número</li>
              <li>BAJAR [número] → para bajar la cantidad de pisos especificada en el número</li>
              <li>PAUSA [número] → para hacer una pausa en la ejecución en segundos</li>
              <li>ABRIR para abrir o cerrar las puertas</li>
              <li>REPETIR [n] [instrucciones] FIN_REPETIR → Este es un loop que repetirá todo las instrucciones entre REPETIR y FIN_REPETIR </li>
            </ul>
            <span className="decoration-1 underline">Todas las instrucciones tiene su correspondiente bloque en el editor de bloques.</span>
          </p>
          <p className="py-2">
            Zona de edición de código:
            <ul className="list-disc list-inside">
              <li>Crea nuevos archivos con el botón de "Nuevo archivo"</li>
              <li>Selecciona un archivo para ver y usar el botón "Cambiar nombre"</li>
              <li>Selecciona un archivo para ver y usar el botón "Borrar archivo"</li>
              <li>Haz clic en el botón "Guardar" sólo para guardar tu archivo y no perderlo.</li>
              <li>Haz clic en el botón "Ejecutar" para compilar y ejecutar tu código.</li>
              <li>Si el código tiene errores de sintaxis, se mostrarán en la consola de salida, ubicada en la parte inferior de la pantalla.</li>
            </ul>
          </p>
        </div>
        <div className="flex justify-center bg-cyan-900 border-b-2 border-l-2 border-r-2 border-gray-300 rounded-b-lg shadow-md p-5">
          <button
            onClick={() => setInfoBoxExpanded(!isInfoBoxExpanded)}
            className="text-lg self-center px-4 py-2 bg-violet-800 hover:bg-violet-900 text-white rounded hover:bg-blue-600 transition-colors duration-300"
          >
          {isInfoBoxExpanded ? '↑' : '↓'}
          </button>
        </div>
      </div>
    )
}

export default InfoBox
