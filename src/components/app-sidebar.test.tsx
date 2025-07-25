import { render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import { usePathname } from 'next/navigation'
import { AppSidebar } from './app-sidebar'
import type { Session } from '@/lib/auth-client'
import type { PropsWithChildren, AnchorHTMLAttributes, HTMLAttributes } from 'react'

// Mock external dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@/components/brand', () => ({
  __esModule: true,
  default: () => <div data-testid="brand">Brand</div>,
}))

jest.mock('./nav-user', () => ({
  NavUser: ({ user }: { user: { name: string; email: string; avatar: string } }) => (
    <div data-testid="nav-user">
      <span data-testid="user-name">{user.name}</span>
      <span data-testid="user-email">{user.email}</span>
      <span data-testid="user-avatar">{user.avatar}</span>
    </div>
  ),
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' '),
  createLoginUrl: (pathname: string) => `/login?redirect=${encodeURIComponent(pathname)}`,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
    <div data-testid="sidebar" {...props}>{children}</div>
  ),
  SidebarContent: ({ children }: PropsWithChildren<{}>) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarFooter: ({ children }: PropsWithChildren<{}>) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  SidebarGroupContent: ({ children }: PropsWithChildren<{}>) => (
    <div data-testid="sidebar-group-content">{children}</div>
  ),
  SidebarHeader: ({ children }: PropsWithChildren<{}>) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarMenu: ({ children }: PropsWithChildren<{}>) => (
    <div data-testid="sidebar-menu">{children}</div>
  ),
  SidebarMenuButton: ({
    children,
    asChild,
    isActive,
    ...props
  }: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { asChild?: boolean; isActive?: boolean }>) => (
    <div data-testid="sidebar-menu-button" data-active={isActive} {...props}>
      {children}
    </div>
  ),
  SidebarMenuItem: ({ children }: PropsWithChildren<{}>) => (
    <div data-testid="sidebar-menu-item">{children}</div>
  ),
  SidebarRail: () => <div data-testid="sidebar-rail" />,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Home: ({ className }: { className?: string }) => <div data-testid="home-icon" className={className} />,
  LogIn: ({ className }: { className?: string }) => <div data-testid="login-icon" className={className} />,
  Sparkles: ({ className }: { className?: string }) => <div data-testid="sparkles-icon" className={className} />,
  Star: ({ className }: { className?: string }) => <div data-testid="star-icon" className={className} />,
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('AppSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Structure and Props', () => {
    it('renders all required sidebar components in correct hierarchy', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-rail')).toBeInTheDocument()
      expect(screen.getByTestId('brand')).toBeInTheDocument()
    })

    it('forwards additional props to the Sidebar component', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} className="custom-sidebar" data-testid="test-sidebar" />)

      const sidebar = screen.getByTestId('test-sidebar')
      expect(sidebar).toHaveClass('custom-sidebar')
    })

    it('maintains proper DOM structure with nested components', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toContainElement(screen.getByTestId('sidebar-header'))
      expect(sidebar).toContainElement(screen.getByTestId('sidebar-content'))
      expect(sidebar).toContainElement(screen.getByTestId('sidebar-footer'))
      expect(sidebar).toContainElement(screen.getByTestId('sidebar-rail'))
    })
  })

  describe('Main Navigation Rendering', () => {
    it('displays all main navigation items with correct labels and icons', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Discover')).toBeInTheDocument()
      expect(screen.getByTestId('home-icon')).toBeInTheDocument()
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument()
    })

    it('creates navigation links with correct href attributes', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      const homeLink = screen.getByRole('link', { name: /home/i })
      const discoverLink = screen.getByRole('link', { name: /discover/i })

      expect(homeLink).toHaveAttribute('href', '/')
      expect(discoverLink).toHaveAttribute('href', '/discover')
    })

    it('renders navigation items as accessible links', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /discover/i })).toBeInTheDocument()
    })
  })

  describe('Active State Management', () => {
    it('marks home navigation as active when on home page', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      const homeButton = menuButtons.find(button =>
        button.querySelector('[data-testid="home-icon"]')
      )

      expect(homeButton).toHaveAttribute('data-active', 'true')
    })

    it('marks discover navigation as active when on discover page', () => {
      mockUsePathname.mockReturnValue('/discover')

      render(<AppSidebar initialSession={null} />)

      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      const discoverButton = menuButtons.find(button =>
        button.querySelector('[data-testid="sparkles-icon"]')
      )

      expect(discoverButton).toHaveAttribute('data-active', 'true')
    })

    it('applies fill-current class to active navigation icons', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      const homeIcon = screen.getByTestId('home-icon')
      const sparklesIcon = screen.getByTestId('sparkles-icon')

      expect(homeIcon).toHaveClass('h-4', 'w-4', 'fill-current')
      expect(sparklesIcon).toHaveClass('h-4', 'w-4')
      expect(sparklesIcon).not.toHaveClass('fill-current')
    })

    it('does not mark any navigation as active for unmatched paths', () => {
      mockUsePathname.mockReturnValue('/unknown-path')

      render(<AppSidebar initialSession={null} />)

      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      menuButtons.forEach(button => {
        expect(button).toHaveAttribute('data-active', 'false')
      })
    })
  })

  describe('User-Authenticated Navigation', () => {
    const authenticatedSession: Session = {
      user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        image: 'https://example.com/avatar.jpg',
      },
      session: 'session-token',
    }

    it('shows user-specific navigation when authenticated', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={authenticatedSession} />)

      expect(screen.getByText('Watchlist')).toBeInTheDocument()
      expect(screen.getByTestId('star-icon')).toBeInTheDocument()
    })

    it('creates user navigation link with correct href', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={authenticatedSession} />)

      const watchlistLink = screen.getByRole('link', { name: /watchlist/i })
      expect(watchlistLink).toHaveAttribute('href', '/watchlist')
    })

    it('marks user navigation as active when on user page', () => {
      mockUsePathname.mockReturnValue('/watchlist')

      render(<AppSidebar initialSession={authenticatedSession} />)

      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      const watchlistButton = menuButtons.find(button =>
        button.querySelector('[data-testid="star-icon"]')
      )

      expect(watchlistButton).toHaveAttribute('data-active', 'true')
    })

    it('applies fill-current class to active user navigation icons', () => {
      mockUsePathname.mockReturnValue('/watchlist')

      render(<AppSidebar initialSession={authenticatedSession} />)

      const starIcon = screen.getByTestId('star-icon')
      expect(starIcon).toHaveClass('h-4', 'w-4', 'fill-current')
    })

    it('hides user navigation when not authenticated', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      expect(screen.queryByText('Watchlist')).not.toBeInTheDocument()
      expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument()
    })

    it('hides user navigation when session has no user', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={{ user: null, session: 'token' } as unknown as Session} />)

      expect(screen.queryByText('Watchlist')).not.toBeInTheDocument()
      expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument()
    })
  })

  describe('Footer User Display', () => {
    const userSession: Session = {
      user: {
        id: 'user-456',
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        image: 'https://test.com/jane-avatar.png',
      },
      session: 'user-session-token',
    }

    it('displays NavUser component when user is authenticated', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={userSession} />)

      expect(screen.getByTestId('nav-user')).toBeInTheDocument()
      expect(screen.getByTestId('user-name')).toHaveTextContent('Jane Smith')
      expect(screen.getByTestId('user-email')).toHaveTextContent('jane.smith@test.com')
      expect(screen.getByTestId('user-avatar')).toHaveTextContent('https://test.com/jane-avatar.png')
    })

    it('handles null avatar image in user data', () => {
      const sessionNoAvatar: Session = {
        user: {
          id: 'user-789',
          name: 'No Avatar User',
          email: 'noavatar@example.com',
          image: null,
        },
        session: 'no-avatar-session',
      }

      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={sessionNoAvatar} />)

      expect(screen.getByTestId('user-avatar')).toHaveTextContent('')
    })

    it('handles empty user data fields gracefully', () => {
      const emptyUserSession: Session = {
        user: {
          id: 'empty-user',
          name: '',
          email: '',
          image: null,
        },
        session: 'empty-session',
      }

      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={emptyUserSession} />)

      expect(screen.getByTestId('nav-user')).toBeInTheDocument()
      expect(screen.getByTestId('user-name')).toHaveTextContent('')
      expect(screen.getByTestId('user-email')).toHaveTextContent('')
    })

    it('does not show NavUser when session is null', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      expect(screen.queryByTestId('nav-user')).not.toBeInTheDocument()
    })
  })

  describe('Login Button Display', () => {
    it('shows login button when not authenticated', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByTestId('login-icon')).toBeInTheDocument()
    })

    it('creates login link with redirect parameter', () => {
      mockUsePathname.mockReturnValue('/current-page')

      render(<AppSidebar initialSession={null} />)

      const loginLink = screen.getByRole('link', { name: /login/i })
      expect(loginLink).toHaveAttribute('href', '/login?redirect=%2Fcurrent-page')
    })

    it('hides login button when already on login page', () => {
      mockUsePathname.mockReturnValue('/login')

      render(<AppSidebar initialSession={null} />)

      expect(screen.queryByText('Login')).not.toBeInTheDocument()
      expect(screen.queryByTestId('login-icon')).not.toBeInTheDocument()
    })

    it('hides login button when user is authenticated', () => {
      const session: Session = {
        user: {
          id: 'authenticated-user',
          name: 'Auth User',
          email: 'auth@example.com',
          image: 'https://example.com/auth.jpg',
        },
        session: 'auth-session',
      }

      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={session} />)

      expect(screen.queryByText('Login')).not.toBeInTheDocument()
      expect(screen.queryByTestId('login-icon')).not.toBeInTheDocument()
    })

    it('handles special characters in pathname for login redirect', () => {
      mockUsePathname.mockReturnValue('/path with spaces & symbols')

      render(<AppSidebar initialSession={null} />)

      const loginLink = screen.getByRole('link', { name: /login/i })
      expect(loginLink).toHaveAttribute('href', '/login?redirect=%2Fpath%20with%20spaces%20%26%20symbols')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles undefined session without crashing', () => {
      mockUsePathname.mockReturnValue('/')

      expect(() => {
        render(<AppSidebar initialSession={undefined as unknown as Session} />)
      }).not.toThrow()

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Login')).toBeInTheDocument()
    })

    it('handles empty pathname string', () => {
      mockUsePathname.mockReturnValue('')

      render(<AppSidebar initialSession={null} />)

      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      menuButtons.forEach(button => {
        expect(button).toHaveAttribute('data-active', 'false')
      })
    })

    it('handles pathname with trailing slash correctly', () => {
      mockUsePathname.mockReturnValue('/discover/')

      render(<AppSidebar initialSession={null} />)

      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      // Should not match exact paths when trailing slash present
      menuButtons.forEach(button => {
        expect(button).toHaveAttribute('data-active', 'false')
      })
    })

    it('handles very long pathnames for login redirect', () => {
      const longPath = '/extremely/long/path/with/many/segments/that/could/potentially/cause/issues'
      mockUsePathname.mockReturnValue(longPath)

      render(<AppSidebar initialSession={null} />)

      const loginLink = screen.getByRole('link', { name: /login/i })
      expect(loginLink).toHaveAttribute('href', `/login?redirect=${encodeURIComponent(longPath)}`)
    })

    it('maintains stability when session object structure is malformed', () => {
      mockUsePathname.mockReturnValue('/')

      expect(() => {
        render(<AppSidebar initialSession={{ invalidProperty: 'test' } as unknown as Session} />)
      }).not.toThrow()

      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.queryByText('Watchlist')).not.toBeInTheDocument()
    })
  })

  describe('Integration and Accessibility', () => {
    it('ensures all navigation links are keyboard accessible', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).not.toHaveAttribute('tabindex', '-1')
      })
    })

    it('provides semantic structure with icons and text', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      const homeLink = screen.getByRole('link', { name: /home/i })
      const discoverLink = screen.getByRole('link', { name: /discover/i })

      expect(homeLink).toContainElement(screen.getByTestId('home-icon'))
      expect(homeLink).toHaveTextContent('Home')
      expect(discoverLink).toContainElement(screen.getByTestId('sparkles-icon'))
      expect(discoverLink).toHaveTextContent('Discover')
    })

    it('correctly integrates with Next.js Link component', () => {
      mockUsePathname.mockReturnValue('/')

      render(<AppSidebar initialSession={null} />)

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link.tagName).toBe('A')
      })
    })

    it('maintains proper focus order in navigation', () => {
      mockUsePathname.mockReturnValue('/')

      const session: Session = {
        user: {
          id: 'focus-user',
          name: 'Focus User',
          email: 'focus@example.com',
          image: null,
        },
        session: 'focus-session',
      }

      render(<AppSidebar initialSession={session} />)

      const links = screen.getAllByRole('link')
      // Should have Home, Discover, and Watchlist links in logical order
      expect(links.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Complex Scenarios', () => {
    it('handles authenticated user on watchlist page with all components visible', () => {
      mockUsePathname.mockReturnValue('/watchlist')

      const fullSession: Session = {
        user: {
          id: 'complex-user',
          name: 'Complex User',
          email: 'complex@example.com',
          image: 'https://example.com/complex.jpg',
        },
        session: 'complex-session',
      }

      render(<AppSidebar initialSession={fullSession} />)

      // Should show all navigation items
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Discover')).toBeInTheDocument()
      expect(screen.getByText('Watchlist')).toBeInTheDocument()

      // Should show user info
      expect(screen.getByTestId('nav-user')).toBeInTheDocument()

      // Should not show login
      expect(screen.queryByText('Login')).not.toBeInTheDocument()

      // Watchlist should be active
      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      const activeButtons = menuButtons.filter(button =>
        button.getAttribute('data-active') === 'true'
      )
      expect(activeButtons).toHaveLength(1)
      expect(activeButtons[0]).toContainElement(screen.getByTestId('star-icon'))
    })

    it('transitions between authentication states correctly', () => {
      mockUsePathname.mockReturnValue('/')

      const { rerender } = render(<AppSidebar initialSession={null} />)

      // Initially unauthenticated
      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.queryByText('Watchlist')).not.toBeInTheDocument()

      // Re-render with authenticated session
      const session: Session = {
        user: {
          id: 'transition-user',
          name: 'Transition User',
          email: 'transition@example.com',
          image: null,
        },
        session: 'transition-session',
      }

      rerender(<AppSidebar initialSession={session} />)

      // Now authenticated
      expect(screen.queryByText('Login')).not.toBeInTheDocument()
      expect(screen.getByText('Watchlist')).toBeInTheDocument()
      expect(screen.getByTestId('nav-user')).toBeInTheDocument()
    })

    it('handles navigation state correctly with multiple users', () => {
      mockUsePathname.mockReturnValue('/discover')

      const userA: Session = {
        user: {
          id: 'user-a',
          name: 'User A',
          email: 'usera@example.com',
          image: 'https://example.com/a.jpg',
        },
        session: 'session-a',
      }

      const { rerender } = render(<AppSidebar initialSession={userA} />)

      expect(screen.getByTestId('user-name')).toHaveTextContent('User A')
      expect(screen.getByTestId('user-email')).toHaveTextContent('usera@example.com')

      const userB: Session = {
        user: {
          id: 'user-b',
          name: 'User B',
          email: 'userb@example.com',
          image: null,
        },
        session: 'session-b',
      }

      rerender(<AppSidebar initialSession={userB} />)

      expect(screen.getByTestId('user-name')).toHaveTextContent('User B')
      expect(screen.getByTestId('user-email')).toHaveTextContent('userb@example.com')
    })
  })
})