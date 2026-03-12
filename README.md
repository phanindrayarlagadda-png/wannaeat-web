# WannaEat Web

A responsive web application for WannaEat — a food delivery marketplace connecting users with local home chefs.

Converted from the original [WannaEat React Native app](https://github.com/...) to a full web app with responsive UI.

## Tech Stack

| Technology | Purpose |
|---|---|
| **Vite + React 18** | Build tool & framework |
| **TypeScript** | Type safety |
| **Tailwind CSS v3** | Responsive styling |
| **React Router v6** | Client-side routing |
| **Redux Toolkit** | Global state management |
| **Axios** | HTTP client |
| **Formik + Yup** | Forms & validation |
| **Socket.io Client** | Real-time chat |
| **Stripe.js** | Payment processing |
| **Firebase Web SDK** | Analytics & notifications |
| **Lucide React** | Icons |
| **react-hot-toast** | Toast notifications |
| **Day.js** | Date formatting |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/wannaeat-web.git
cd wannaeat-web

# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env

# Start development server
npm run dev
```

App will be available at [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── assets/              # Static images & fonts
├── components/
│   ├── common/          # Button, Input, Modal, Spinner, etc.
│   └── layout/          # Header, BottomNav, Sidebar, AppLayout
├── pages/
│   ├── auth/            # Login, SignUp, OTP, ForgotPassword, ResetPassword
│   ├── home/            # Home, Search
│   ├── chef/            # ChefProfile, PopularChefs, PopularDishes, AvailableToday
│   ├── cart/            # Cart, CartDetails
│   ├── checkout/        # Checkout, OrderSummary, OrderPlaced
│   ├── orders/          # MyOrders, OrderDetails, CancelOrder, RateOrder, ReportIssue
│   ├── account/         # MyAccount, Profile, AddressBook, PaymentMethods, Settings, PremiumMembership
│   ├── chat/            # MyChat, ChatDetails
│   ├── offers/          # Offers
│   ├── wallet/          # Wallet
│   ├── notifications/   # Notifications
│   └── cms/             # Privacy, Terms, CMSPage
├── redux/
│   ├── store.ts
│   └── slices/          # authSlice, cartSlice, notificationSlice
├── router/              # React Router v6 config + ProtectedRoute
├── services/            # API config, Axios instance
├── helper/              # All API endpoint functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript interfaces
```

## Pages

### Authentication
- `/login` — Email/password login + social login buttons
- `/signup` — User registration
- `/otp` — OTP verification (6-digit input)
- `/forgot-password` — Password reset email
- `/reset-password` — New password form

### Main App (Protected)
- `/` — Home feed (banners, popular chefs, dishes, available today)
- `/search` — Debounced search with chef/dish filters
- `/offers` — Promotional offers & coupon codes
- `/wallet` — Wallet balance & transaction history
- `/orders` — Order history (active & past)

### Chef
- `/chefs` — Popular chefs grid
- `/dishes` — Popular dishes
- `/available-today` — Chefs available now
- `/chef/:id` — Chef profile with menu + add to cart

### Cart & Checkout
- `/cart` — Cart with quantity controls & tip selection
- `/cart/details` — Coupon codes & address selection
- `/checkout` — Payment method, address, schedule
- `/checkout/summary` — Order summary before placing
- `/order-placed/:id` — Confirmation & delivery tracking

### Orders
- `/orders/:id` — Order details with status tracker
- `/orders/:id/cancel` — Cancellation form
- `/orders/:id/rate` — Star ratings + review
- `/orders/:id/report` — Report an issue

### Account
- `/account` — Profile overview & menu
- `/account/profile` — Edit profile + photo upload
- `/account/addresses` — Address book (add/delete/default)
- `/account/payment-methods` — Stripe cards management
- `/account/settings` — Notification & app settings
- `/account/premium` — Premium membership plans

### Other
- `/chat` — Conversation list
- `/chat/:id` — Real-time chat (socket.io)
- `/notifications` — Notification center

## Responsive Design

- **Mobile** (<768px): Bottom tab navigation, stacked layouts
- **Tablet** (768px-1024px): Larger cards, horizontal lists
- **Desktop** (>1024px): Sidebar navigation, grid layouts, `max-w-5xl` content width

## Brand Colors

| Color | Hex | Usage |
|---|---|---|
| Primary Pink | `#FD207A` | CTAs, active states, accents |
| Secondary Blue | `#146EB4` | Links, secondary actions |
| Accent Purple | `#8D126E` | Gradients, highlights |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=https://api-stage.wannaeat.com/api/user/
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_FIREBASE_API_KEY=...
VITE_GOOGLE_CLIENT_ID=...
VITE_SOCKET_URL=https://api-stage.wannaeat.com
```
