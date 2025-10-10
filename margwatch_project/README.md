# MargWatch Project

A comprehensive road issue reporting portal with Express.js backend, ML service, and mobile app.

## Quick Start

```bash
# Install dependencies
npm install

# Start development environment
npm run docker:up
npm run dev:backend

# Access the application
# Backend API: http://localhost:5000
# ML Service: http://localhost:5001
# Database: localhost:5432
# Redis: localhost:6379
```

## Project Structure

```
margwatch_project/
├── backend/          # Express.js API server
├── ml-service/       # Machine Learning service
├── package.json      # Root package configuration
└── docker-compose.yml # Docker services
```

## Development Commands

- `npm run dev` - Start all services
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with sample data

## Environment Setup

1. Copy `env.example` to `.env`
2. Configure your environment variables
3. Run `npm run docker:up` to start services
4. Run `npm run db:push` to setup database

## Team Collaboration

This project is part of the larger MargWatch repository. For team collaboration, see the main repository documentation.
