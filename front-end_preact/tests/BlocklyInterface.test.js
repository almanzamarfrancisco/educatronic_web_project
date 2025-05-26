// tests/BlocklyInterface.test.js
import { h } from 'preact';
import { render, act } from '@testing-library/preact';
import BlocklyInterface from '../src/components/BlocklyInterface';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';

// ——— 1) Mock Blockly APIs ———
jest.mock('blockly/core', () => ({
  Theme: {
    defineTheme: jest.fn(),
  },
  Themes: {
    Classic: { /* no‐op */ },
  },
  defineBlocksWithJsonArray: jest.fn(),
  inject: jest.fn(),
  getMainWorkspace: jest.fn(),
}));

jest.mock('blockly/javascript', () => ({
  javascriptGenerator: {
    workspaceToCode: jest.fn(),
    statementToCode: jest.fn(),
    forBlock: {},
  },
}));

// ——— 2) Mock zustand store hooks ———
const mockSetCurrentCode = jest.fn();
const mockSetCurrentProgram = jest.fn();
jest.mock('../src/store', () => ({
  __esModule: true,
  default: () => ({ setCurrentCode: mockSetCurrentCode, setCurrentProgram: mockSetCurrentProgram }),
  useAppStore: () => ({ setCurrentCode: mockSetCurrentCode, setCurrentProgram: mockSetCurrentProgram }),
  useCurrentCode: () => 'initial code',
  useCurrentProgram: () => ({ content: 'CMD1 5\nCMD2', /* etc */ }),
  useCompileOutput: () => 'compiled output',
}));

describe('BlocklyInterface', () => {
  let fakeWorkspace;
  beforeEach(() => {
    jest.clearAllMocks();
    // create a minimal fake workspace
    fakeWorkspace = {
      clear: jest.fn(),
      newBlock: jest.fn().mockImplementation((type) => ({
        setFieldValue: jest.fn(),
        initSvg: jest.fn(),
        render: jest.fn(),
        moveBy: jest.fn(),
        previousConnection: {},
        nextConnection: { connect: jest.fn() },
        getInput: jest.fn().mockReturnValue({ connection: { connect: jest.fn() } }),
      })),
      render: jest.fn(),
      addChangeListener: jest.fn(),
      dispose: jest.fn(),
    };
    Blockly.inject.mockReturnValue(fakeWorkspace);
    Blockly.getMainWorkspace.mockReturnValue(fakeWorkspace);
    javascriptGenerator.workspaceToCode.mockReturnValue('GENERATED_CODE');
    javascriptGenerator.statementToCode.mockReturnValue(''); 
  });

  it('defines a custom theme on load', () => {
    render(<BlocklyInterface />);
    expect(Blockly.Theme.defineTheme).toHaveBeenCalledWith(
      'customTheme',
      expect.objectContaining({
        base: Blockly.Themes.Classic,
        componentStyles: expect.objectContaining({
          workspaceBackgroundColour: '#121212',
        }),
      })
    );
  });

  it('registers blocks via defineBlocksWithJsonArray', () => {
    render(<BlocklyInterface />);
    expect(Blockly.defineBlocksWithJsonArray).toHaveBeenCalled();
    // should include at least your program-start block
    const defined = Blockly.defineBlocksWithJsonArray.mock.calls[0][0];
    expect(defined).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message0: expect.any(String), type: expect.any(String) }),
      ])
    );
  });

  it('injects the workspace with the correct toolbox and theme', () => {
    const { container } = render(<BlocklyInterface />);
    expect(Blockly.inject).toHaveBeenCalledWith(
      'blocklyDiv',
      expect.objectContaining({
        toolbox: expect.stringContaining('<xml>'),
        theme: expect.any(Object),
        grid: expect.objectContaining({ spacing: 20 }),
      })
    );
    // ensure the DIV is in the document
    expect(container.querySelector('#blocklyDiv')).toBeInTheDocument();
  });

  it('renders the compile output in the console area', () => {
    const { getByText } = render(<BlocklyInterface />);
    expect(getByText('Consola:')).toBeInTheDocument();
    expect(getByText('compiled output')).toBeInTheDocument();
  });

  it('on workspace change, generates code and calls setCurrentCode', () => {
    render(<BlocklyInterface />);
    // grab the registered change listener
    const changeListener = fakeWorkspace.addChangeListener.mock.calls[0][0];

    // simulate a change
    act(() => changeListener());
    expect(javascriptGenerator.workspaceToCode).toHaveBeenCalledWith(fakeWorkspace);
    expect(mockSetCurrentCode).toHaveBeenCalledWith('GENERATED_CODE');
  });

  it('updateBlocksFromCode lays out blocks for each valid line', () => {
    render(<BlocklyInterface />);
    // call updateBlocksFromCode manually via re-injecting the useEffect
    const code = 'CMD1 3\nEND_LOOP';
    // clear existing calls
    jest.clearAllMocks();
    // simulate initial load
    const workspace = fakeWorkspace;
    // import the function
    const { updateBlocksFromCode } = require('../src/components/BlocklyInterface');
    updateBlocksFromCode(workspace, code);

    // should clear first
    expect(workspace.clear).toHaveBeenCalled();
    // should create at least one newBlock for CMD1
    expect(workspace.newBlock).toHaveBeenCalledWith(expect.stringMatching(/^\w+$/));
    // finally render
    expect(workspace.render).toHaveBeenCalled();
  });
});
