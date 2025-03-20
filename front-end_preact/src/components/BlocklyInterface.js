import { h } from 'preact';
import { useEffect, useRef } from "preact/hooks";
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import useAppStore, { useCurrentProgram, useCurrentCode, useCompileOutput } from "../store";

const BlocklyInterface = () => {
    const { setCurrentProgram, setCurrentCode } = useAppStore()
    const currentProgram = useCurrentProgram()
    const currentCode = useCurrentCode()
    const compileOutput = useCompileOutput()
    const editorRef = useRef(null)
    const previousCodeRef = useRef(currentProgram ? currentProgram.content : "")
    const customTheme = Blockly.Theme.defineTheme("customTheme", {
        base: Blockly.Themes.Classic,
        blockStyles: {
        logic_blocks: { colourPrimary: "#FF6F00" }, // Example: Orange logic blocks
        loop_blocks: { colourPrimary: "#1E88E5" }, // Example: Blue loop blocks
        math_blocks: { colourPrimary: "#D81B60" }, // Example: Pink math blocks
        text_blocks: { colourPrimary: "#43A047" }, // Example: Green text blocks
        variable_blocks: { colourPrimary: "#E53935" }, // Example: Red variable blocks
        },
        categoryStyles: {
        logic_category: { colour: "#FF6F00" },
        loop_category: { colour: "#1E88E5" },
        math_category: { colour: "#D81B60" },
        text_category: { colour: "#43A047" },
        variable_category: { colour: "#E53935" },
        },
        componentStyles: {
        workspaceBackgroundColour: "#121212", // Dark mode background
        toolboxBackgroundColour: "#1E1E1E",
        toolboxForegroundColour: "#FFFFFF",
        flyoutBackgroundColour: "#1E1E1E",
        flyoutForegroundColour: "#FFFFFF",
        scrollbarColour: "#FF6F00",
        },
        fontStyle: {
            family: "Poppins, sans-serif",
            weight: "bold",
            size: 14,
        },
        blockStyles: {
            logic_blocks: {
                colourPrimary: "#FF6F00",
                hat: "rounded", 
            }
        }
    });
    const updateBlocksFromCode = (workspace, code) => {
        workspace.clear();
        const blockMapping = {
        "INICIO": "begin",
        "SUBIR": "up",
        "BAJAR": "down",
        "PAUSA": "wait",
        "ABRIR": "open",
        "FIN": "end",
        }
        const lines = code.trim().split("\n")
        let previousBlock = null
        let yOffset = 10
        lines.forEach((line, index) => {
        const parts = line.split(" ")
        const command = parts[0]
        const value = parts[1] ? parseInt(parts[1]) : null
        if (blockMapping[command]) {
            const block = workspace.newBlock(blockMapping[command])
            if (value !== null) {
            block.setFieldValue(value, command === "SUBIR" || command === "BAJAR" ? "FLOORS" : "SECONDS")
            }
            block.moveBy(50, yOffset)
            yOffset += 60
            block.initSvg()
            block.render()
            if (previousBlock && previousBlock.nextConnection && block.previousConnection) {
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
            colour: 120,
        },
        {
            type: "up",
            message0: "SUBIR %1 pisos",
            args0: [{ type: "field_number", name: "FLOORS", value: 1, min: 0, max: 7 }],
            previousStatement: null,
            nextStatement: null,
            colour: 230,
        },
        {
            type: "down",
            message0: "BAJAR %1 pisos",
            args0: [{ type: "field_number", name: "FLOORS", value: 1, min: 0, max: 7 }],
            previousStatement: null,
            nextStatement: null,
            colour: 230,
        },
        {
            type: "wait",
            message0: "PAUSA %1 segundos",
            args0: [{ type: "field_number", name: "SECONDS", value: 1, min: 0 }],
            previousStatement: null,
            nextStatement: null,
            colour: 60,
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
            colour: 120,
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
        return () => workspace.dispose()
    }, [])
    useEffect(() => {
        const workspace = Blockly.getMainWorkspace()
        const updateCode = () => {
            const code = getCodeFromBlocks(workspace)
            // console.log(`This is the code: \n "${code}"`)
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
            <div id="blocklyDiv" style={{ height: "300px", width: "100%" }} />
            <div className="flex-col space-x-4 mt-4 p-1 w-full container bg-slate-800">
                <span>Consola: </span>
                <pre className="overflow-y-auto block overflow-auto my-5 relative">{ compileOutput }</pre>
            </div>
        </div>
    )
};

export default BlocklyInterface;
