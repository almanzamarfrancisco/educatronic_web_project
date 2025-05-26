import { h } from 'preact';
import { render, fireEvent, screen } from '@testing-library/preact';
import CodeEditor from '../src/components/CodeEditorMonaco';
import * as monaco from "monaco-editor"

// 1) Mock monaco-editor
jest.mock(
  'monaco-editor',
  () => ({
    editor: {
      setTheme: jest.fn(),
      defineTheme: jest.fn(),
      setModelMarkers: jest.fn(),
    },
    languages: {
      register: jest.fn(),
      setMonarchTokensProvider: jest.fn(),
      setLanguageConfiguration: jest.fn(),
      IndentAction: { Indent: 0, Outdent: 1 },
    },
    // add this so MarkerSeverity.Error exists
    MarkerSeverity: {
      Error: 8,
      Warning: 4,
      Info: 2,
      Hint: 1,
    },
  }),
  { virtual: true }
);

// 2) Mock zustand store hooks
const mock_setCurrentCode = jest.fn();
jest.mock('../src/store', () => ({
  __esModule: true,
  default: jest.fn(() => ({ setCurrentCode: mock_setCurrentCode })),
  useAppStore: jest.fn(() => ({ setCurrentCode: mock_setCurrentCode })),
  useCurrentCode: jest.fn(() => 'initial code'),
  useCurrentProgram: jest.fn(() => ({ content: 'program code' })),
  useCompileOutput: jest.fn(() => 'compiled output'),
}));

// 3) Capture the props passed to the Monaco <Editor>
let editorProps = {};
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: (props) => {
    editorProps = props;
    // render a placeholder so Testing Library finds it
    return (
      <div
        data-testid="editor"
        data-default-value={props.defaultValue}
        data-language={props.defaultLanguage}
        data-theme={props.theme}
      />
    );
  },
}));

describe('CodeEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    editorProps = {};
  });

  it('renders theme switcher buttons with correct initial classes', () => {
    const { getByText } = render(<CodeEditor />);
    const oscuro = getByText('Oscuro');
    const claro = getByText('Claro');

    // initial theme is "automataDark"
    expect(oscuro).toHaveClass('bg-violet-700');
    expect(claro).toHaveClass('bg-sky-900');
  });

  it('renders the Monaco Editor with expected props', () => {
    render(<CodeEditor />);
    expect(editorProps.height).toBe('400px');
    expect(editorProps.defaultLanguage).toBe('automataLang');
    expect(editorProps.theme).toBe('automataDark');
    expect(editorProps.options).toMatchObject({
      scrollBeyondLastLine: false,
      wordWrap: 'on',
    });
    expect(typeof editorProps.onMount).toBe('function');
    expect(typeof editorProps.onChange).toBe('function');
    // defaultValue comes from useCurrentProgram()
    expect(editorProps.defaultValue).toBe('program code');
  });

  it('shows the compile output in the console area', () => {
    const { getByText } = render(<CodeEditor />);
    expect(getByText('Consola:')).toBeInTheDocument();
    expect(getByText('compiled output')).toBeInTheDocument();
  });

  it('calls monaco.editor.setTheme and updates button styling when switching themes', () => {
    const { getByText } = render(<CodeEditor />);
    const claro = getByText('Claro');

    fireEvent.click(claro);

    // Should invoke Monaco API
    expect(monaco.editor.setTheme).toHaveBeenCalledWith('automataLight');
    // And the Claro button should now reflect the "active" styling
    expect(claro).toHaveClass('bg-violet-700');
  });

  it('invokes mock_setCurrentCode from the store when the editor content changes', () => {
    render(<CodeEditor />);
    // simulate user typing
    editorProps.onChange('new code content');
    expect(mock_setCurrentCode).toHaveBeenCalledWith('new code content');
  });
});


describe('CodeEditor (language)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    editorProps = {};
  });

  it('registers the automataLang language on mount', () => {
    const spy = jest.spyOn(monaco.languages, 'register');
    render(<CodeEditor />);
    const fakeEditor = {
      onDidChangeModelContent: () => {},
      getModel: () => null,
    };
    editorProps.onMount(fakeEditor, monaco);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'automataLang' })
    );
  });

  it('marks invalid commands via setModelMarkers', () => {
    render(<CodeEditor />);
    // simulate editor mount
    const fakeModel = {
      getValue: () => 'FOO 123',
    };
    const fakeEditor = {
      getModel: () => fakeModel,
      onDidChangeModelContent: (cb) => cb(), // immediately invoke
      setValue: jest.fn(),
    };
    // call onMount handler
    editorProps.onMount(fakeEditor, monaco);

    // should have recorded one marker for the invalid "FOO"
    expect(monaco.editor.setModelMarkers).toHaveBeenCalledWith(
      fakeModel,
      'owner',
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('no es un comando válido'),
          startLineNumber: 1,
        }),
      ])
    );
  });

  it('clears markers when code is valid', () => {
    render(<CodeEditor />);
    const fakeModel = {
      getValue: () => 'SUBIR 3', // valid command with valid arg
    };
    const fakeEditor = {
      getModel: () => fakeModel,
      onDidChangeModelContent: (cb) => cb(),
      setValue: jest.fn(),
    };
    editorProps.onMount(fakeEditor, monaco);

    // valid code ⇒ markers array should be empty
    expect(monaco.editor.setModelMarkers).toHaveBeenCalledWith(
      fakeModel,
      'owner',
      []
    );
  });

  it('logs "Code updated" when user edits and a program exists', () => {
    console.log = jest.fn();
    render(<CodeEditor />);
    // simulate typing
    editorProps.onChange('new content here');
    expect(mock_setCurrentCode).toHaveBeenCalledWith('new content here');
    expect(console.log).toHaveBeenCalledWith('Code updated: new content here');
  });
});
