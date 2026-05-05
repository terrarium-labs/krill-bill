# LAIA - TIMBAL AI Platform

> **⚠️ PRIVATE PROJECT**: This repository is a personal copy of the LAIA platform developed for TIMBAL Tech Company. This code is confidential and proprietary. **Not to be released or distributed without explicit authorization from TIMBAL Tech Company.**

## Overview

LAIA (Logistics and AI Integration Architecture) is a comprehensive enterprise resource planning and management platform built for TIMBAL Tech Company. The application provides integrated solutions for managing employees, clients, suppliers, inventory, sales, purchases, and various operational aspects of a modern business.

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: RSBuild
- **Styling**: Tailwind CSS with PostCSS
- **UI Components**: Radix UI
- **Form Handling**: React Hook Form
- **State Management**: React Context API
- **PDF Generation**: @hyperline/react-pdf-tailwind
- **Real-time Communication**: LiveKit
- **Code Editor**: Monaco Editor
- **Authentication**: OAuth 2.0

### Backend
- AWS Amplify for deployment and backend services
- RESTful API architecture

### Development Tools
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint
- **Package Manager**: Bun
- **CI/CD**: AWS Amplify
- **Version Control**: Git

## Project Structure

```
src/
├── api/              # API client layers and backend integrations
│   ├── 0.core/      # Core API utilities
│   ├── chat/        # Chat API integration
│   ├── clients/     # Clients management API
│   ├── employees/   # Employee management API
│   ├── trainings/   # Training management API
│   └── ...          # Other domain-specific APIs
├── app/             # Application routes and features
│   ├── MainLayout.tsx    # Root layout component
│   ├── MainRoutes.tsx    # Application routing
│   ├── employees/   # Employee management features
│   ├── clients/     # Client management features
│   ├── sales/       # Sales management features
│   ├── purchases/   # Purchase management features
│   ├── trainings/   # Training management features
│   ├── chat/        # Chat/messaging features
│   └── ...          # Other feature modules
├── auth/            # Authentication logic
│   ├── AuthContext.tsx   # Auth state management
│   ├── AuthGuard.tsx     # Route protection
│   └── components/  # Auth-related components
├── components/      # Reusable UI components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── locales/         # Internationalization files
├── styles/          # Global styles
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Key Features

### Core Modules
- **Employee Management**: HR, payroll, absences, sick leaves, on-call scheduling
- **Client Management**: Client database, communication, project tracking
- **Sales Management**: Sales invoices, rates, quotations
- **Purchase Management**: Purchase orders, supplier management, invoices
- **Inventory**: Items, warehouses, item rates
- **Training**: Training programs, sessions, enrollments
- **Chat**: Real-time messaging and communication
- **Work Orders**: Task and work order management
- **Field Service**: Mobile-friendly field operations
- **Analytics**: Business intelligence and reporting
- **Mission Control**: Central dashboard and monitoring
- **Ratings & Billing**: Rate management, billing cycles

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Bun package manager
- AWS Amplify CLI (for deployment)

### Installation

```bash
# Install dependencies using Bun
bun install
```

### Development

```bash
# Start development server with hot reload
bun run dev

# The application will open in your default browser at http://localhost:5173
```

### Building for Production

```bash
# Build the project
bun run build

# Preview the production build
bun run preview
```

### Code Quality

```bash
# Run ESLint
bun run lint
```

## Deployment

This project is configured to deploy on AWS Amplify. The deployment process is automated via the `amplify.yml` configuration:

```bash
# Prerequisites: AWS Amplify CLI installed and configured
amplify publish
```

The build process:
1. Installs Bun runtime
2. Installs project dependencies
3. Compiles TypeScript and builds assets
4. Outputs artifacts to the `dist/` directory

## Code Standards

- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS utility-first approach
- **Component Structure**: Functional components with hooks
- **Type Safety**: Full TypeScript coverage, no `any` types without justification
- **Linting**: ESLint with custom configuration

### Path Aliases
- `@/*` - Maps to `src/` for imports
- `@docs/*` - Maps to `docs/` for documentation imports

## Team

- **Isaac Grau** - [@isigr57](https://github.com/isigr57) - igrau@timbal.ai
- **Charlie Rios** - [@xarlizard](https://github.com/xarlizard) - crios@timbal.ai

## Documentation

- API Specifications: See `docs/api/`
- Chat Widget Documentation: See `docs/chat/`
- Architecture Notes: See `docs/api/trainings-v2-improvements.md`

## Contributing

This is a private project. Contributions are limited to TIMBAL Tech Company team members. All changes must:
1. Follow the existing code style and TypeScript patterns
2. Include appropriate tests
3. Pass ESLint validation
4. Be documented in commit messages

## Security & Privacy

⚠️ **CONFIDENTIAL**: This repository contains proprietary code and should:
- Never be shared with external parties
- Never be forked or cloned to public repositories
- Never be used for purposes outside of TIMBAL Tech Company
- Never be committed with sensitive credentials or API keys

## License

**PROPRIETARY LICENSE** - See LICENSE file for details. All rights reserved. This code is the exclusive property of TIMBAL Tech Company and cannot be used, modified, or distributed without explicit written permission.

## Support

For issues, questions, or contributions, contact the TIMBAL Tech Company development team.

---

**Last Updated**: April 2026  
**Status**: Active Development  
**Version**: 1.0.0
