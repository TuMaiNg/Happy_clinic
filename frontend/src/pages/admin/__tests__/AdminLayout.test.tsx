import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminLayout } from '../Layout/AdminLayout';

describe('AdminLayout', () => {
  it('renders admin layout with sidebar and header', () => {
    render(
      <BrowserRouter>
        <AdminLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('Happy Care')).toBeInTheDocument();
    expect(screen.getByText('Quản trị hệ thống')).toBeInTheDocument();
  });
});

