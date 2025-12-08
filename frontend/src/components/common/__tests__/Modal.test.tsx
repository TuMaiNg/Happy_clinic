import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()}>
        Content
      </Modal>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Modal Title">
        Content
      </Modal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Content
      </Modal>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Title">
        Content
      </Modal>
    );
    const closeButton = screen.getByRole('button');
    await userEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>
    );
    const backdrop = screen.getByText('Content').closest('.fixed.inset-0')?.previousSibling;
    if (backdrop) {
      await userEvent.click(backdrop as HTMLElement);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('applies size classes', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} size="lg">
        Content
      </Modal>
    );
    const modal = screen.getByText('Content').closest('.max-w-2xl');
    expect(modal).toBeInTheDocument();
  });
});

