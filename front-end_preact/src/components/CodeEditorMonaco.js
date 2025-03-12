import { h } from 'preact'
import { useRef, useState } from "preact/hooks";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";

const CodeEditor = () => {
  const editorRef = useRef(null)
  const [theme, setTheme] = useState("automataDark")

  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor

    monacoInstance.languages.register({
      id: "automataLang",
      extensions: [".educatronica"],
      aliases: ["Automata Language", "automataLang"],
      mimetypes: ["text/x-automata"]
    })

    monacoInstance.languages.setMonarchTokensProvider("automataLang", {
      tokenizer: {
        root: [
          [/\b(INICIO|FIN|SUBIR|BAJAR|PAUSA|ABRIR)\b/i, "keyword"],
          [/\b[1-7]\b/, "number"],
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
      onEnterRules: [
        {
          beforeText: /^\s*INICIO\s*$/,
          action: { indentAction: monacoInstance.languages.IndentAction.Indent }
        },
        {
          beforeText: /^\s*FIN\s*$/,
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

  return (
    <div className="flex flex-col items-center w-full">
      {/* Tab Switcher */}
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
        defaultValue={`// Programa de prueba\nINICIO\nSUBIR 3\n/* Comentario largo */\nBAJAR 1\nFIN`}
        onMount={handleEditorDidMount}
        className="w-full"
      />
    </div>
  )
}

export default CodeEditor
