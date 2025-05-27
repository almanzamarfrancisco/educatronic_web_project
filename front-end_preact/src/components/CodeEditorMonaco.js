import { h } from 'preact'
import { useEffect, useRef, useState } from "preact/hooks"
import Editor from "@monaco-editor/react"
import * as monaco from "monaco-editor"
import useAppStore, { useCurrentCode, useCurrentProgram, useCompileOutput } from '../store'
import { LexicalAnalyzer } from "../utils/LexicalAnalyzer";

const CodeEditor = () => {
  const editorRef = useRef(null)
  const [theme, setTheme] = useState("automataDark")
  const { setCurrentCode } = useAppStore()
  const currentCode = useCurrentCode()
  const currentProgram = useCurrentProgram()
  const compileOutput = useCompileOutput()
  const previousCodeRef = useRef(currentProgram ? currentProgram.content : "")
  const lexer = new LexicalAnalyzer()
  const validateAutomataSyntax = (editor, monaco) => {
    const model = editor.getModel()
    if (!model) return
    const text = model.getValue()
    const lines = text.split("\n")
    let markers = []
    let multiLineComment = false
    lines.forEach((line, lineNumber) => {
      if (line.startsWith("//")) return
      if (line.startsWith("/*")) multiLineComment = true
      if (multiLineComment) return
      if (line.endsWith("*/")) multiLineComment = false
      const [command, arg] = line.trim().split(/\s+/)
      const cmd = lexer.getCommandByToken(command)
      if(!cmd) {
        markers.push({
          startLineNumber: lineNumber + 1,
          startColumn: 1,
          endLineNumber: lineNumber + 1,
          endColumn: line.length + 1,
          message: `Error de sintaxis: "${command}" no es un comando válido.`,
          severity: monaco.MarkerSeverity.Error,
        })
        return
      }
      const validCommand = lexer.validateLine(cmd, arg, lineNumber + 1)
      if (validCommand === true) return
      markers.push({
        startLineNumber: lineNumber + 1,
        startColumn: 1,
        endLineNumber: lineNumber + 1,
        endColumn: line.length + 1,
        message: validCommand,
        severity: monaco.MarkerSeverity.Error,
      })
    })
    monaco.editor.setModelMarkers(model, "owner", markers)
  }
  const options = {
    scrollBeyondLastLine: false,
    scrollbar: {
      vertical: 'auto',
    },
    wordWrap: "on",
    minimap: { enabled: false }
  }
  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor
    editor.onDidChangeModelContent(() => {
      validateAutomataSyntax(editor, monacoInstance)
    })

    monacoInstance.languages.register({
      id: "automataLang",
      extensions: [".educatronica"],
      aliases: ["Automata Language", "automataLang"],
      mimetypes: ["text/x-automata"]
    })
    let allTokens = `(`
    allTokens += lexer.commandTable.map((command, index) => {
      if (index === 0) return `${command.token}`
      return `|${command.token}`
    })
    allTokens += `)`
    allTokens = allTokens.replaceAll(',', '')
    allTokens = allTokens.replaceAll('|', '\\b|')
    let tokensWithArgs = lexer.commandTable.filter((command) => command.param_count > 0)
    tokensWithArgs = tokensWithArgs.map((command) => {
      return [`\\b${command.token}\\s+\\${command.parameters.join("\\s+|\\$")}`, "keyword"]
    })
    let openerTokens = lexer.commandTable.filter(
      (command) => command.role === lexer.CMD_PROGRAM_START || 
      command.role === lexer.CMD_BLOCK_START)
    openerTokens = openerTokens.map((command) => ({
      beforeText: new RegExp(`^\\s*${command.token}\\s*${command.parameters.join("\\s+|\\").replaceAll('^', '')}`),
      action: { indentAction: monacoInstance.languages.IndentAction.Indent }
    }))
    let closerTokens = lexer.commandTable.filter(
      (command) => command.role === lexer.CMD_PROGRAM_END ||
      command.role === lexer.CMD_BLOCK_END)
    closerTokens = closerTokens.map((command) => ({
      beforeText: new RegExp(`^\\s*${command.token}\\s*${command.parameters.join("\\s+|\\").replaceAll('^', '')}$`),
      action: { indentAction: monacoInstance.languages.IndentAction.Outdent }
    }))
    monacoInstance.languages.setMonarchTokensProvider("automataLang", {
      tokenizer: {
        root: [
          [new RegExp(`\\b${allTokens}\\b`, "i"), "keyword"],
          ...tokensWithArgs, 
          [/\b[0-9]+\b/, "number"],
          [/\/\/.*/, "comment"],
          [/\/\*/, "comment", "@comment"],
          [/\s+/, "white"]
        ],
        comment: [
          [/\*\//, "comment", "@pop"],
          [/./, "comment"]
        ]
      }
    })

    monacoInstance.languages.setLanguageConfiguration("automataLang", {
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"]
      },
      comment: {
        lineComment: "//",
        blockComment: ["/*", "*/"]
      },
      onEnterRules: [
        ...openerTokens,
        ...closerTokens,
      ]
    })

    monacoInstance.editor.defineTheme("automataDark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "FF6F00", fontStyle: "bold" },
        { token: "number", foreground: "007FFF", fontStyle: "bold" },
        { token: "comment", foreground: "5A5A5A", fontStyle: "italic" }
      ],
      colors: {
        "editor.foreground": "#FFFFFF",
        "editor.background": "#1E1E1E",
        "editor.lineHighlightBackground": "#33333350"
      }
    })

    monacoInstance.editor.defineTheme("automataLight", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "00B2E8", fontStyle: "bold" },
        { token: "number", foreground: "1E88E5", fontStyle: "bold" },
        { token: "comment", foreground: "757575", fontStyle: "italic" }
      ],
      colors: {
        "editor.foreground": "#000000",
        "editor.background": "#FFFFFF",
        "editor.lineHighlightBackground": "#EEEEEE"
      }
    })

    monacoInstance.editor.defineTheme("automataHighContrast", {
      base: "hc-black",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "FFD700", fontStyle: "bold" },
        { token: "number", foreground: "00FFFF", fontStyle: "bold" },
        { token: "comment", foreground: "FF69B4", fontStyle: "italic" }
      ],
      colors: {
        "editor.foreground": "#FFFFFF",
        "editor.background": "#000000",
        "editor.lineHighlightBackground": "#444444"
      }
    })

    monacoInstance.editor.setTheme(theme)
  }

  const themes = [
    { id: "automataDark", name: "Oscuro" },
    { id: "automataLight", name: "Claro" },
    { id: "automataHighContrast", name: "Alto contraste" }
  ]
  useEffect(() => {
    if (editorRef.current && currentProgram) {
      editorRef.current.setValue(currentProgram.content || "")
      previousCodeRef.current = currentProgram.content
      setCurrentCode(currentProgram.content)
      // TODO: indent code if needed
    }
  }
  , [currentProgram])
  const updateCode = (code) => {
    setCurrentCode(code)
    if (!currentProgram) {
      console.log(`Making a new file is required!`)
    } else if (previousCodeRef.current !== currentCode) {
      console.log(`Code updated: ${code}`)
    }
  }
  return (
    <div className="flex flex-col items-center w-full">
      {/* Theme tab switcher */}
      <div className="flex space-x-4 mb-1 p-2 rounded-lg justify-end w-full">
        <span className="text-xs font-medium pt-1">Selección de tema: </span>
        {themes.map(({ id, name }) => (
          <button
            key={id}
            onClick={() => {
              setTheme(id)
              monaco.editor.setTheme(id)
            }}
            className={`text-xs font-medium px-2 py-1 rounded-md transition ${
              theme === id ? "bg-violet-700 hover:bg-violet-900 text-white me-2 mb-2" : "bg-sky-900 hover:bg-sky-700  text-white me-2 mb-2"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <Editor
        height="400px"
        defaultLanguage="automataLang"
        theme={theme}
        defaultValue={currentProgram ? currentProgram.content : `// Escribe tu código aquí o selecciona un archivo para editarlo`}
        onMount={handleEditorDidMount}
        className="w-full"
        onChange={(code) => updateCode(code)}
        options={options}
      />
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

export default CodeEditor
