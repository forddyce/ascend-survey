import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { SupabaseContextType } from '../context/SupabaseContext';

vi.mock('../context/SupabaseContext', () => ({
  useSupabase: vi.fn<[], SupabaseContextType>(),
}));

vi.mock('../services/supabaseService', () => ({
  // eslint-disable-next-line
  signInWithGoogle: vi.fn<[], any>(),
}));

import { useSupabase } from '../context/SupabaseContext';
import { signInWithGoogle } from '../services/supabaseService';

const mockedUseSupabase = useSupabase as ReturnType<typeof vi.fn<[], SupabaseContextType>>;
// eslint-disable-next-line
const mockedSignInWithGoogle = signInWithGoogle as ReturnType<typeof vi.fn<[], any>>;

import LoginPage from './Login';

describe('LoginPage', () => {
  const mockNavigateTo = vi.fn();

  beforeEach(() => {
    mockedSignInWithGoogle.mockReset();
    mockedUseSupabase.mockReset();
    mockNavigateTo.mockReset();
    mockedUseSupabase.mockReturnValue({
      session: null,
      loadingAuth: false,
      // eslint-disable-next-line
      supabase: {} as any,
    });
  });

  it('renders login heading and button when not loading and not authenticated', () => {
    render(<LoginPage navigateTo={mockNavigateTo} />);
    expect(screen.getByRole('heading', { name: /admin login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('calls signInWithGoogle when the button is clicked', async () => {
    render(<LoginPage navigateTo={mockNavigateTo} />);

    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    await fireEvent.click(signInButton);

    expect(mockedSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('displays an error message if signInWithGoogle fails', async () => {
    const errorMessage = 'Authentication failed for testing.';
    mockedSignInWithGoogle.mockRejectedValueOnce(new Error(errorMessage));
    render(<LoginPage navigateTo={mockNavigateTo} />);
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    await fireEvent.click(signInButton);
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('redirects to dashboard if user is already authenticated', () => {
    mockedUseSupabase.mockReturnValue({
      // eslint-disable-next-line
      session: { user: { id: 'test-user-id', email: 'test@example.com' } } as any,
      loadingAuth: false,
      // eslint-disable-next-line
      supabase: {} as any,
    });
    render(<LoginPage navigateTo={mockNavigateTo} />);
    expect(mockNavigateTo).toHaveBeenCalledTimes(1);
    expect(mockNavigateTo).toHaveBeenCalledWith('dashboard');
  });

  it('shows loading state when loadingAuth is true', () => {
    mockedUseSupabase.mockReturnValue({
      session: null,
      loadingAuth: true,
      // eslint-disable-next-line
      supabase: {} as any,
    });
    render(<LoginPage navigateTo={mockNavigateTo} />);
    expect(screen.getByText(/loading authentication.../i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument();
  });
});
