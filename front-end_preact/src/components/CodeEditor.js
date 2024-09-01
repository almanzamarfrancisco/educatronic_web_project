import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import addFileIcon from '../assets/images/file-new-icon.svg';
import { act } from 'preact/test-utils';

const CodeEditor = ({
    programs,
    activeTab,
    handleTabChange,
    handleCodeChange,
    getCode = () => {},
    addNewProgram,
    deleteProgram,
    sendCode,
    saveCode
}) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex">
                {programs.map((program) => (
                        <span>
                            <button
                                key={program.fileId}
                                onClick={() => handleTabChange(program.fileId)}
                                className={`pl-4 pr-1 py-2 border-b-2 rounded-md ${
                                    activeTab === program.fileId ? 'border-blue-500 text-blue-500' : 'border-transparent text-white border-gray-500'
                                }`}
                            >
                                {program.name + ' '}
                            </button>
                            { activeTab === program.fileId && <button
                                onClick={
                                    () => deleteProgram(program.fileId)
                                }
                                className="border-red-500 text-red-500"
                            >X</button>}
                        </span>
                    ))}
                <button
                    onClick={() => addNewProgram()}
                    className={`border-transparent text-white border-gray-500`}
                >
                    <img class="m-2 flex flex-row" src={addFileIcon} alt="add file" loading="lazy" style="width: 1.5rem;height: 1.5rem"/>
                </button>
            </div>
            <textarea
                value={getCode().replaceAll('{new_line}', '\n')}
                onChange={handleCodeChange}
                className="flex-grow h-100 p-2 bg-gray-900 text-white font-mono border-2 border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder={activeTab != null ?'Select an Exercise first!':'Start typing your code here...'}
            />
            <div className="w-100 flex justify-between" >
                <button className="my-4 p-1 w-1/2 m-3 bg-blue-500 text-white rounded-md" onClick={saveCode}>
                    Save
                </button>
                <button className="my-4 p-1 w-1/2 m-3 bg-blue-500 text-white rounded-md" onClick={sendCode}>
                    Run
                </button>
            </div>
        </div>
    )
}

export default CodeEditor
