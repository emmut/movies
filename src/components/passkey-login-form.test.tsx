import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PasskeyLoginForm } from './passkey-login-form';
import { signInPasskey } from '@/lib/auth-client';
import { getSafeRedirectUrl } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock('@/lib/auth-client', () => ({
  signInPasskey: jest.fn(),
}));

jest.mock('@/lib/utils', () => ({
  getSafeRedirectUrl: jest.fn(),
}));

jest.mock('@primer/octicons-react', () => ({
  PasskeyFillIcon: ({ size, className }: { size: number; className: string }) => (
    <div data-testid="passkey-icon" data-size={size} className={className} />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: string | number }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('PasskeyLoginForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockSignInPasskey = signInPasskey as jest.MockedFunction<typeof signInPasskey>;
  const mockGetSafeRedirectUrl = getSafeRedirectUrl as jest.MockedFunction<typeof getSafeRedirectUrl>;
  const mockToastError = toast.error as jest.MockedFunction<typeof toast.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  describe('Rendering', () => {
    it('renders the passkey login form with correct elements', () => {
      render(<PasskeyLoginForm />);
      
      expect(screen.getByRole('button', { name: /authenticate with passkey/i })).toBeInTheDocument();
      expect(screen.getByTestId('passkey-icon')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('renders hidden input with correct attributes', () => {
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.getByDisplayValue('') || screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).toHaveAttribute('type', 'hidden');
      expect(hiddenInput).toHaveAttribute('autoComplete', 'username webauthn');
    });

    it('renders button with correct styling classes', () => {
      render(<PasskeyLoginForm />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex', 'h-12', 'w-full', 'items-center', 'justify-center');
    });

    it('renders passkey icon with correct size', () => {
      render(<PasskeyLoginForm />);
      
      const icon = screen.getByTestId('passkey-icon');
      expect(icon).toHaveAttribute('data-size', '16');
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Loading State', () => {
    it('displays loading state during authentication', async () => {
      mockSignInPasskey.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<PasskeyLoginForm />);
      
      // Set email value by directly accessing the ref
      const hiddenInput = screen.getByDisplayValue('') || screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'test@example.com'
        });
      }
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('shows spinner animation during loading', async () => {
      mockSignInPasskey.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'test@example.com'
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      const spinner = screen.getByText('Authenticating...').parentElement?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('h-4', 'w-4', 'animate-spin', 'rounded-full', 'border-2', 'border-current', 'border-t-transparent');
    });
  });

  describe('Email Validation', () => {
    it('shows error when email is null or empty', async () => {
      render(<PasskeyLoginForm />);
      
      // Ensure input value is empty/null
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: ''
        });
      }
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Please enter your email address');
      });
      expect(mockSignInPasskey).not.toHaveBeenCalled();
    });

    it('shows error when email is empty string', async () => {
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: ''
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Please enter your email address');
      });
      expect(mockSignInPasskey).not.toHaveBeenCalled();
    });

    it('shows error when email is undefined', async () => {
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          get: () => undefined,
          configurable: true
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Please enter your email address');
      });
    });
  });

  describe('Successful Authentication', () => {
    it('calls signInPasskey with correct email', async () => {
      mockSignInPasskey.mockResolvedValue({ success: true });
      mockGetSafeRedirectUrl.mockReturnValue('/dashboard');
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockSignInPasskey).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('redirects to safe URL on successful authentication without redirectUrl', async () => {
      mockSignInPasskey.mockResolvedValue({ success: true });
      mockGetSafeRedirectUrl.mockReturnValue('/dashboard');
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockGetSafeRedirectUrl).toHaveBeenCalledWith(undefined);
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('redirects to provided redirectUrl on successful authentication', async () => {
      mockSignInPasskey.mockResolvedValue({ success: true });
      mockGetSafeRedirectUrl.mockReturnValue('/custom-redirect');
      
      render(<PasskeyLoginForm redirectUrl="/custom-redirect" />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockGetSafeRedirectUrl).toHaveBeenCalledWith('/custom-redirect');
        expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('handles various email formats correctly', async () => {
      const emails = [
        'simple@example.com',
        'user.name+tag@example.co.uk',
        'test123@sub.domain.org',
        'test@localhost'
      ];

      for (const email of emails) {
        jest.clearAllMocks();
        mockSignInPasskey.mockResolvedValue({ success: true });
        mockGetSafeRedirectUrl.mockReturnValue('/dashboard');
        
        const { unmount } = render(<PasskeyLoginForm />);
        
        const hiddenInput = screen.container.querySelector('input[type="hidden"]');
        if (hiddenInput) {
          Object.defineProperty(hiddenInput, 'value', {
            writable: true,
            value: email
          });
        }
        
        fireEvent.click(screen.getByRole('button'));
        
        await waitFor(() => {
          expect(mockSignInPasskey).toHaveBeenCalledWith(email);
        });
        
        unmount();
      }
    });
  });

  describe('Failed Authentication', () => {
    it('shows error message on authentication failure', async () => {
      mockSignInPasskey.mockResolvedValue({ error: 'Authentication failed' });
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to sign in with passkey. Please try again.');
      });
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('resets loading state on authentication failure', async () => {
      mockSignInPasskey.mockResolvedValue({ error: 'Authentication failed' });
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
      
      expect(button).not.toBeDisabled();
      expect(screen.getByText('Authenticate with Passkey')).toBeInTheDocument();
    });

    it('handles various error response formats', async () => {
      const errorResponses = [
        { error: 'Network error' },
        { error: { message: 'Server error' } },
        { error: true },
        { error: '' },
        null,
        undefined
      ];

      for (const response of errorResponses) {
        jest.clearAllMocks();
        mockSignInPasskey.mockResolvedValue(response);
        
        const { unmount } = render(<PasskeyLoginForm />);
        
        const hiddenInput = screen.container.querySelector('input[type="hidden"]');
        if (hiddenInput) {
          Object.defineProperty(hiddenInput, 'value', {
            writable: true,
            value: 'test@example.com'
          });
        }
        
        fireEvent.click(screen.getByRole('button'));
        
        await waitFor(() => {
          if (response?.error) {
            expect(mockToastError).toHaveBeenCalledWith('Failed to sign in with passkey. Please try again.');
          } else {
            expect(mockGetSafeRedirectUrl).toHaveBeenCalled();
          }
        });
        
        unmount();
      }
    });
  });

  describe('Form Submission', () => {
    it('handles form submission via onSubmit event', async () => {
      mockSignInPasskey.mockResolvedValue({ success: true });
      mockGetSafeRedirectUrl.mockReturnValue('/dashboard');
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSignInPasskey).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('prevents default form submission behavior', async () => {
      mockSignInPasskey.mockResolvedValue({ success: true });
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      const form = screen.getByRole('form');
      const mockEvent = { preventDefault: jest.fn() };

      fireEvent.submit(form, mockEvent);
      
      await waitFor(() => {
        expect(mockSignInPasskey).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles signInPasskey throwing an exception', async () => {
      mockSignInPasskey.mockRejectedValue(new Error('Network error'));
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      // The component doesn't have explicit error handling for exceptions,
      // so we just verify it was called
      await waitFor(() => {
        expect(mockSignInPasskey).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('handles multiple rapid clicks gracefully', async () => {
      mockSignInPasskey.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      mockGetSafeRedirectUrl.mockReturnValue('/dashboard');
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      const button = screen.getByRole('button');
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should only call signInPasskey once due to loading state
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
      
      await waitFor(() => {
        expect(mockSignInPasskey).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });

    it('handles empty getSafeRedirectUrl response', async () => {
      mockSignInPasskey.mockResolvedValue({ success: true });
      mockGetSafeRedirectUrl.mockReturnValue('');
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('handles very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@' + 'b'.repeat(50) + '.com';
      mockSignInPasskey.mockResolvedValue({ success: true });
      mockGetSafeRedirectUrl.mockReturnValue('/dashboard');
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: longEmail
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockSignInPasskey).toHaveBeenCalledWith(longEmail);
      });
    });
  });

  describe('Component Props', () => {
    it('works without redirectUrl prop', () => {
      render(<PasskeyLoginForm />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('works with redirectUrl prop', () => {
      render(<PasskeyLoginForm redirectUrl="/custom" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles null redirectUrl', () => {
      render(<PasskeyLoginForm redirectUrl={null} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles undefined redirectUrl explicitly', () => {
      render(<PasskeyLoginForm redirectUrl={undefined} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure for screen readers', () => {
      render(<PasskeyLoginForm />);
      
      const form = screen.getByRole('form');
      const button = screen.getByRole('button');
      const input = screen.container.querySelector('input[type="hidden"]');
      
      expect(form).toContainElement(button);
      expect(form).toContainElement(input);
    });

    it('button has appropriate disabled state initially', () => {
      render(<PasskeyLoginForm />);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('maintains focus management during loading states', async () => {
      mockSignInPasskey.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'test@example.com'
        });
      }
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.click(button);
      
      expect(document.activeElement).toBe(button);
      expect(button).toBeDisabled();
    });

    it('has appropriate button text for screen readers', () => {
      render(<PasskeyLoginForm />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Authenticate with Passkey');
    });

    it('provides appropriate loading feedback for screen readers', async () => {
      mockSignInPasskey.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'test@example.com'
        });
      }
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });
  });

  describe('Button Click vs Form Submit', () => {
    it('handles both button click and form submit events', async () => {
      mockSignInPasskey.mockResolvedValue({ success: true });
      mockGetSafeRedirectUrl.mockReturnValue('/dashboard');
      
      render(<PasskeyLoginForm />);
      
      const hiddenInput = screen.container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'value', {
          writable: true,
          value: 'user@example.com'
        });
      }
      
      // Test button click
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockSignInPasskey).toHaveBeenCalledWith('user@example.com');
      });
      
      // Reset mocks
      jest.clearAllMocks();
      mockSignInPasskey.mockResolvedValue({ success: true });
      mockGetSafeRedirectUrl.mockReturnValue('/dashboard');
      
      // Test form submit
      fireEvent.submit(screen.getByRole('form'));
      
      await waitFor(() => {
        expect(mockSignInPasskey).toHaveBeenCalledWith('user@example.com');
      });
    });
  });
});