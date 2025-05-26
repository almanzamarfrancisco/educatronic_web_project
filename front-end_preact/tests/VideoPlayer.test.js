import { h } from 'preact';
import { render, screen, waitFor } from '@testing-library/preact';
import VideoPlayer from '../src/components/VideoPlayer'; // Ajusta la ruta a tu componente

describe('VideoPlayer', () => {
  const streamUrl = 'https://stream-educatronic.ngrok.app/';

  test('renders the image with the correct src and alt text', () => {
    render(<VideoPlayer streamUrl={streamUrl} />);

    const imageElement = screen.getByAltText('Video Stream');
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', streamUrl);
  });

  test('applies the correct styles and classes to the image', () => {
    render(<VideoPlayer streamUrl={streamUrl} />);
    const imageElement = screen.getByAltText('Video Stream');

    // Verificar estilos inline
    expect(imageElement).toHaveStyle('transform: rotate(180deg)');
    expect(imageElement).toHaveStyle('width: 100%');
    expect(imageElement).toHaveStyle('height: 100%');
    expect(imageElement).toHaveStyle('object-fit: cover');

    // Verificar clases
    expect(imageElement).toHaveClass('mx-auto');
    expect(imageElement).toHaveClass('rounded-lg');
  });

  test('applies the correct classes to the container div', () => {
    const { container } = render(<VideoPlayer streamUrl={streamUrl} />);
    const divElement = container.firstChild; // El div principal

    expect(divElement).toHaveClass('mt-4');
    expect(divElement).toHaveClass('aspect-video');
    expect(divElement).toHaveClass('bg-gray-200');
    expect(divElement).toHaveClass('flex');
    expect(divElement).toHaveClass('items-center');
    expect(divElement).toHaveClass('justify-center');
    expect(divElement).toHaveClass('rounded-lg');
  });

});