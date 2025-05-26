import { h } from 'preact';
import { render, screen, waitFor } from '@testing-library/preact';
import StatusIcon from '../src/components/StatusIcon';

describe('StatusIcon', () => {
  it('renders the Bot icon for neutral status', () => {
    const { container } = render(<StatusIcon status="neutral" size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-gray-400', 'animate-wiggle');
    // size prop should set both width and height
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('renders the Loader2 icon for loading status', () => {
    const { container } = render(<StatusIcon status="loading" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-blue-500', 'animate-spin');
  });

  it('renders the CheckCircle icon for success status', () => {
    const { container } = render(<StatusIcon status="success" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-green-500', 'animate-bounce');
  });

  it('renders the XCircle icon for fail status', () => {
    const { container } = render(<StatusIcon status="fail" size={16} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-red-500', 'animate-pulse');
  });

  it('updates the icon when the status prop changes', () => {
    const { container, rerender } = render(<StatusIcon status="neutral" size={32} />);
    let svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-gray-400', 'animate-wiggle');

    rerender(<StatusIcon status="success" size={32} />);
    svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-green-500', 'animate-bounce');
  });
});
