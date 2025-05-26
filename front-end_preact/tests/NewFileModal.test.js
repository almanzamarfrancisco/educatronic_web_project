import { h } from 'preact';
import { render } from '@testing-library/preact';
import NewFileModal from '../src/components/NewFileModal';
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

describe('NewFileModal', () => {
  let onClose;
  let onCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    onClose = jest.fn();
    onCreate = jest.fn();
  });

  it('instantiates tingle.modal with the correct options', () => {
    render(<NewFileModal isOpen={false} onClose={onClose} onCreate={onCreate} />);
    expect(tingle.modal).toHaveBeenCalledWith(expect.objectContaining({
      footer: true,
      stickyFooter: false,
      closeMethods: ['overlay', 'button', 'escape'],
      closeLabel: 'Close',
      cssClass: ['custom-tingle-modal'],
      onClose: expect.any(Function),
    }));
  });

  it('adds both Cancel and Create buttons with proper classes', () => {
    render(<NewFileModal isOpen={false} onClose={onClose} onCreate={onCreate} />);
    expect(addFooterBtn).toHaveBeenCalledTimes(2);

    // 1st button: Cancelar
    expect(addFooterBtn).toHaveBeenNthCalledWith(
      1,
      'Cancelar',
      expect.stringContaining('bg-gray-700 text-gray-300'),
      expect.any(Function)
    );

    // 2nd button: Crear
    expect(addFooterBtn).toHaveBeenNthCalledWith(
      2,
      'Crear',
      expect.stringContaining('bg-green-600 text-white'),
      expect.any(Function)
    );
  });

  it('sets modal content and opens/closes based on isOpen prop', () => {
    const { rerender } = render(<NewFileModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
    // The HTML should include our heading
    expect(setContent).toHaveBeenCalledWith(expect.stringContaining('Crear Nuevo Archivo'));
    expect(open).toHaveBeenCalled();

    // Toggle isOpen to false
    rerender(<NewFileModal isOpen={false} onClose={onClose} onCreate={onCreate} />);
    expect(close).toHaveBeenCalled();
  });

  it('cancel button callback closes the modal', () => {
    render(<NewFileModal isOpen={false} onClose={onClose} onCreate={onCreate} />);
    // measure calls so far (close runs once from initial effect)
    const before = close.mock.calls.length;
    const cancelCb = addFooterBtn.mock.calls[0][2];
    cancelCb();
    expect(close).toHaveBeenCalledTimes(before + 1);
  });

  it('create button callback calls onCreate with trimmed input value', () => {
    render(<NewFileModal isOpen={false} onClose={onClose} onCreate={onCreate} />);
    // Insert a fake input into the DOM
    const input = document.createElement('input');
    input.id = 'new-file-input';
    input.value = '  my-new-file.txt  ';
    document.body.appendChild(input);

    const createCb = addFooterBtn.mock.calls[1][2];
    createCb();

    expect(onCreate).toHaveBeenCalledWith('my-new-file.txt');
    document.body.removeChild(input);
  });

  it('destroy() is called on unmount', () => {
    const { unmount } = render(<NewFileModal isOpen={false} onClose={onClose} onCreate={onCreate} />);
    unmount();
    expect(destroy).toHaveBeenCalled();
  });
});
