import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders input without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders input with label', () => {
    render(<Input label="Name" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows helper text when no error', () => {
    render(<Input helperText="Enter your full name" />);
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('does not show helper text when error exists', () => {
    render(<Input error="Error" helperText="Helper" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
  });

  it('applies error styling when error exists', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-status-error');
  });

  it('renders as textarea when as prop is textarea', () => {
    render(<Input as="textarea" rows={5} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('handles input change', async () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('passes through input attributes', () => {
    render(<Input type="email" placeholder="Email" required />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeRequired();
  });
});







