# Advancia Pay Ledger - Frontend

Modern fintech dashboard built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## 🎨 Features

- **💼 Dashboard Overview**
  - Animated summary cards (Credits, Debits, Net Balance, Bonus)
  - Click-to-expand balance breakdown modal
  - Real-time transaction updates via Socket.IO
  - Sound and haptic feedback on interactions

- **📊 Components**
  - Summary Cards with animated counters
  - Balance Dropdown with detailed breakdown
  - Transaction List with filters (All, Credits, Debits, Bonus)
  - Bonus & Earnings Card with tooltip
  - Responsive design for mobile and desktop

- **🎭 Animations**
  - Framer Motion for smooth transitions
  - Glow effects on hover
  - Pulsing indicators for new transactions
  - Counter animations for values

## 🚀 Quick Start

```bash

# Install dependencies

npm install

# Start development server

npm run dev
```

Open [[Link](http://localhost:3000](http://localhost:300)0) to view the dashboard.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with fonts
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles + Tailwind
│   ├── components/
│   │   ├── Dashboard.tsx      # Main dashboard component
│   │   ├── SummaryCard.tsx    # Animated summary cards
│   │   ├── BonusCard.tsx      # Bonus earnings card
│   │   ├── BalanceDropdown.tsx # Balance breakdown modal
│   │   └── TransactionList.tsx # Transaction list with filters
│   └── hooks/
│       ├── useBalance.ts      # Balance data + Socket.IO
│       ├── useTransactions.ts # Transaction data + real-time updates
│       └── useSoundFeedback.ts # Sound + haptic feedback
├── public/                    # Static assets
├── tailwind.config.js         # Tailwind configuration
├── next.config.js             # Next.js configuration
└── package.json

```

## 🎨 Design System

### Colors

- **Primary Blue**: #1890ff (buttons, links, accents)
- **Teal**: #13c2c2 (secondary actions, gradients)
- **Green**: Success states, credit transactions
- **Red**: Error states, debit transactions
- **Amber**: Bonus/earnings indicators

### Animations

- `pulse-glow`: Pulsing glow effect for new transactions
- `slide-in`: Smooth slide-in for modals
- `fade-in`: Fade-in for content
- `counter-up`: Animated number counting

## 🔌 API Integration

The dashboard connects to the backend API at `http://localhost:4000`:

### Endpoints Used

- `GET /api/transactions/balance/:userId` - User balance
- `GET /api/transactions/recent/:userId` - Recent transactions

### Socket.IO Events

- `join-room` - Join user-specific room
- `transaction-created` - New transaction notification
- `global-transaction` - Global transaction broadcast

## 🎯 Components

### Dashboard

Main container with summary cards, balance dropdown, and transaction list.

**Props**: None (uses userId from hooks)

### SummaryCard

Displays a metric with an animated counter.

**Props**:

- `title: string` - Card title
- `value: number` - Numeric value to display
- `icon: ReactNode` - Icon component
- `iconBg: string` - Icon background gradient
- `gradient: string` - Card background gradient
- `delay?: number` - Animation delay
- `clickable?: boolean` - Enable click interaction
- `badge?: ReactNode` - Optional badge element

### BonusCard

Shows bonus earnings with tooltip on hover.

**Props**:

- `earnings: number` - Bonus amount
- `percentage: number` - Bonus percentage
- `delay?: number` - Animation delay

### BalanceDropdown

Modal showing balance breakdown (Main, Earnings, Referrals).

**Props**:

- `balance: Balance` - Balance object
- `onClose: () => void` - Close handler

### TransactionList

Displays recent transactions with filter options.

**Props**:

- `transactions: Transaction[]` - Array of transactions
- `loading: boolean` - Loading state

## 🪝 Custom Hooks

### useBalance(userId)

Fetches and manages user balance data with real-time updates.

**Returns**: `{ balance, loading, error }`

### useTransactions(userId)

Fetches and manages transactions with Socket.IO updates.

**Returns**: `{ transactions, loading, error }`

### useSoundFeedback()

Provides sound and haptic feedback functions.

**Returns**: `{ playClick, playSuccess, playError, hapticFeedback }`

## 🎨 Styling

The project uses Tailwind CSS with custom configurations:

```javascript
// Custom colors in tailwind.config.js
colors: {
  primary: { 50-900 shades of blue },
  teal: { 50-900 shades of teal }
}

// Custom animations
animation: {
  'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
  'slide-in': 'slideIn 0.3s ease-out',
  'fade-in': 'fadeIn 0.4s ease-in',
  'counter-up': 'counterUp 1s ease-out'
}
```

## 📱 Responsive Design

- Mobile: Single column layout
- Tablet: 2-column grid
- Desktop: 4-column grid for summary cards

Breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000

# Optional: enable SmartSupp live chat bubble

NEXT_PUBLIC_SMARTSUPP_KEY=your_smartsupp_public_key
```

### Next.js Config

```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  },
};
```

## 🚀 Build & Deploy

### Local Development

```bash

# Install dependencies

npm install

# Start development server (port 3000)

npm run dev

# Start on different port (3001)

npm run dev:3001

# Start with turbo mode

npm run dev:open
```

### Production Build

```bash

# Build for production

npm run build

# Start production server

npm start

# Standalone deployment

npm run start:standalone
```

### Vercel Deployment

#### Environment Variables (Vercel Dashboard)

Set these in your Vercel project settings:

```env

# Production API URL (Render backend)

NEXT_PUBLIC_API_URL=https://advancia-backend.onrender.com

# Optional: SmartSupp live chat

NEXT_PUBLIC_SMARTSUPP_KEY=your_smartsupp_public_key

# Optional: Sentry error tracking

SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### Vercel Configuration (`vercel.json`)

The `vercel.json` file handles API proxying and domain redirects:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  },
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 10 * * *"
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://advancia-backend.onrender.com/api/:path*"
    },
    {
      "source": "/socket.io/:path*",
      "destination": "https://advancia-backend.onrender.com/socket.io/:path*"
    }
  ],
  "redirects": [
    {
      "source": "/www/:path*",
      "destination": "/:path*",
      "permanent": true
    },
    {
      "source": "/www",
      "destination": "/",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

#### Key Vercel Features

- **API Proxying**: `/api/*` routes are proxied to Render backend
- **Socket.IO Support**: WebSocket connections are properly routed
- **CORS Headers**: API routes include necessary CORS headers
- **Domain Redirects**: `www.advanciapayledger.com` redirects to root domain
- **Cron Jobs**: Daily cron job at 10 AM UTC for maintenance tasks

#### Deployment Commands

```bash

# Deploy to Vercel (preview)

npm run deploy:check

# Deploy to production

npm run deploy:vercel
```

### Domain Configuration

#### Custom Domain Setup

1. **Add Domain in Vercel**:
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add `advanciapayledger.com`
   - Add `www.advanciapayledger.com` (redirects to root)

2. **DNS Configuration**:
   - Set CNAME record: `advanciapayledger.com` → `cname.vercel-dns.com`
   - Set CNAME record: `www.advanciapayledger.com` → `cname.vercel-dns.com`

3. **SSL Certificate**:
   - Vercel automatically provisions SSL certificates
   - Takes 24-48 hours for DNS propagation

#### Troubleshooting Domain Issues

- **"Proxy Detected" Error**: Check DNS CNAME records point to `cname.vercel-dns.com`
- **"Invalid Configuration"**: Ensure www subdomain is configured to redirect
- **SSL Issues**: Wait for certificate provisioning (can take up to 24 hours)

### Environment-Specific URLs

| Environment    | Frontend URL                    | Backend URL                             | API URL                                 |
| -------------- | ------------------------------- | --------------------------------------- | --------------------------------------- |
| Local Dev      | `http://localhost:3000`         | `http://localhost:4000`                 | `http://localhost:4000`                 |
| Vercel Preview | `[preview-url].vercel.app`      | `https://advancia-backend.onrender.com` | `https://advancia-backend.onrender.com` |
| Production     | `https://advanciapayledger.com` | `https://advancia-backend.onrender.com` | `https://advancia-backend.onrender.com` |

### Backend CORS Configuration

Ensure your Render backend allows requests from Vercel domains:

```javascript
// backend/src/config/index.ts
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://frontend-kappa-murex-46.vercel.app", // Vercel subdomain
  "https://advanciapayledger.com", // Production domain
  "https://www.advanciapayledger.com", // www redirect
];
```

### Monitoring & Analytics

- **Sentry**: Error tracking configured in `sentry.client.config.js`
- **Vercel Analytics**: Automatic performance monitoring
- **Socket.IO**: Real-time connection monitoring

### Performance Optimization

- **Next.js 14**: App Router with optimized builds
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Vercel edge network caching

## 🎭 Features in Detail

### Animated Counter

Summary cards feature smooth number transitions from 0 to target value.

### Balance Breakdown

Click "Net Balance" card to open detailed breakdown modal showing:

- Main Account balance
- Earnings (bonus)
- Rewards / Adjustments
- Total Available

### Real-time Updates

Socket.IO integration provides instant updates when:

- New transactions are created
- Balance changes
- Global transaction broadcasts

### Sound Feedback

- **Click**: Short beep on interactions
- **Success**: Two-tone chime for successful actions
- **Error**: Low tone for errors
- **Haptic**: Vibration on supported devices

## 🐛 Troubleshooting

### Socket.IO Connection Issues

Check that backend is running on port 4000:

```bash
curl http://localhost:4000/health
```

### Tailwind Classes Not Working

Ensure PostCSS is configured:

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### TypeScript Errors

Run type checking:

```bash
npx tsc --noEmit
```

## 📚 Dependencies

**Core**:

- `next` ^14.2.0
- `react` ^18.3.0
- `typescript` ^5.9.0

**UI**:

- `framer-motion` ^11.0.0
- `lucide-react` ^0.344.0
- `tailwindcss` ^3.4.1

**API**:

- `socket.io-client` ^4.8.1

**Utils**:

- `clsx` ^2.1.0
- `tailwind-merge` ^2.2.0

## 🎯 Next Steps

- [ ] Add user authentication
- [ ] Implement transaction creation form
- [ ] Add date range filters
- [ ] Export transactions to CSV
- [ ] Dark mode support
- [ ] PWA configuration

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.
