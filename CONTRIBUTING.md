# Contributing to Advancia PayLedger

Thank you for your interest in contributing to Advancia PayLedger! We welcome contributions from
the community and are pleased to have you join us.

## Table of Contents

- [Contributing to Advancia PayLedger](#contributing-to-advancia-payledger)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Local Development](#local-development)
  - [Project Structure](#project-structure)
  - [Development Workflow](#development-workflow)
  - [Code Style](#code-style)
    - [TypeScript](#typescript)
    - [React Components](#react-components)
    - [Naming Conventions](#naming-conventions)
    - [File Organization](#file-organization)
    - [Comments](#comments)
  - [Testing](#testing)
    - [Unit Tests](#unit-tests)
    - [Integration Tests](#integration-tests)
    - [E2E Tests](#e2e-tests)
  - [Submitting Changes](#submitting-changes)
    - [Before Submitting](#before-submitting)
    - [Pull Request Process](#pull-request-process)
    - [Review Process](#review-process)
  - [Reporting Bugs](#reporting-bugs)
  - [Feature Requests](#feature-requests)
  - [Questions?](#questions)
  - [Recognition](#recognition)
  - [License](#license)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this
code. Please report unacceptable behavior to conduct@advanciapayledger.com.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher
- **PostgreSQL**: Version 14 or higher (or Supabase account)
- **Git**: Latest version
- **A code editor**: We recommend VS Code

### Local Development

1. **Fork the repository**

   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/personal-website.git
   cd personal-website
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/muchaeljohn739337-cloud/personal-website.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Set up environment variables**

   ```bash
   # Copy the example environment file
   cp env.example .env.local

   # Edit .env.local with your credentials
   # NEVER commit this file!
   ```

6. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # Seed the database (optional)
   npm run db:seed
   ```

7. **Run the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Project Structure

```
personal-website/
├── app/                    # Next.js app directory
│   ├── (admin)/           # Admin routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/                # UI components
│   └── dashboard/         # Dashboard components
├── lib/                   # Utility functions and libraries
│   ├── auth/              # Authentication utilities
│   ├── security/          # Security utilities
│   └── agents/            # AI agent system
├── prisma/                # Database schema and migrations
├── scripts/               # Utility scripts
├── public/                # Static assets
└── __tests__/            # Test files
```

## Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

   Branch naming conventions:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation changes
   - `refactor/` - Code refactoring
   - `test/` - Adding tests
   - `chore/` - Maintenance tasks

2. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation as needed

3. **Keep your branch updated**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **Run tests**

   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm run test:watch

   # Run E2E tests
   npm run test:e2e

   # Check test coverage
   npm run test:coverage
   ```

5. **Lint your code**

   ```bash
   # Run ESLint
   npm run lint

   # Fix linting issues
   npm run lint:fix

   # Check TypeScript types
   npm run type-check
   ```

6. **Commit your changes**

   We follow [Conventional Commits](https://www.conventionalcommits.org/):

   ```bash
   git commit -m "feat: add new payment method"
   git commit -m "fix: resolve authentication issue"
   git commit -m "docs: update API documentation"
   ```

   Commit types:
   - `feat` - New feature
   - `fix` - Bug fix
   - `docs` - Documentation changes
   - `style` - Code style changes (formatting, etc.)
   - `refactor` - Code refactoring
   - `test` - Adding or updating tests
   - `chore` - Maintenance tasks
   - `perf` - Performance improvements
   - `ci` - CI/CD changes

7. **Push your changes**

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Link related issues

## Code Style

### TypeScript

- Use TypeScript for all new code
- Avoid `any` type - use proper types or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions and complex types

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Use descriptive component names
- Extract reusable logic into custom hooks
- Keep components small and focused

```typescript
// Good
export function UserProfile({ userId }: { userId: string }) {
  const { user, loading } = useUser(userId);

  if (loading) return <Spinner />;

  return <div>{user.name}</div>;
}
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)

### File Organization

- One component per file
- Co-locate related files
- Use index files for exports
- Keep files under 300 lines

### Comments

- Write self-documenting code
- Add comments for complex logic
- Use JSDoc for public APIs
- Keep comments up-to-date

```typescript
/**
 * Calculates the total amount including tax and fees
 * @param amount - Base amount in cents
 * @param taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @returns Total amount in cents
 */
function calculateTotal(amount: number, taxRate: number): number {
  return Math.round(amount * (1 + taxRate));
}
```

## Testing

### Unit Tests

- Write tests for all business logic
- Aim for 80%+ code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('calculateTotal', () => {
  it('should calculate total with tax', () => {
    // Arrange
    const amount = 1000;
    const taxRate = 0.1;

    // Act
    const result = calculateTotal(amount, taxRate);

    // Assert
    expect(result).toBe(1100);
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Use test database
- Clean up after tests

### E2E Tests

- Test critical user flows
- Test authentication
- Test payment processes
- Use Playwright

## Submitting Changes

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Types check (`npm run type-check`)
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with main

### Pull Request Process

1. **Fill out the PR template completely**
2. **Link related issues** using keywords (Fixes #123)
3. **Request reviews** from maintainers
4. **Address feedback** promptly
5. **Keep PR focused** - one feature/fix per PR
6. **Update PR** as needed

### Review Process

- Maintainers will review within 48 hours
- Address all review comments
- Be open to feedback and suggestions
- Be respectful and professional

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) to report bugs.

Include:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

## Feature Requests

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) to suggest features.

Include:

- Clear description
- Use cases
- Expected behavior
- Alternative solutions considered

## Questions?

- Check existing issues and discussions
- Ask in GitHub Discussions
- Email: support@advanciapayledger.com

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to contribute more

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing! 🎉
