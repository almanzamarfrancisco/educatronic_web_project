import { h } from 'preact'
import { useEffect, useRef } from "preact/hooks"
import * as Blockly from "blockly/core"
import { javascriptGenerator } from "blockly/javascript"
import useAppStore, { useCurrentProgram, useCurrentCode, useCompileOutput } from "../store"

const BlocklyInterface = () => {
    const { setCurrentProgram, setCurrentCode } = useAppStore()
    const currentProgram = useCurrentProgram()
    const currentCode = useCurrentCode()
    const compileOutput = useCompileOutput()
    const editorRef = useRef(null)
    const previousCodeRef = useRef(currentProgram ? currentProgram.content : "")
    const customTheme = Blockly.Theme.defineTheme("customTheme", {
        base: Blockly.Themes.Classic,
        componentStyles: {
            workspaceBackgroundColour: "#121212", // Dark mode background
            toolboxBackgroundColour: "#1E1E1E",
            toolboxForegroundColour: "#FFFFFF",
            flyoutBackgroundColour: "#1E1E1E",
            flyoutForegroundColour: "#FFFFFF",
            scrollbarColour: "#FF6F00",
        },
        fontStyle: {
            family: "Fredoka, sans-serif",
            weight: "bold",
            size: 14,
        },
    })
    const updateBlocksFromCode = (workspace, code) => {
        workspace.clear()
        const blockMapping = {
            "INICIO": "begin",
            "SUBIR": "up",
            "BAJAR": "down",
            "PAUSA": "wait",
            "ABRIR": "open",
            "FIN": "end",
            "REPETIR": "repeat",
            "FIN_REPETIR": "end_repeat",
        }
        const lines = code.trim().split("\n")
        let previousBlock = null
        let yOffset = 10
        let repeatBlock = null
        let repeatActive = false
        lines.forEach((line, index) => {
            line = line.trim()
            const parts = line.split(" ")
            const command = parts[0]
            const value = parts[1] ? parseInt(parts[1]) : null
            if (blockMapping[command]) {
                if (command === "FIN_REPETIR") {
                    repeatActive = false
                    return
                }
                const block = workspace.newBlock(blockMapping[command])
                if (value !== null) {
                    let field = ''
                    if(command === "SUBIR" || command === "BAJAR")
                        field = "FLOORS"
                    else if(command === "PAUSA")
                        field = "SECONDS"
                    else if(command === "REPETIR"){
                        field = "TIMES"
                        repeatActive = true
                        repeatBlock = block
                    } else return
                    block.setFieldValue(value, field)
                }
                block.moveBy(50, yOffset)
                yOffset += 60
                block.initSvg()
                block.render()
                if (repeatActive && previousBlock && repeatBlock && previousBlock === repeatBlock && repeatBlock.getInput("DO")) {
                    repeatBlock.getInput("DO").connection.connect(block.previousConnection)
                } else if(!repeatActive && previousBlock && repeatBlock){
                    repeatBlock.nextConnection.connect(block.previousConnection)
                    repeatBlock = null
                }else if (previousBlock && previousBlock.nextConnection && block.previousConnection) {
                    previousBlock.nextConnection.connect(block.previousConnection)
                }
                previousBlock = block 
            }
        })
        workspace.render()
    }
    const getCodeFromBlocks = (workspace) => {
        return javascriptGenerator.workspaceToCode(workspace).trim()
    }
    useEffect(() => {
        Blockly.defineBlocksWithJsonArray([
            {
                type: "begin",
                message0: "INICIO",
                nextStatement: null,
                colour: '#e9dc3c',
            },
            {
                type: "up",
                message0: "SUBIR %1 pisos",
                args0: [{ type: "field_number", name: "FLOORS", value: 1, min: 0, max: 7 }],
                previousStatement: null,
                nextStatement: null,
                colour: '#3464a1',
            },
            {
                type: "down",
                message0: "BAJAR %1 pisos",
                args0: [{ type: "field_number", name: "FLOORS", value: 1, min: 0, max: 7 }],
                previousStatement: null,
                nextStatement: null,
                colour: '#1c8c49',
            },
            {
                type: "wait",
                message0: "PAUSA %1 segundos",
                args0: [{ type: "field_number", name: "SECONDS", value: 1, min: 0 }],
                previousStatement: null,
                nextStatement: null,
                colour: '#eb8b2c',
            },
            {
                type: "open",
                message0: "ABRIR puertas",
                previousStatement: null,
                nextStatement: null,
                colour: 180,
            },
            {
                type: "end",
                message0: "FIN",
                previousStatement: null,
                colour: '#d9232a',
            },
            {
                type: "repeat",
                message0: "REPETIR %1 veces",
                args0: [{ type: "field_number", name: "TIMES", value: 1, min: 1 }],
                message1: "%1",
                args1: [{ type: "input_statement", name: "DO" }],
                previousStatement: null,
                nextStatement: null,
                colour: '#812c7d',
            },
        ])
        const workspace = Blockly.inject("blocklyDiv", {
        toolbox: `
            <xml>
                <block type="begin"></block>
                <block type="up"></block>
                <block type="down"></block>
                <block type="wait"></block>
                <block type="open"></block>
                <block type="end"></block>
                <block type="repeat"></block>
                </xml>
        `,
        theme: customTheme,
        grid: { spacing: 20, length: 2, colour: "#333", snap: true },
        })
        javascriptGenerator.forBlock["begin"] = () => "INICIO\n"
        javascriptGenerator.forBlock["up"] = (block) => `SUBIR ${block.getFieldValue("FLOORS")}\n`
        javascriptGenerator.forBlock["down"] = (block) => `BAJAR ${block.getFieldValue("FLOORS")}\n`
        javascriptGenerator.forBlock["wait"] = (block) => `PAUSA ${block.getFieldValue("SECONDS")}\n`
        javascriptGenerator.forBlock["open"] = () => "ABRIR\n"
        javascriptGenerator.forBlock["end"] = () => "FIN\n"
        editorRef.current = getCodeFromBlocks(workspace)
        javascriptGenerator.forBlock["repeat"] = (block) => {
            const times = block.getFieldValue("TIMES")
            const statements = javascriptGenerator.statementToCode(block, "DO")
            return `REPETIR ${times}\n${statements}FIN_REPETIR\n`
        }
        return () => workspace.dispose()
    }, [])
    useEffect(() => {
        const workspace = Blockly.getMainWorkspace()
        const updateCode = () => {
            const code = getCodeFromBlocks(workspace)
            console.log(`This is the code: \n "${code}"`)
            setCurrentCode(code)
            if (!currentProgram) {
                console.log(`I have to save the code in a new file`)
            } else if (previousCodeRef.current !== currentCode) {
                // console.log(`Code updated: ${code}`)
            }
        }
        workspace.addChangeListener(updateCode)
        if (currentProgram?.content) {
            updateBlocksFromCode(workspace, currentProgram?.content)
        }
        if (editorRef.current && currentProgram) {
            editorRef.current.setValue(currentProgram.content || "")
            previousCodeRef.current = currentProgram.content
            setCurrentCode(currentProgram.content)
        }
    }, [currentProgram, setCurrentProgram, setCurrentCode])
    return (
        <div className="flex flex-col items-center w-full">
            <div id="blocklyDiv" style={{ height: "500px" }} className="w-full pt-5" />
            {/* Output section */}
            <div className="flex-col space-x-4 mt-4 py-1 px-5 w-full bg-slate-800 h-min-10">
                <span>Consola: </span>
                <p
                className="my-3 py-5 text-base"
                style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }} 
                >
                { compileOutput }
                </p>
            </div>
        </div>
    )
}

export default BlocklyInterface
