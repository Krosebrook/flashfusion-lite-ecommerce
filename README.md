# FlashFusion Lite E-Commerce Platform

> A modern, microservices-based multi-tenant e-commerce platform built with Encore.dev, React, and TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)
[![Encore](https://img.shields.io/badge/Encore-1.50-purple)](https://encore.dev/)

## Overview

FlashFusion Lite enables creators to build and launch their own e-commerce stores in minutes. No coding required, just pure simplicity.

### Features

- **Multi-Tenant Architecture** - Each merchant gets their own branded storefront
- **Product Management** - Full CRUD operations with images, inventory tracking, and categories
- **Secure Payments** - Stripe integration for one-time and subscription payments
- **Order Management** - Complete order lifecycle from cart to delivery
- **Analytics** - Track views, clicks, purchases, and key metrics
- **User Authentication** - Powered by Clerk
- **Email Notifications** - Transactional emails via Resend
- **Responsive Design** - Beautiful UI built with Tailwind CSS and Radix UI

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Encore CLI](https://encore.dev/docs/install) - Backend development framework
- [Node.js 18+](https://nodejs.org/) - For frontend tooling

Install Encore CLI:
```bash
# macOS
brew install encoredev/tap/encore

# Linux
curl -L https://encore.dev/install.sh | bash

# Windows
iwr https://encore.dev/install.ps1 | iex
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flashfusion-lite-ecommerce.git
   cd flashfusion-lite-ecommerce
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**

   Configure your Clerk and Stripe keys in the appropriate service files:
   - Clerk: `frontend/config.ts`
   - Stripe: Set via Encore secrets (see [DEVELOPMENT.md](DEVELOPMENT.md))

4. **Start the backend**
   ```bash
   cd backend
   encore run
   ```
   Backend will be available at `http://localhost:4000`

5. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   bun install
   bun run dev
   ```
   Frontend will be available at `http://localhost:5173`

## Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Setup and development guide
- **[ROADMAP.md](ROADMAP.md)** - Comprehensive strategic roadmap with 3, 6, and 9-month plans
- **[Architecture Overview](ROADMAP.md#architecture-audit)** - System architecture and design

## Project Structure

```
flashfusion-lite-ecommerce/
├── backend/                 # Encore.dev microservices
│   ├── analytics/          # Analytics tracking service
│   ├── auth/               # Authentication service
│   ├── category/           # Category management service
│   ├── frontend/           # Static frontend hosting service
│   ├── notification/       # Email notification service
│   ├── order/              # Order management service
│   ├── payment/            # Stripe payment service
│   ├── product/            # Product catalog service
│   └── store/              # Store management service
├── frontend/               # React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
├── DEVELOPMENT.md         # Development documentation
├── ROADMAP.md            # Strategic roadmap
└── README.md             # This file
```

## Technology Stack

### Backend
- **Encore.dev** - Microservices framework
- **TypeScript** - Type-safe backend services
- **PostgreSQL** - Database (managed by Encore)
- **Stripe** - Payment processing
- **Clerk** - Authentication
- **Resend** - Email delivery

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **React Router** - Client-side routing

## Key Metrics & Status

**Current Status:** Early Beta (MVP Complete)

**Production Readiness:** ~40%

See [ROADMAP.md](ROADMAP.md#executive-summary) for detailed analysis.

## Deployment

### Encore Cloud (Recommended)

1. **Login to Encore**
   ```bash
   encore auth login
   ```

2. **Deploy**
   ```bash
   git add -A .
   git commit -m "Deploy to Encore Cloud"
   git push encore
   ```

### Self-Hosting with Docker

See [Encore's self-hosting guide](https://encore.dev/docs/self-host/docker-build) for Docker deployment instructions.

## Roadmap Highlights

### 3 Months: Production Ready
- Testing infrastructure (Vitest, Playwright)
- CI/CD pipeline
- Monitoring & error tracking (Sentry)
- Security hardening (rate limiting, headers)
- Core features (search, customer dashboard, refunds)

### 6 Months: Growth & Scaling
- Discount/coupon system
- Shipping integration (Shippo)
- Tax calculation (TaxJar)
- Advanced analytics
- Product reviews
- Abandoned cart recovery

### 9 Months: Market Leadership
- Mobile app (iOS & Android)
- AI-powered recommendations
- Multi-seller marketplace
- Multi-language support
- Public API & integrations

Full roadmap: [ROADMAP.md](ROADMAP.md)

## Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- TypeScript for all code
- ESLint for linting
- Prettier for formatting (coming soon)
- Write tests for new features
- Update documentation

## Testing

```bash
# Backend tests (coming soon)
cd backend
bun test

# Frontend tests (coming soon)
cd frontend
bun test

# E2E tests (coming soon)
bun test:e2e
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation:** [ROADMAP.md](ROADMAP.md) and [DEVELOPMENT.md](DEVELOPMENT.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/flashfusion-lite-ecommerce/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/flashfusion-lite-ecommerce/discussions)

## Acknowledgments

- [Encore.dev](https://encore.dev/) - Microservices framework
- [Clerk](https://clerk.dev/) - Authentication
- [Stripe](https://stripe.com/) - Payments
- [Vercel](https://vercel.com/) - Inspiration for developer experience
- [Shopify](https://shopify.com/) - E-commerce best practices

## Security

Found a security vulnerability? Please email security@yourdomain.com instead of opening a public issue.

## Changelog

See [ROADMAP.md](ROADMAP.md) for planned changes and features.

---

**Built with ❤️ by the FlashFusion team**

Star this repo if you find it useful!
