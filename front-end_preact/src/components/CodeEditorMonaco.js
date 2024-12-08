import { h } from 'preact'
import { useState } from 'preact/hooks'
import Editor from '@monaco-editor/react';

const CodeEditorMonaco = () => {
  const [code, setCode] = useState('// Type your code here\n');

  const handleEditorChange = (value) => {
    setCode(value); // Update code state
  };

  return (
    <div>
      <h2>Code Editor</h2>
      <Editor
        height="500px"
        defaultLanguage="javascript" // Set the language (e.g., JavaScript, Python)
        value={code} // Bind the editor value
        onChange={handleEditorChange} // Listen to changes
        theme="vs-dark" // Use a dark theme for a VS Code-like experience
      />
      <div>
        <h3>Output:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px' }}>{code}</pre>
      </div>
    </div>
  );
};

export default CodeEditorMonaco;
