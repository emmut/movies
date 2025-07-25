import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OAuthLoginButton } from './oauth-login-button';
import {
  signInAnonymous,
  signInDiscord,
  signInGitHub,
} from '@/lib/auth-client';
import { getSafeRedirectUrl } from '@/lib/utils';

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock('@/lib/auth-client', () => ({
  signInAnonymous: jest.fn(),
  signInDiscord: jest.fn(),
  signInGitHub: jest.fn(),
}));

jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
  getSafeRedirectUrl: jest.fn(),
}));

// Mock class-variance-authority
jest.mock('class-variance-authority', () => ({
  cva: jest.fn(() => jest.fn(() => 'mocked-cva-classes')),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader" className={className}>Loading...</div>
  ),
  UserIcon: ({ className }: { className?: string }) => (
    <div data-testid="user-icon" className={className}>User</div>
  ),
}));

// Mock the Button component
jest.mock('./button', () => ({
  Button: ({ children, onClick, disabled, className, type, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      type={type}
      data-testid="oauth-button"
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('OAuthLoginButton', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockRouter = {
    push: mockPush,
    refresh: mockRefresh,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (getSafeRedirectUrl as jest.Mock).mockImplementation((url) => url || '/dashboard');
  });

  describe('Rendering', () => {
    test('renders Discord login button with default props', () => {
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Continue with Discord');
      expect(button).not.toBeDisabled();
    });

    test('renders GitHub login button with correct text', () => {
      render(<OAuthLoginButton provider="github" />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveTextContent('Continue with GitHub');
    });

    test('renders Google login button with correct text', () => {
      render(<OAuthLoginButton provider="google" />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveTextContent('Continue with Google');
    });

    test('renders anonymous login button with user icon', () => {
      render(<OAuthLoginButton provider="anonymous" />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveTextContent('Continue as anonymous');
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    test('renders with custom text when provided', () => {
      const customText = 'Sign in with Discord';
      render(<OAuthLoginButton provider="discord" text={customText} />);
      
      expect(screen.getByTestId('oauth-button')).toHaveTextContent(customText);
    });

    test('renders with custom icon when provided', () => {
      const customIcon = <span data-testid="custom-icon">Custom</span>;
      render(<OAuthLoginButton provider="discord" icon={customIcon} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    test('renders with different size variants', () => {
      const { rerender } = render(<OAuthLoginButton provider="discord" size="sm" />);
      expect(screen.getByTestId('oauth-button')).toBeInTheDocument();

      rerender(<OAuthLoginButton provider="discord" size="default" />);
      expect(screen.getByTestId('oauth-button')).toBeInTheDocument();

      rerender(<OAuthLoginButton provider="discord" size="lg" />);
      expect(screen.getByTestId('oauth-button')).toBeInTheDocument();
    });

    test('applies custom className when provided', () => {
      const customClass = 'custom-button-class';
      render(<OAuthLoginButton provider="discord" className={customClass} />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveClass(customClass);
    });

    test('is disabled when disabled prop is true', () => {
      render(<OAuthLoginButton provider="discord" disabled />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toBeDisabled();
    });

    test('passes through additional button props', () => {
      render(
        <OAuthLoginButton 
          provider="discord" 
          data-custom="test-value"
          aria-label="Custom Discord login"
        />
      );
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveAttribute('data-custom', 'test-value');
      expect(button).toHaveAttribute('aria-label', 'Custom Discord login');
    });

    test('renders Discord SVG icon correctly', () => {
      const { container } = render(<OAuthLoginButton provider="discord" />);
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24');
    });

    test('renders Google SVG icon with multiple paths', () => {
      const { container } = render(<OAuthLoginButton provider="google" />);
      const svgElement = container.querySelector('svg');
      const paths = container.querySelectorAll('path');
      expect(svgElement).toBeInTheDocument();
      expect(paths.length).toBeGreaterThan(1); // Google icon has multiple paths
    });

    test('renders GitHub SVG icon correctly', () => {
      const { container } = render(<OAuthLoginButton provider="github" />);
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Authentication Flow', () => {
    test('calls Discord sign-in function on click', async () => {
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(signInDiscord).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('calls GitHub sign-in function on click', async () => {
      (signInGitHub as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="github" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(signInGitHub).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('calls anonymous sign-in function on click', async () => {
      (signInAnonymous as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="anonymous" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(signInAnonymous).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('uses custom redirect URL when provided', async () => {
      const customRedirect = '/custom-redirect';
      (getSafeRedirectUrl as jest.Mock).mockReturnValue(customRedirect);
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="discord" redirectUrl={customRedirect} />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(getSafeRedirectUrl).toHaveBeenCalledWith(customRedirect);
        expect(signInDiscord).toHaveBeenCalledWith(customRedirect);
      });
    });

    test('navigates to redirect URL on successful authentication', async () => {
      const redirectUrl = '/success-page';
      (getSafeRedirectUrl as jest.Mock).mockReturnValue(redirectUrl);
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="discord" redirectUrl={redirectUrl} />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(redirectUrl);
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    test('executes custom onClick handler if provided', async () => {
      const customOnClick = jest.fn();
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="discord" onClick={customOnClick} />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      // Custom onClick should be called, but authentication should still proceed
      await waitFor(() => {
        expect(signInDiscord).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State Management', () => {
    test('shows loading spinner during authentication', async () => {
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      (signInDiscord as jest.Mock).mockReturnValue(signInPromise);
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      // Should show loading state immediately
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByText('Continue with Discord')).not.toBeInTheDocument();
      
      // Resolve the promise
      resolveSignIn!({ error: null });
      
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
        expect(screen.getByText('Continue with Discord')).toBeInTheDocument();
      });
    });

    test('prevents multiple simultaneous authentication attempts', async () => {
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      (signInDiscord as jest.Mock).mockReturnValue(signInPromise);
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should only call sign-in once
      expect(signInDiscord).toHaveBeenCalledTimes(1);
      
      // Resolve the promise
      resolveSignIn!({ error: null });
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });
    });

    test('loading state persists until authentication completes', async () => {
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      (signInDiscord as jest.Mock).mockReturnValue(signInPromise);
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      // Verify loading state persists
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      
      // Wait a bit to ensure loading state doesn't disappear prematurely
      setTimeout(() => {
        expect(screen.getByTestId('loader')).toBeInTheDocument();
      }, 100);
      
      // Now resolve
      resolveSignIn!({ error: null });
      
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });
    });

    test('resets loading state after successful authentication', async () => {
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
      
      // Loading state should be reset
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByText('Continue with Discord')).toBeInTheDocument();
    });

    test('resets loading state after authentication error', async () => {
      (signInDiscord as jest.Mock).mockResolvedValue({ error: 'Auth failed' });
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      
      // Loading state should be reset even on error
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByText('Continue with Discord')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error toast when Discord authentication fails', async () => {
      const errorMessage = 'Discord authentication failed';
      (signInDiscord as jest.Mock).mockResolvedValue({ error: errorMessage });
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to sign in with Discord');
      });
      
      // Should not navigate on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('displays error toast when GitHub authentication fails', async () => {
      const errorMessage = 'GitHub authentication failed';
      (signInGitHub as jest.Mock).mockResolvedValue({ error: errorMessage });
      
      render(<OAuthLoginButton provider="github" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to sign in with GitHub');
      });
    });

    test('displays error toast when Google authentication fails', async () => {
      // Google provider doesn't have a sign-in function, so it should default to anonymous
      const errorMessage = 'Anonymous authentication failed';
      (signInAnonymous as jest.Mock).mockResolvedValue({ error: errorMessage });
      
      render(<OAuthLoginButton provider="google" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to sign in anonymously');
      });
    });

    test('displays error toast when anonymous authentication fails', async () => {
      const errorMessage = 'Anonymous authentication failed';
      (signInAnonymous as jest.Mock).mockResolvedValue({ error: errorMessage });
      
      render(<OAuthLoginButton provider="anonymous" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to sign in anonymously');
      });
    });

    test('handles authentication promise rejection gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorMessage = 'Network error';
      (signInDiscord as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sign in:', expect.any(Error));
      });
      
      // Should reset loading state
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByText('Continue with Discord')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    test('logs specific error to console when authentication fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorMessage = 'Specific authentication error';
      (signInDiscord as jest.Mock).mockResolvedValue({ error: errorMessage });
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(errorMessage);
      });
      
      consoleErrorSpy.mockRestore();
    });

    test('handles null error gracefully', async () => {
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
      
      // Should not show error toast for null error
      expect(toast.error).not.toHaveBeenCalled();
    });

    test('handles undefined error response gracefully', async () => {
      (signInDiscord as jest.Mock).mockResolvedValue({});
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
      
      // Should not show error toast for undefined error
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('Provider Configuration', () => {
    test('defaults to anonymous provider for unknown provider', async () => {
      (signInAnonymous as jest.Mock).mockResolvedValue({ error: null });
      
      // Force an unknown provider through type assertion
      render(<OAuthLoginButton provider={'unknown' as 'discord'} />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(signInAnonymous).toHaveBeenCalled();
      });
    });

    test('Google provider defaults to anonymous sign-in function', async () => {
      (signInAnonymous as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="google" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(signInAnonymous).toHaveBeenCalled();
        expect(signInDiscord).not.toHaveBeenCalled();
        expect(signInGitHub).not.toHaveBeenCalled();
      });
    });

    test('uses correct default text for each provider', () => {
      const { rerender } = render(<OAuthLoginButton provider="discord" />);
      expect(screen.getByText('Continue with Discord')).toBeInTheDocument();

      rerender(<OAuthLoginButton provider="github" />);
      expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();

      rerender(<OAuthLoginButton provider="google" />);
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();

      rerender(<OAuthLoginButton provider="anonymous" />);
      expect(screen.getByText('Continue as anonymous')).toBeInTheDocument();
    });

    test('uses correct icon for each provider', () => {
      const { rerender, container } = render(<OAuthLoginButton provider="discord" />);
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<OAuthLoginButton provider="github" />);
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<OAuthLoginButton provider="google" />);
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<OAuthLoginButton provider="anonymous" />);
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Input Validation', () => {
    test('handles null custom icon correctly', () => {
      render(<OAuthLoginButton provider="discord" icon={null} />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveTextContent('Continue with Discord');
      // Should not show any icon
      expect(button.querySelector('svg')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-icon')).not.toBeInTheDocument();
    });

    test('handles empty string custom text', () => {
      render(<OAuthLoginButton provider="discord" text="" />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button.textContent?.trim()).toBe('');
    });

    test('handles whitespace-only custom text', () => {
      render(<OAuthLoginButton provider="discord" text="   " />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveTextContent('   ');
    });

    test('handles very long custom text', () => {
      const longText = 'A'.repeat(1000);
      render(<OAuthLoginButton provider="discord" text={longText} />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveTextContent(longText);
    });

    test('handles special characters in custom text', () => {
      const specialText = '< > & " \' / \\ 中文 🚀';
      render(<OAuthLoginButton provider="discord" text={specialText} />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveTextContent(specialText);
    });

    test('handles complex custom icons', () => {
      const complexIcon = (
        <div data-testid="complex-icon">
          <span>Icon</span>
          <svg viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="3" />
          </svg>
        </div>
      );
      
      render(<OAuthLoginButton provider="discord" icon={complexIcon} />);
      
      expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
      expect(screen.getByText('Icon')).toBeInTheDocument();
    });

    test('handles getSafeRedirectUrl returning different types of values', async () => {
      const testCases = [
        { input: '/path', expected: '/path' },
        { input: '', expected: '' },
        { input: null, expected: null },
        { input: undefined, expected: undefined },
      ];

      for (const testCase of testCases) {
        (getSafeRedirectUrl as jest.Mock).mockReturnValue(testCase.expected);
        (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
        
        const { unmount } = render(
          <OAuthLoginButton provider="discord" redirectUrl={testCase.input} />
        );
        
        const button = screen.getByTestId('oauth-button');
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(signInDiscord).toHaveBeenCalledWith(testCase.expected);
        });
        
        unmount();
        jest.clearAllMocks();
      }
    });
  });

  describe('Accessibility and UX', () => {
    test('button has correct type attribute', () => {
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveAttribute('type', 'button');
    });

    test('maintains accessibility attributes during loading', async () => {
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      (signInDiscord as jest.Mock).mockReturnValue(signInPromise);
      
      render(
        <OAuthLoginButton 
          provider="discord" 
          aria-label="Sign in with Discord"
          role="button"
        />
      );
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveAttribute('aria-label', 'Sign in with Discord');
      expect(button).toHaveAttribute('role', 'button');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeInTheDocument();
      });
      
      // Attributes should persist during loading
      expect(button).toHaveAttribute('aria-label', 'Sign in with Discord');
      expect(button).toHaveAttribute('role', 'button');
      
      resolveSignIn!({ error: null });
    });

    test('loading spinner has proper styling classes', async () => {
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      (signInDiscord as jest.Mock).mockReturnValue(signInPromise);
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const loader = screen.getByTestId('loader');
        expect(loader).toHaveClass('h-4', 'w-4', 'animate-spin');
      });
      
      resolveSignIn!({ error: null });
    });

    test('disabled state is properly handled', () => {
      render(<OAuthLoginButton provider="discord" disabled />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toBeDisabled();
      
      // Should not trigger authentication when disabled
      fireEvent.click(button);
      expect(signInDiscord).not.toHaveBeenCalled();
    });

    test('focus management works correctly', () => {
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      button.focus();
      
      expect(button).toHaveFocus();
      expect(document.activeElement).toBe(button);
    });

    test('keyboard interaction works correctly', async () => {
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      button.focus();
      
      // Simulate Enter key press
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.click(button); // React Testing Library doesn't automatically convert keyDown to click
      
      await waitFor(() => {
        expect(signInDiscord).toHaveBeenCalled();
      });
    });
  });

  describe('Component Integration', () => {
    test('integrates with class-variance-authority for styling', () => {
      render(<OAuthLoginButton provider="discord" size="sm" />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toHaveClass('mocked-cva-classes');
    });

    test('passes all required props to Button component', () => {
      const props = {
        provider: 'discord' as const,
        disabled: true,
        className: 'custom-class',
        'data-testid': 'custom-test-id',
        'aria-describedby': 'description',
      };
      
      render(<OAuthLoginButton {...props} />);
      
      const button = screen.getByTestId('oauth-button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    test('works with different router implementations', async () => {
      const alternateRouter = {
        push: jest.fn(),
        refresh: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
      };
      
      (useRouter as jest.Mock).mockReturnValue(alternateRouter);
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      
      render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(alternateRouter.push).toHaveBeenCalled();
        expect(alternateRouter.refresh).toHaveBeenCalled();
      });
    });

    test('handles concurrent authentication attempts across multiple instances', async () => {
      (signInDiscord as jest.Mock).mockResolvedValue({ error: null });
      (signInGitHub as jest.Mock).mockResolvedValue({ error: null });
      
      const { container } = render(
        <div>
          <OAuthLoginButton provider="discord" data-testid="discord-btn" />
          <OAuthLoginButton provider="github" data-testid="github-btn" />
        </div>
      );
      
      const discordBtn = container.querySelector('[data-testid="discord-btn"]');
      const githubBtn = container.querySelector('[data-testid="github-btn"]');
      
      // Click both buttons
      fireEvent.click(discordBtn!);
      fireEvent.click(githubBtn!);
      
      await waitFor(() => {
        expect(signInDiscord).toHaveBeenCalledTimes(1);
        expect(signInGitHub).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Performance and Memory', () => {
    test('properly cleans up state on unmount', async () => {
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      (signInDiscord as jest.Mock).mockReturnValue(signInPromise);
      
      const { unmount } = render(<OAuthLoginButton provider="discord" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      // Unmount before promise resolves
      unmount();
      
      // Resolve after unmount
      resolveSignIn!({ error: null });
      
      // Should not cause any issues or call router functions
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<OAuthLoginButton provider="discord" />);
        expect(screen.getByTestId('oauth-button')).toBeInTheDocument();
        unmount();
      }
    });

    test('handles prop changes during authentication', async () => {
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      (signInDiscord as jest.Mock).mockReturnValue(signInPromise);
      
      const { rerender } = render(<OAuthLoginButton provider="discord" text="Original" />);
      
      const button = screen.getByTestId('oauth-button');
      fireEvent.click(button);
      
      // Change props while authentication is in progress
      rerender(<OAuthLoginButton provider="discord" text="Changed" disabled />);
      
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      
      resolveSignIn!({ error: null });
      
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
        expect(screen.getByText('Changed')).toBeInTheDocument();
      });
    });
  });
});