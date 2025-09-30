# Contributing to VintLang VS Code Extension

Thank you for your interest in contributing to the VintLang VS Code Extension! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v7 or higher
- VS Code v1.74.0 or higher
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vscode-extension.git
   cd vscode-extension
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Open in VS Code:
   ```bash
   code .
   ```

5. Press F5 to launch the Extension Development Host

## 📝 Development Workflow

### Code Style

We use ESLint and Prettier to maintain code quality:

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Coding Standards

- Use 4 spaces for indentation
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Keep functions small and focused
- Write descriptive commit messages

### Testing

```bash
# Run tests
npm test

# Test manually
# Press F5 in VS Code to launch Extension Development Host
```

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Test your changes thoroughly
4. Lint and format your code:
   ```bash
   npm run lint:fix
   npm run format
   ```

5. Commit your changes:
   ```bash
   git commit -m "feat: add your feature description"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a Pull Request

## 🎯 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add code folding support
fix: resolve syntax highlighting issue with nested functions
docs: update README with new configuration options
```

## 🐛 Reporting Bugs

When reporting bugs, please include:

- VS Code version
- Extension version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

## 💡 Suggesting Features

We welcome feature suggestions! Please:

- Check if the feature has already been requested
- Provide a clear description of the feature
- Explain the use case and benefits
- Include examples if possible

## 📋 Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md following the existing format
3. Ensure all tests pass
4. Ensure code is properly linted and formatted
5. Request review from maintainers
6. Address review feedback

## 🔍 Code Review Guidelines

### For Contributors
- Be open to feedback
- Respond to comments promptly
- Keep discussions focused and professional

### For Reviewers
- Be respectful and constructive
- Focus on the code, not the person
- Explain the reasoning behind suggestions
- Approve when satisfied with changes

## 📚 Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [VintLang Documentation](https://vintlang.ekilie.com/docs)
- [Development Guide](./DEVELOPMENT.md)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## 📞 Getting Help

- Open an issue for bugs or feature requests
- Join discussions in existing issues
- Check the [DEVELOPMENT.md](./DEVELOPMENT.md) guide

Thank you for contributing! 🎉
