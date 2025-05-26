import { h } from 'preact';
import { render, fireEvent } from '@testing-library/preact';
import ErrorModal from '../src/components/ErrorModal';

describe('ErrorModal', () => {
  const defaultProps = {
    onClose: jest.fn(),
    closeButton: false,
    message: undefined,
  };

  it('renders the header and default fallback message when no `message` is provided', () => {
    const { getByText } = render(<ErrorModal {...defaultProps} />);
    expect(getByText('⚠️ Atención!')).toBeInTheDocument();
    expect(getByText('Lo sentimos. Algo salió muy mal x(')).toBeInTheDocument();
  });

  it('renders a custom message when `message` prop is provided', () => {
    const msg = '¡Algo específico salió mal!';
    const { getByText } = render(
      <ErrorModal {...defaultProps} message={msg} />
    );
    expect(getByText(msg)).toBeInTheDocument();
  });

  it('toggles the close button visibility based on `closeButton` prop', () => {
    const { getByText, rerender } = render(
      <ErrorModal {...defaultProps} closeButton={false} />
    );
    const btn = getByText('Cerrar');
    expect(btn).toHaveClass('invisible');

    rerender(<ErrorModal {...defaultProps} closeButton={true} />);
    expect(btn).toHaveClass('visible');
  });

  it('calls `onClose` when the visible close button is clicked', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <ErrorModal {...defaultProps} closeButton={true} onClose={onClose} />
    );
    const btn = getByText('Cerrar');
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
