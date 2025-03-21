import { h } from 'preact'
import { useEffect, useRef, useState } from "preact/hooks";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import useAppStore, { useCurrentCode, useCurrentProgram, useCompileOutput } from '../store'

const CodeEditor = () => {
  const editorRef = useRef(null)
  const [theme, setTheme] = useState("automataDark")
  const { setCurrentCode } = useAppStore()
  const currentCode = useCurrentCode()
  const currentProgram = useCurrentProgram()
  const compileOutput = useCompileOutput()
  const previousCodeRef = useRef(currentProgram ? currentProgram.content : "")
  const validateAutomataSyntax = (editor, monaco) => {
    const model = editor.getModel()
    if (!model) return
    const text = model.getValue()
    const lines = text.split("\n")
    let markers = []
    let multiLineComment = false
    lines.forEach((line, lineNumber) => {
      const validKeywords = ["INICIO", "FIN", "SUBIR", "BAJAR", "PAUSA", "ABRIR", "REPETIR", "FIN_REPETIR"]
      const words = line.split(/\s+/)
      if (line.startsWith("//")) return
      if (line.startsWith("/*")) multiLineComment = true
      if (multiLineComment) return
      if (line.endsWith("*/")) multiLineComment = false
      words.forEach((word) => {
        if (!validKeywords.includes(word) && isNaN(word) && !word.startsWith("//") && !word.startsWith("/*")) {
          markers.push({
            startLineNumber: lineNumber + 1,
            startColumn: line.indexOf(word) + 1,
            endLineNumber: lineNumber + 1,
            endColumn: line.indexOf(word) + word.length + 1,
            message: `Error de sintaxis: "${word}" no es un comando válido.`,
            severity: monaco.MarkerSeverity.Error,
          })
        }
      })
      if (/PAUSA\b/.test(line) && !/PAUSA\s+\d+/.test(line)) {
        markers.push({
          startLineNumber: lineNumber + 1,
          startColumn: line.indexOf("PAUSA") + 1,
          endLineNumber: lineNumber + 1,
          endColumn: line.indexOf("PAUSA") + "PAUSA".length + 1,
          message: `"PAUSA" debe tener un número.`,
          severity: monaco.MarkerSeverity.Error,
        })
      }
      if (/^REPETIR\b/.test(line) && !/^REPETIR\s+\d+/.test(line)) {
        markers.push({
          startLineNumber: lineNumber + 1,
          startColumn: line.indexOf("REPETIR") + 1,
          endLineNumber: lineNumber + 1,
          endColumn: line.indexOf("REPETIR") + "REPETIR".length + 1,
          message: `"REPETIR" debe tener un número.`,
          severity: monaco.MarkerSeverity.Error,
        })
      }
    })
    monaco.editor.setModelMarkers(model, "owner", markers);
  }
  
  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor
    editor.onDidChangeModelContent(() => {
      validateAutomataSyntax(editor, monacoInstance);
    });

    monacoInstance.languages.register({
      id: "automataLang",
      extensions: [".educatronica"],
      aliases: ["Automata Language", "automataLang"],
      mimetypes: ["text/x-automata"]
    })

    monacoInstance.languages.setMonarchTokensProvider("automataLang", {
      tokenizer: {
        root: [
          [/\b(INICIO|FIN|SUBIR|BAJAR|PAUSA|ABRIR|REPETIR|FIN_REPETIR)\b/i, "keyword"],
          [/\bPAUSA\b\s+\d+/i, ["keyword", "number"]], 
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
        {
          beforeText: /^\s*INICIO\s*$/,
          action: { indentAction: monacoInstance.languages.IndentAction.Indent }
        },
        {
          beforeText: /^\s*FIN\s*$/,
          action: { indentAction: monacoInstance.languages.IndentAction.Outdent }
        },
        {
          beforeText: /^\s*REPETIR\s+\d+\s*$/,
          action: { indentAction: monacoInstance.languages.IndentAction.Indent }
        },
        {
          beforeText: /^\s*FIN_REPETIR\s*$/,
          action: { indentAction: monacoInstance.languages.IndentAction.Outdent }
        }
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
        { token: "keyword", foreground: "D35400", fontStyle: "bold" },
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
    { id: "automataDark", name: "Dark" },
    { id: "automataLight", name: "Light" },
    { id: "automataHighContrast", name: "High Contrast" }
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
      console.log(`I have to save the code in a new file`)
    } else if (previousCodeRef.current !== currentCode) {
      // console.log(`Code updated: ${code}`)
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
              theme === id ? "bg-blue-800 text-white me-2 mb-2" : "text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <Editor
        height="300px"
        defaultLanguage="automataLang"
        theme={theme}
        defaultValue={currentProgram ? currentProgram.content : `// Escribe tu código aquí o selecciona un archivo para editarlo`}
        onMount={handleEditorDidMount}
        className="w-full"
        onChange={(code) => updateCode(code)}
      />
      {/* Output section */}
      <div className="flex-col space-x-4 mt-4 p-1 w-full container bg-slate-800">
        <span>Consola: </span>
        <pre className="overflow-y-auto block overflow-auto my-5 relative">{ compileOutput }</pre>
      </div>
    </div>
  )
}

export default CodeEditor
