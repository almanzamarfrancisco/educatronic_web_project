// tests/BlocklyInterface.test.js
import { h } from 'preact';
import { render, act } from '@testing-library/preact';
import BlocklyInterface, { lexer } from '../src/components/BlocklyInterface';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import * as store from '../src/store';

jest.mock('blockly/core', () => ({
  Theme: { defineTheme: jest.fn() },
  Themes: { Classic: {} },
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

const mockSetCurrentCode = jest.fn();
const mockSetCurrentProgram = jest.fn();
jest.mock('../src/store', () => ({
  __esModule: true,
  default: () => ({ setCurrentCode: mockSetCurrentCode, setCurrentProgram: mockSetCurrentProgram }),
  useAppStore: () => ({ setCurrentCode: mockSetCurrentCode, setCurrentProgram: mockSetCurrentProgram }),
  useCurrentCode: () => 'initial code',
  useCurrentProgram: () => ({ content: 'CMD1 3\nCMD2 5' }),
  useCompileOutput: () => 'compiled output',
}));

describe('BlocklyInterface', () => {
  let fakeWs;
  const [tokA, tokB] = lexer.commandTable.slice(0, 2).map((c) => c.token);
  beforeEach(() => {
    jest.clearAllMocks();

    fakeWs = {
      clear: jest.fn(),
      newBlock: jest.fn().mockReturnValue({
        setFieldValue: jest.fn(),
        initSvg: jest.fn(),
        render: jest.fn(),
        moveBy: jest.fn(),
        previousConnection: {},
        nextConnection: { connect: jest.fn() },
        getInput: jest.fn().mockReturnValue({ connection: { connect: jest.fn() } }),
      }),
      render: jest.fn(),
      addChangeListener: jest.fn(),
      removeChangeListener: jest.fn(),
      dispose: jest.fn(),
    };
    Blockly.inject.mockReturnValue(fakeWs);
    Blockly.getMainWorkspace.mockReturnValue(fakeWs);
    javascriptGenerator.workspaceToCode.mockReturnValue('GENERATED_CODE');

    store.useCurrentProgram = jest
      .fn()
      .mockImplementationOnce(() => ({ content: `${tokA} 1\n${tokB} 2` }))
      .mockImplementationOnce(() => ({ content: `${tokA} 9\n${tokB} 5` }));

    store.useAppStore = jest.fn(() => ({ setCurrentCode: jest.fn() }));
    store.useCurrentCode = jest.fn(() => '');
    store.useCompileOutput = jest.fn(() => 'compiled output');
  });

  it('defines the custom Blockly theme', () => {
    render(<BlocklyInterface />);
    expect(Blockly.Theme.defineTheme).toHaveBeenCalledWith(
      'customTheme',
      expect.objectContaining({ base: Blockly.Themes.Classic })
    );
  });

  it('declares blocks JSON exactly once', () => {
    render(<BlocklyInterface />);
    expect(Blockly.defineBlocksWithJsonArray).toHaveBeenCalledTimes(1);
    const defs = Blockly.defineBlocksWithJsonArray.mock.calls[0][0];
    expect(Array.isArray(defs)).toBe(true);
    expect(defs.length).toBeGreaterThan(0);
  });

  it('injects the workspace into #blocklyDiv with correct options', () => {
    const { container } = render(<BlocklyInterface />);
    expect(Blockly.inject).toHaveBeenCalledWith(
      'blocklyDiv',
      expect.objectContaining({
        toolbox: expect.stringContaining('<xml>'),
        grid: expect.objectContaining({ spacing: 20 }),
      })
    );
    expect(container.querySelector('#blocklyDiv')).toBeInTheDocument();
  });

  it('listens for workspace changes and updates the store', () => {
    render(<BlocklyInterface />);
    // grab the change listener you registered
    const listener = fakeWs.addChangeListener.mock.calls[0][0];
    act(() => listener());
    expect(javascriptGenerator.workspaceToCode).toHaveBeenCalledWith(fakeWs);
    expect(mockSetCurrentCode).toHaveBeenCalledWith('GENERATED_CODE');
  });

  it('on mount, clears and renders workspace once and lays out blocks', () => {
    render(<BlocklyInterface />);
    expect(fakeWs.clear).toHaveBeenCalledTimes(1);
    expect(fakeWs.render).toHaveBeenCalledTimes(1);
    expect(fakeWs.newBlock).toHaveBeenCalledTimes(2);
  });

  it('on program change, clears and renders workspace again and lays out blocks again', () => {
    const { rerender } = render(<BlocklyInterface />);
    expect(fakeWs.newBlock).toHaveBeenCalledTimes(2);
    rerender(<BlocklyInterface />);
    expect(fakeWs.clear).toHaveBeenCalledTimes(2);
    expect(fakeWs.render).toHaveBeenCalledTimes(2);
    expect(fakeWs.newBlock).toHaveBeenCalledTimes(4);
  });

});
