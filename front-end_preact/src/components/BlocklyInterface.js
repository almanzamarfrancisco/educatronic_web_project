import { h } from 'preact'
import { useEffect, useRef } from "preact/hooks"
import * as Blockly from "blockly/core"
import { javascriptGenerator } from "blockly/javascript"
import useAppStore, { useCurrentProgram, useCurrentCode, useCompileOutput } from "../store"
import { LexicalAnalyzer } from "../utils/LexicalAnalyzer"

export const lexer = new LexicalAnalyzer()

export function updateBlocksFromCode(workspace, code) {
    workspace.clear()
    const blockMapping = lexer.commandTable.map((command) => ({
        token: command.token,
        type: command.blocklyType,
        blocklyUnits: command.blocklyArgs0?.[0].name || '',
    }))
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
        const commandExists = blockMapping.filter((block) => block.token === command)
        if (commandExists.length === 1) {
            if (commandExists[0].type === "end_loop") {
                repeatActive = false
                return
            }
            const block = workspace.newBlock(commandExists[0].type)
            if (value !== null && commandExists[0].blocklyUnits) {
                const field = commandExists[0].blocklyUnits
                if(commandExists[0].type === "loop"){
                    repeatActive = true
                    repeatBlock = block
                } // else return
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
            } else if (previousBlock && previousBlock.nextConnection && block.previousConnection) {
                previousBlock.nextConnection.connect(block.previousConnection)
            }
            previousBlock = block 
        }
    })
    workspace.render()
}
export function getCodeFromBlocks(workspace) {
    return javascriptGenerator.workspaceToCode(workspace).trim()
}
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
            workspaceBackgroundColour: "#fff", // Dark mode background
            toolboxBackgroundColour: "#1E1E1E",
            toolboxForegroundColour: "#FFFFFF",
            flyoutBackgroundColour: "#1E1E1E",
            flyoutForegroundColour: "#FFFFFF",
            scrollbarColour: "#CCC",
        },
        fontStyle: {
            family: "Fredoka, sans-serif",
            weight: "bold",
            size: 14,
        },
    })
    const customToolbox = `<xml>
                    ${lexer.commandTable.filter((command) => command.blocklyType !== 'end_loop').
                        map((command) => {
                            return `<block type="${command.blocklyType}"></block>`
                        }).join("")}
                    }
                </xml>`
    let simpleTokens = lexer.commandTable.filter(
        (command) => command.role === lexer.CMD_REGULAR)
    simpleTokens = simpleTokens.map((command) => {
        if(command.param_count > 0)
            return {
                type: command.blocklyType,
                message0: `${command.token} %1 ${command.blocklyArgs0[0].name}`,//command.blocklyMessage0,
                args0: command.blocklyArgs0,
                previousStatement: null,
                nextStatement: null,
                colour: command.blocklyColour,
            }
        return {
            type: command.blocklyType,
            message0: command.blocklyMessage0,
            previousStatement: null,
            nextStatement: null,
            colour: command.blocklyColour,
        }
    })
    let openerProgamTokens = lexer.commandTable.filter(
        (command) => command.role === lexer.CMD_PROGRAM_START)
    openerProgamTokens = openerProgamTokens.map((command) => ({
            type: command.blocklyType,
            message0: command.token,
            nextStatement: null,
            colour: command.blocklyColour,
        }))
    let closerProgamTokens = lexer.commandTable.filter(
        (command) => command.role === lexer.CMD_PROGRAM_END)
    closerProgamTokens = closerProgamTokens.map((command) => ({
            type: command.blocklyType,
            message0: command.token,
            colour: command.blocklyColour,
            previousStatement: null,
        }))
    let openerTokens = lexer.commandTable.filter(
        (command) => command.role === lexer.CMD_BLOCK_START)
    openerTokens = openerTokens.map((command) => ({
        type: command.blocklyType,
        message0: command.blocklyMessage0,
        args0: command.blocklyArgs0,
        message1:command.blocklyMessage1,
        args1: command.blocklyArgs1,
        previousStatement: null,
        nextStatement: null,
        colour: command.blocklyColour,
    }))
    useEffect(() => {
        Blockly.defineBlocksWithJsonArray([
            ...openerProgamTokens,
            ...simpleTokens,
            ...openerTokens,
            ...closerProgamTokens,
        ])
        const workspace = Blockly.inject("blocklyDiv", {
            toolbox: customToolbox,
            theme: customTheme,
            grid: { spacing: 20, length: 2, colour: "#333", snap: true },
        })
        lexer.commandTable.filter((command) => command.blocklyType !== 'end_loop' && command.blocklyType !== 'loop').map((command) => {
            if(command.param_count > 0)
                javascriptGenerator.forBlock[command.blocklyType] = (block) => `${command.token} ${block.getFieldValue(command.blocklyUnits)}\n`
            else
                javascriptGenerator.forBlock[command.blocklyType] = () => `${command.token}\n`
        })
        javascriptGenerator.forBlock["loop"] = (block) => {
            const times = block.getFieldValue("TIMES")
            const statements = javascriptGenerator.statementToCode(block, "DO")
            return `REPETIR ${times}\n${statements}FIN_REPETIR\n`
        }
        editorRef.current = getCodeFromBlocks(workspace)
        return () => workspace.dispose()
    }, [])
    useEffect(() => {
        const workspace = Blockly.getMainWorkspace()
        if (!workspace) return
        if (currentProgram?.content) {
            updateBlocksFromCode(workspace, currentProgram.content)
            previousCodeRef.current = currentProgram.content
            setCurrentCode(currentProgram.content)
            console.log(`Updated blocks from program content: ${currentProgram.content}`)
        }
        const listener = () => {
            const code = getCodeFromBlocks(workspace)
            setCurrentCode(code)
        }
        workspace.addChangeListener(listener)

        return () => {
            workspace.removeChangeListener(listener)
        }
    }, [currentProgram, setCurrentProgram, setCurrentCode])
    return (
        <div className="flex flex-col items-center w-full">
            <div id="blocklyDiv" style={{ height: "500px" }} className="w-full pt-5" />
            {/* Output section */}
            <div className="flex-col space-x-4 mt-4 py-1 px-5 w-full h-min-10" style="background-color: #7498b6; color: #012e46">
                <span className="font-bold">Consola: </span>
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
