# Contributing to FlowManga V2

Thank you for your interest in contributing to FlowManga! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear use case
   - Expected behavior
   - Mockups or examples (if applicable)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write/update tests if applicable
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📋 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/flowmamga.git
cd flowmamga

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 🎨 Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Use meaningful variable/function names
- Add comments for complex logic
- Keep functions small and focused

### Formatting

```bash
# Format code
npm run format

# Lint code
npm run lint
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 📝 Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add reading streak achievements
fix: resolve image upload error on mobile
docs: update API documentation
```

## 🏗️ Project Structure

```
src/
├── app/              # Next.js app router
│   ├── api/         # API routes
│   └── (pages)/     # Page components
├── components/       # React components
├── lib/             # Utility functions
├── stores/          # State management
└── types/           # TypeScript types
```

## 🔍 Areas for Contribution

### High Priority
- [ ] S3/Supabase storage integration
- [ ] Page upload UI with drag & drop
- [ ] WebSocket real-time notifications
- [ ] Mobile app (React Native)

### Medium Priority
- [ ] Advanced recommendation system
- [ ] Discord integration
- [ ] User reports system
- [ ] Content moderation tools

### Low Priority
- [ ] Theme customization
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)

## 🐛 Bug Fixes

When fixing bugs:
1. Add a test that reproduces the bug
2. Fix the bug
3. Verify the test passes
4. Update documentation if needed

## ✨ Adding Features

When adding features:
1. Discuss in an issue first (for large features)
2. Update database schema if needed
3. Create API endpoints
4. Build UI components
5. Add tests
6. Update documentation

## 📚 Documentation

- Update README.md for user-facing changes
- Update DEPLOYMENT.md for deployment changes
- Add JSDoc comments for functions
- Update API documentation

## 🔐 Security

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Follow security best practices
- Report security vulnerabilities privately

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to:
- Open an issue for questions
- Join our Discord community (if available)
- Email the maintainers

## 🙏 Thank You!

Every contribution helps make FlowManga better for everyone!
