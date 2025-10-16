# MargWatch Admin Portal - Modernized

A modern, responsive admin portal for the MargWatch road issue reporting and management system. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS with modern UI components.

## 🚀 Features

### Modern UI Components
- **Radix UI Integration**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Beautiful, customizable icons
- **Class Variance Authority**: Type-safe component variants
- **Tailwind Merge**: Intelligent class merging

### Dashboard
- **Real-time Statistics**: Live data updates with trend indicators
- **Interactive Charts**: Comprehensive analytics with Recharts
- **Quick Actions**: One-click access to common tasks
- **Responsive Design**: Optimized for all screen sizes

### Complaints Management
- **Advanced Filtering**: Multi-criteria search and filtering
- **Status Management**: Visual status updates with color coding
- **Image Gallery**: Integrated image viewing and management
- **Bulk Operations**: Efficient batch processing

### User Management
- **Role-based Access**: Admin, Worker, and User roles
- **Worker Creation**: Streamlined worker onboarding
- **Status Control**: Activate/deactivate user accounts
- **Activity Tracking**: User engagement metrics

### Analytics & Reporting
- **Interactive Charts**: Line, bar, pie, and area charts
- **Time-based Analysis**: Configurable time ranges
- **Performance Metrics**: Worker efficiency tracking
- **Geographic Data**: Heat map visualization

### System Settings
- **Notification Configuration**: Email, SMS, and push notifications
- **Security Settings**: Password policies and session management
- **System Configuration**: Maintenance mode and backup settings
- **Integration Management**: Third-party service configuration

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives

### UI Libraries
- **@radix-ui/react-dialog**: Modal dialogs
- **@radix-ui/react-dropdown-menu**: Dropdown menus
- **@radix-ui/react-select**: Select components
- **@radix-ui/react-tabs**: Tab navigation
- **@radix-ui/react-tooltip**: Tooltips

### Charts & Visualization
- **Recharts**: React charting library
- **Lucide React**: Icon library

### Utilities
- **class-variance-authority**: Component variants
- **clsx**: Conditional className utility
- **tailwind-merge**: Intelligent class merging
- **tailwindcss-animate**: Animation utilities

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── analytics/          # Analytics dashboard
│   ├── complaints/         # Complaints management
│   ├── dashboard/          # Main dashboard
│   ├── login/              # Authentication
│   ├── settings/           # System settings
│   ├── users/              # User management
│   ├── work-orders/        # Work order management
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # Reusable components
│   ├── ui/                 # Base UI components
│   │   ├── button.tsx      # Button component
│   │   ├── card.tsx        # Card component
│   │   ├── dialog.tsx      # Modal dialog
│   │   ├── input.tsx       # Input component
│   │   ├── select.tsx      # Select component
│   │   ├── table.tsx       # Table component
│   │   └── badge.tsx       # Badge component
│   ├── Layout.tsx          # Main layout wrapper
│   ├── LoadingSpinner.tsx  # Loading indicator
│   └── Modal.tsx           # Legacy modal (deprecated)
├── hooks/                  # Custom React hooks
│   └── useAuth.tsx         # Authentication hook
├── lib/                    # Utility libraries
│   ├── api.ts              # API client
│   └── utils.ts            # Utility functions
├── types/                  # TypeScript type definitions
│   └── index.ts            # Shared types
└── utils/                  # Legacy utilities (deprecated)
    ├── auth.ts             # Auth utilities
    └── format.ts           # Format utilities
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#2563eb) - Main brand color
- **Secondary**: Slate (#64748b) - Supporting colors
- **Success**: Green (#22c55e) - Positive actions
- **Warning**: Amber (#f59e0b) - Caution states
- **Danger**: Red (#ef4444) - Destructive actions
- **Muted**: Gray (#94a3b8) - Subtle text and borders

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Sizes**: Responsive scaling with Tailwind utilities

### Spacing
- **Base Unit**: 4px (0.25rem)
- **Scale**: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

### Components
- **Cards**: Elevated containers with subtle shadows
- **Buttons**: Multiple variants (primary, secondary, ghost, outline)
- **Forms**: Consistent input styling with focus states
- **Tables**: Responsive data tables with hover states
- **Modals**: Accessible dialogs with backdrop blur

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 3001

### Installation
```bash
cd MargWatch/apps/admin-portal
npm install
```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## 🔌 API Integration

The admin portal integrates with the MargWatch backend API:

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Role-based access control

### Endpoints
- **Dashboard**: `/api/admin/dashboard`
- **Complaints**: `/api/complaints`
- **Users**: `/api/admin/users`
- **Work Orders**: `/api/work-orders`
- **Analytics**: `/api/admin/analytics`

### Error Handling
- Automatic token expiration handling
- User-friendly error messages
- Retry mechanisms for failed requests

## 📱 Responsive Design

The admin portal is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Collapsible sidebar navigation
- Touch-friendly interface
- Optimized table layouts
- Swipe gestures support

## 🚀 Performance

### Optimization Features
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle analyzer
- **Lazy Loading**: Component-level lazy loading

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔒 Security

### Authentication
- JWT token storage in HTTP-only cookies
- Automatic token refresh
- Secure logout with token invalidation

### Authorization
- Role-based access control (RBAC)
- Route-level protection
- Component-level permissions

### Data Protection
- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure API communication

## 🧪 Testing

### Test Coverage
- Unit tests for utility functions
- Component testing with React Testing Library
- Integration tests for API calls
- E2E tests with Playwright

### Running Tests
```bash
npm test              # Unit tests
npm run test:coverage # Coverage report
npm run test:e2e     # End-to-end tests
```

## 📊 Analytics

### Built-in Analytics
- User engagement tracking
- Performance monitoring
- Error tracking and reporting
- Custom event tracking

### Integration
- Google Analytics 4
- Custom dashboard metrics
- Real-time data visualization

## 🔄 Deployment

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=MargWatch Admin Portal
NEXT_PUBLIC_VERSION=1.0.0
```

### Docker Support
```bash
docker build -t margwatch-admin .
docker run -p 3000:3000 margwatch-admin
```

### Vercel Deployment
```bash
vercel --prod
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ by the MargWatch Team**