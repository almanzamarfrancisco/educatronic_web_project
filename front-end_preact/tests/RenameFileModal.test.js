import { h } from 'preact';
import { render } from '@testing-library/preact';
import RenameFileModal from '../src/components/RenameFileModal';
import tingle from "tingle.js"
import "tingle.js/dist/tingle.css"

const addFooterBtn = jest.fn();
const open = jest.fn();
const close = jest.fn();
const destroy = jest.fn();
const setContent = jest.fn();

const mockModalInstance = { addFooterBtn, open, close, destroy, setContent };

jest.mock('tingle.js', () => ({
  modal: jest.fn(() => mockModalInstance)
}));

describe('RenameFileModal', () => {
  let onClose;
  let onRename;
  let file;

  beforeEach(() => {
    jest.clearAllMocks();
    onClose = jest.fn();
    onRename = jest.fn();
    file = { name: 'old-name.txt' };
  });

  it('instantiates tingle.modal with the correct options', () => {
    render(<RenameFileModal isOpen={false} onClose={onClose} file={file} onRename={onRename} />);
    expect(tingle.modal).toHaveBeenCalledWith(expect.objectContaining({
      footer: true,
      stickyFooter: false,
      closeMethods: ['overlay', 'button', 'escape'],
      closeLabel: 'Close',
      cssClass: ['custom-tingle-modal'],
      onClose: expect.any(Function)
    }));
  });

  it('adds both Cancel and Rename buttons with proper classes', () => {
    render(<RenameFileModal isOpen={false} onClose={onClose} file={file} onRename={onRename} />);
    expect(addFooterBtn).toHaveBeenCalledTimes(2);

    // first button: Cancelar
    expect(addFooterBtn).toHaveBeenNthCalledWith(
      1,
      'Cancelar',
      expect.stringContaining('text-gray-300 bg-gray-700'),
      expect.any(Function)
    );

    // second button: Renombrar
    expect(addFooterBtn).toHaveBeenNthCalledWith(
      2,
      'Renombrar',
      expect.stringContaining('bg-blue-600 text-white'),
      expect.any(Function)
    );
  });

  it('sets modal content and opens/closes based on isOpen', () => {
    const { rerender } = render(<RenameFileModal isOpen={true} onClose={onClose} file={file} onRename={onRename} />);
    // content should include the current file name
    expect(setContent).toHaveBeenCalledWith(expect.stringContaining(`value="${file.name}"`));
    expect(open).toHaveBeenCalled();

    rerender(<RenameFileModal isOpen={false} onClose={onClose} file={file} onRename={onRename} />);
    expect(close).toHaveBeenCalled();
  });

  it('calls onRename and closes when “Renombrar” clicked with a new name', () => {
    render(<RenameFileModal isOpen={false} onClose={onClose} file={file} onRename={onRename} />);

    // prepare a fake input in the DOM
    const input = document.createElement('input');
    input.id = 'rename-file-input';
    input.value = 'new-name.txt';
    document.body.appendChild(input);

    // grab the rename callback from the 2nd addFooterBtn call
    const renameCb = addFooterBtn.mock.calls[1][2];
    renameCb();

    expect(onRename).toHaveBeenCalledWith('new-name.txt');
    expect(close).toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('does NOT call onRename if input is blank or unchanged', () => {
    render(<RenameFileModal isOpen={false} onClose={onClose} file={file} onRename={onRename} />);

    const input = document.createElement('input');
    input.id = 'rename-file-input';
    input.value = ''; // blank
    document.body.appendChild(input);

    const renameCb = addFooterBtn.mock.calls[1][2];
    renameCb();
    expect(onRename).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();

    // now same name
    input.value = 'old-name.txt';
    renameCb();
    expect(onRename).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('destroy() is called on unmount', () => {
    const { unmount } = render(<RenameFileModal isOpen={false} onClose={onClose} file={file} onRename={onRename} />);
    unmount();
    expect(destroy).toHaveBeenCalled();
  });
});
