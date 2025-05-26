import { h } from 'preact';
import { render } from '@testing-library/preact';
import DeleteFileModal from '../src/components/DeleteFileModal';
import tingle from "tingle.js"
import "tingle.js/dist/tingle.css"

const addFooterBtn = jest.fn();
const open = jest.fn();
const close = jest.fn();
const destroy = jest.fn();
const setContent = jest.fn();

const mockModalInstance = { addFooterBtn, open, close, destroy, setContent };

// Mock tingle.js so new tingle.modal() returns our mock instance
jest.mock('tingle.js', () => ({
  modal: jest.fn(() => mockModalInstance)
}));

describe('DeleteFileModal', () => {
  let onClose;
  let onDelete;
  const file = { id: '123', name: 'test.txt' };

  beforeEach(() => {
    jest.clearAllMocks();
    onClose = jest.fn();
    onDelete = jest.fn();
  });

  it('initializes tingle.modal with the expected options', () => {
    render(<DeleteFileModal isOpen={false} onClose={onClose} file={file} onDelete={onDelete} />);
    expect(tingle.modal).toHaveBeenCalledWith(expect.objectContaining({
      footer: true,
      stickyFooter: false,
      closeMethods: ['overlay', 'button', 'escape'],
      closeLabel: 'Close',
      cssClass: ['custom-tingle-modal'],
      onClose: expect.any(Function),
    }));
  });

  it('adds Cancel and Eliminar buttons with correct classes', () => {
    render(<DeleteFileModal isOpen={false} onClose={onClose} file={file} onDelete={onDelete} />);
    expect(addFooterBtn).toHaveBeenCalledTimes(2);

    // Cancel button
    expect(addFooterBtn).toHaveBeenNthCalledWith(
      1,
      'Cancelar',
      expect.stringContaining('bg-gray-700 text-gray-300'),
      expect.any(Function)
    );

    // Eliminar button
    expect(addFooterBtn).toHaveBeenNthCalledWith(
      2,
      'Eliminar',
      expect.stringContaining('bg-red-600 text-white'),
      expect.any(Function)
    );
  });

  it('sets modal content including the filename and toggles open/close based on isOpen', () => {
    const { rerender } = render(<DeleteFileModal isOpen={true} onClose={onClose} file={file} onDelete={onDelete} />);
    // content should include the file name
    expect(setContent).toHaveBeenCalledWith(expect.stringContaining(`<strong>${file.name}</strong>`));
    expect(open).toHaveBeenCalled();

    // now close
    rerender(<DeleteFileModal isOpen={false} onClose={onClose} file={file} onDelete={onDelete} />);
    expect(close).toHaveBeenCalled();
  });

  it('cancel button callback closes the modal', () => {
    render(<DeleteFileModal isOpen={false} onClose={onClose} file={file} onDelete={onDelete} />);
    const cancelCb = addFooterBtn.mock.calls[0][2];
    cancelCb();
    expect(close).toHaveBeenCalled();
  });

  it('delete button callback calls onDelete with file id and closes the modal', () => {
    render(<DeleteFileModal isOpen={false} onClose={onClose} file={file} onDelete={onDelete} />);
    const deleteCb = addFooterBtn.mock.calls[1][2];
    deleteCb();
    expect(onDelete).toHaveBeenCalledWith(file.id);
    expect(close).toHaveBeenCalled();
  });

  it('destroy() is called on unmount', () => {
    const { unmount } = render(<DeleteFileModal isOpen={false} onClose={onClose} file={file} onDelete={onDelete} />);
    unmount();
    expect(destroy).toHaveBeenCalled();
  });
});
