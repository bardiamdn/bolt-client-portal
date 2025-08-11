# Frakt Client Portal

A modern, full-featured client portal built with React, TypeScript, and Supabase. This application provides project management capabilities with real-time collaboration, task tracking, file sharing, messaging, and integrated billing with Stripe payments.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure email/password authentication with Supabase Auth
- **Project Management** - Multi-project dashboard with progress tracking
- **Task Management** - Create, assign, and track tasks with priorities and due dates
- **Real-time Messaging** - Project-based chat with live updates
- **File Management** - Upload files and share links with team members
- **Invoice Management** - View, download, and pay invoices through Stripe

### Technical Features
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates** - Live messaging and data synchronization
- **Secure Payments** - Stripe integration for subscriptions and one-time payments
- **Role-based Access** - Project-level permissions and security
- **Type Safety** - Full TypeScript implementation with generated database types

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Full type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing and navigation
- **Lucide React** - Beautiful, customizable icons

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Row Level Security (RLS)** - Database-level security policies
- **Real-time Subscriptions** - Live data updates via WebSockets
- **Edge Functions** - Serverless functions for Stripe integration

### Payments & Billing
- **Stripe** - Payment processing for subscriptions and invoices
- **Webhook Handling** - Automated payment status updates
- **Invoice Generation** - PDF-ready invoice downloads

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Supabase Account** - For database and authentication
- **Stripe Account** - For payment processing (optional for development)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd frakt-client-portal
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
The project includes pre-configured database migrations. Connect to Supabase and the schema will be automatically applied.

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 🗄 Database Schema

### Core Tables

#### `profiles`
User profile information linked to Supabase Auth users.
- `id` (uuid) - Primary key, references auth.users
- `full_name` (text) - User's display name
- `email` (text) - User's email address
- `created_at`, `updated_at` (timestamptz) - Audit timestamps

#### `companies`
Organizations that own projects.
- `id` (uuid) - Primary key
- `name` (text) - Company name
- `created_at`, `updated_at` (timestamptz) - Audit timestamps

#### `projects`
Main project entities with progress tracking.
- `id` (uuid) - Primary key
- `name` (text) - Project identifier
- `title` (text) - Display title
- `description` (text) - Project description
- `company_id` (uuid) - Foreign key to companies
- `progress` (integer) - Completion percentage (0-100)
- `icon`, `icon_bg` (text) - Visual customization

#### `project_members`
Many-to-many relationship between users and projects.
- `project_id`, `user_id` (uuid) - Composite foreign keys
- `role` (text) - 'owner', 'admin', or 'member'

#### `tasks`
Project tasks with assignment and tracking.
- `project_id` (uuid) - Foreign key to projects
- `title`, `description` (text) - Task details
- `type` (text) - 'invoice', 'form', 'review', 'other'
- `status` (text) - 'pending', 'in_progress', 'completed', 'overdue'
- `priority` (text) - 'low', 'medium', 'high'
- `due_date` (date) - Task deadline
- `assigned_to`, `created_by` (uuid) - User references

#### `messages`
Real-time project messaging.
- `project_id` (uuid) - Foreign key to projects
- `sender_id` (uuid) - Foreign key to profiles
- `content` (text) - Message content

#### `files`
File and link sharing within projects.
- `project_id` (uuid) - Foreign key to projects
- `name` (text) - File or link name
- `type` (text) - 'file' or 'link'
- `url` (text) - File data URL or external link
- `size`, `mime_type` (text) - File metadata

#### `invoices`
Project billing and invoice management.
- `project_id` (uuid) - Foreign key to projects
- `number` (text) - Unique invoice identifier
- `amount` (numeric) - Invoice total
- `status` (text) - 'pending', 'paid', 'overdue', 'cancelled'
- `issue_date`, `due_date` (date) - Invoice timeline

### Stripe Integration Tables

#### `stripe_customers`
Maps Supabase users to Stripe customers.
- `user_id` (uuid) - Foreign key to profiles
- `customer_id` (text) - Stripe customer ID

#### `stripe_subscriptions`
Tracks subscription status and billing cycles.
- `customer_id` (text) - Stripe customer reference
- `subscription_id` (text) - Stripe subscription ID
- `status` (enum) - Subscription status
- `current_period_start/end` (bigint) - Billing period

#### `stripe_orders`
Records one-time payments and purchases.
- `checkout_session_id` (text) - Stripe session reference
- `amount_total` (bigint) - Payment amount in cents
- `payment_status` (text) - Payment completion status

## 🔐 Security

### Row Level Security (RLS)
All tables implement comprehensive RLS policies:

- **User Isolation** - Users can only access their own data
- **Project-based Access** - Data access restricted to project members
- **Role-based Permissions** - Different access levels for owners, admins, and members
- **Secure by Default** - All tables require explicit permission grants

### Authentication
- **Supabase Auth** - Industry-standard authentication with JWT tokens
- **Email/Password** - Simple, secure login flow
- **Session Management** - Automatic token refresh and logout handling

## 💳 Stripe Integration

### Payment Flows
1. **Subscription Payments** - Recurring billing for premium features
2. **Invoice Payments** - One-time payments for project invoices
3. **Webhook Processing** - Automatic status updates from Stripe

### Edge Functions
- **`stripe-checkout`** - Creates Stripe checkout sessions
- **`stripe-webhook`** - Processes payment webhooks and updates database

### Configuration
Payment products are configured in `src/stripe-config.ts`:
```typescript
export const products: Product[] = [
  {
    id: 'prod_example',
    priceId: 'price_example',
    name: 'Premium Plan',
    description: 'Advanced project management features',
    mode: 'subscription'
  }
];
```

## 🏗 Architecture

### Component Structure
```
src/
├── components/           # React components
│   ├── Dashboard.tsx     # Main application layout
│   ├── Sidebar.tsx       # Navigation and project selection
│   ├── *Tab.tsx         # Tab content components
│   └── *Modal.tsx       # Modal dialogs
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication state
│   ├── useProjects.ts   # Project data management
│   ├── useTasks.ts      # Task CRUD operations
│   ├── useMessages.ts   # Real-time messaging
│   ├── useFiles.ts      # File upload and sharing
│   ├── useInvoices.ts   # Billing and invoice data
│   └── useStripe.ts     # Payment processing
├── lib/                 # Utility libraries
│   └── supabase.ts      # Database client configuration
└── stripe-config.ts     # Payment product definitions
```

### Data Flow
1. **Authentication** - Supabase Auth manages user sessions
2. **Data Fetching** - Custom hooks fetch data with RLS enforcement
3. **Real-time Updates** - Supabase subscriptions for live messaging
4. **State Management** - React hooks for local component state
5. **API Integration** - Edge functions for external service communication

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Organization
- **Modular Architecture** - Each component focuses on a single responsibility
- **Custom Hooks** - Reusable data fetching and state management
- **Type Safety** - Comprehensive TypeScript coverage
- **Consistent Styling** - Tailwind CSS with design system principles

### Development Workflow
1. **Local Development** - Hot reload with Vite
2. **Database Changes** - Create new migration files in `supabase/migrations/`
3. **Component Development** - Build reusable, typed components
4. **Testing** - Manual testing with real Supabase data

## 🚀 Deployment

### Netlify Deployment
The application is configured for Netlify deployment:
```bash
npm run build    # Builds to dist/ directory
```

### Environment Variables
Set these in your deployment environment:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Supabase Configuration
1. **Database Setup** - Apply migrations from `supabase/migrations/`
2. **Edge Functions** - Deploy functions for Stripe integration
3. **Environment Variables** - Configure Stripe keys in Supabase dashboard

## 📱 Usage

### Getting Started
1. **Sign Up** - Create an account with email and password
2. **Project Access** - Join projects through team invitations
3. **Dashboard Navigation** - Use sidebar to switch between projects
4. **Tab Navigation** - Access different features via top tabs

### Key Features
- **Overview Tab** - Project summary with outstanding items and quick stats
- **Tasks Tab** - Full task management with creation, editing, and status updates
- **Messages Tab** - Real-time project communication
- **Billing Tab** - Invoice viewing, downloading, and payment processing

### User Roles
- **Owner** - Full project control and member management
- **Admin** - Project management without ownership transfer
- **Member** - Task participation and communication access

## 🔍 Troubleshooting

### Common Issues

#### Authentication Problems
- Verify Supabase URL and keys in `.env`
- Check Supabase Auth settings (email confirmation disabled)
- Ensure RLS policies allow user access

#### Payment Issues
- Confirm Stripe keys are configured in Supabase
- Verify webhook endpoints are properly set up
- Check Stripe dashboard for payment status

#### Real-time Features Not Working
- Ensure Supabase real-time is enabled
- Check browser console for WebSocket connection errors
- Verify RLS policies allow subscription access

### Development Tips
- Use browser dev tools to inspect network requests
- Check Supabase logs for database errors
- Monitor Stripe dashboard for payment processing
- Use React DevTools for component state debugging

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or support, please contact the development team.

---

Built with ❤️ using React, TypeScript, Supabase, and Stripe.