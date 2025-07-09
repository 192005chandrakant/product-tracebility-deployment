import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

// Mock fetch
global.fetch = jest.fn();

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Home component', () => {
  // Test when user is not logged in
  test('renders welcome message for non-logged in users', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    expect(screen.getByText(/TraceChain/i)).toBeInTheDocument();
  });

  // Test when user is logged in
  test('fetches recent products when user is logged in', async () => {
    // Mock a logged-in user token
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoicHJvZHVjZXIifQ.q1qGhNXtGJJVnQdK3v_ibDrVJHz1IfjnAq6-hXB0jgQ';
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    // Mock successful fetch response
    const mockProducts = [
      {
        productId: 'prod123',
        name: 'Test Product',
        manufacturer: 'Test Manufacturer',
        createdAt: new Date().toISOString(),
        imageFile: { publicUrl: 'https://example.com/image.jpg' },
        stages: ['Manufacturing']
      }
    ];
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    // Wait for the fetch to complete and check for product display
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/recent-products?limit=6');
      expect(screen.getByText('Recent Products')).toBeInTheDocument();
    });
  });
});
