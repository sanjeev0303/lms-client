# Premium LMS Client

A modern, production-ready Next.js Learning Management System client with optimized performance and clean architecture.

## 🚀 Features

- **Modern Tech Stack**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Authentication**: Clerk integration for secure user management
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI with custom design system
- **Payment Integration**: Razorpay for course purchases
- **Rich Text Editor**: TipTap for course content creation
- **Video Player**: React Player for lecture videos
- **Responsive Design**: Mobile-first responsive UI
- **Dark Mode**: Theme switching support

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (protected)/       # Protected routes
│   └── (root)/            # Public routes
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── course/           # Course-related components
│   ├── global/           # Global components (navbar, etc.)
│   ├── learning/         # Learning interface components
│   ├── payment/          # Payment components
│   └── ui/               # Base UI components (shadcn/ui)
├── hooks/                # Custom React hooks
│   ├── course/           # Course-related hooks
│   ├── lecture/          # Lecture-related hooks
│   ├── payment/          # Payment hooks
│   ├── progress/         # Progress tracking hooks
│   └── user/             # User-related hooks
├── lib/                  # Utility libraries
│   ├── api/              # API layer
│   │   ├── services/     # Service classes for different domains
│   │   └── client.ts     # Unified HTTP client
│   ├── constants/        # Application constants
│   └── utils.ts          # Utility functions
├── providers/            # React context providers
├── types/                # TypeScript type definitions
├── utils/                # Additional utilities
└── validation/           # Form validation schemas
```

## 🏗️ Architecture Decisions

### API Layer
- **Unified HTTP Client**: Centralized error handling, retry logic, and timeout management
- **Service Pattern**: Domain-specific service classes for better organization
- **Type Safety**: Full TypeScript coverage with proper interfaces
- **Environment Agnostic**: Configurable base URLs for different environments

### State Management
- **React Query**: Optimized server state management with smart caching
- **Query Key Factory**: Centralized query key management for cache invalidation
- **Optimistic Updates**: Immediate UI feedback with automatic rollback on errors
- **Background Refetching**: Fresh data without blocking user interactions

### Component Organization
- **Domain-based Grouping**: Components organized by feature/domain
- **Reusable UI Components**: Consistent design system with Radix UI
- **Proper Abstraction**: Separation of concerns between UI and business logic

### Performance Optimizations
- **Bundle Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component with WebP/AVIF support
- **Tree Shaking**: Optimized imports to reduce bundle size
- **Lazy Loading**: Dynamic imports for heavy components

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm/yarn

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Fill in your environment variables:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
   CLERK_SECRET_KEY=your_secret

   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Payment
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
   ```

### Available Scripts

```bash
# Development
bun dev              # Start development server with Turbopack
bun run dev          # Alternative using npm scripts

# Building
bun run build        # Production build
bun run build:production # Full production build with checks
bun run type-check   # TypeScript compilation check
bun run lint         # ESLint check
bun run lint:fix     # Fix ESLint issues

# Analysis
bun run analyze      # Bundle analysis with webpack-bundle-analyzer
bun run clean        # Clean build artifacts
```

### Code Quality

#### TypeScript
- Strict mode enabled
- No implicit any
- Full type coverage for API responses
- Proper interface definitions

#### ESLint Configuration
- Next.js recommended rules
- TypeScript integration
- Import order enforcement
- Custom rules for consistency

#### Naming Conventions
- **Constants**: `UPPER_SNAKE_CASE`
- **Functions/Variables**: `camelCase`
- **Components/Files**: `PascalCase`
- **Interfaces**: `PascalCase` with descriptive names

## 🔧 API Integration

### Service Layer Pattern
Each domain has its own service class:

```typescript
// Example: Course Service
import { courseService } from '@/lib/api/services';

// Get all published courses
const { data: courses } = await courseService.getPublishedCourses();

// Create new course
const newCourse = await courseService.createCourse(courseData, token);
```

### Hook Usage
Domain-specific hooks with optimized caching:

```typescript
// Course hooks
const { data: courses, isLoading } = usePublishedCourses();
const { data: myCourses } = useCreatorCourses();
const createCourseMutation = useCreateCourse();

// User hooks
const { data: currentUser } = useCurrentUser();
const updateProfileMutation = useUpdateProfile();
```

## 🎨 UI/UX

### Design System
- **Color Palette**: Consistent theme with CSS custom properties
- **Typography**: Systematic font scales and weights
- **Spacing**: Standardized spacing units
- **Components**: Reusable, accessible components

### Responsive Design
- Mobile-first approach
- Breakpoint-based responsive design
- Touch-friendly interface elements
- Optimized for all screen sizes

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

## 🚀 Production Deployment

### Build Optimization
- Automatic code splitting
- Image optimization with multiple formats
- Compression enabled
- Bundle size analysis

### Performance Features
- Static site generation where possible
- Incremental static regeneration
- Optimized fonts loading
- Efficient caching strategies

### Security
- Security headers configured
- XSS protection
- CSRF protection
- Content Security Policy

## 📊 Bundle Analysis

Run bundle analysis to monitor build size:

```bash
bun run analyze
```

This will:
1. Build the production bundle
2. Open webpack-bundle-analyzer
3. Show detailed breakdown of bundle contents
4. Identify optimization opportunities

## 🔄 Migration Notes

### From Old Architecture
- ✅ Consolidated duplicate API clients
- ✅ Standardized naming conventions
- ✅ Improved error handling
- ✅ Enhanced TypeScript coverage
- ✅ Optimized bundle size
- ✅ Better caching strategies

### Breaking Changes
- API imports now use centralized services
- Hook imports consolidated to `@/hooks`
- Environment variables standardized
- Some legacy components require updates

## 🤝 Contributing

1. Follow the established naming conventions
2. Write TypeScript-first code
3. Use the service layer for API calls
4. Implement proper error handling
5. Add loading and error states
6. Write meaningful commit messages

## 📝 License

This project is proprietary. See license file for details.
