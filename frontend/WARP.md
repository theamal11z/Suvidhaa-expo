# WARP.md - Suvidhaa Frontend

## Project Overview

**Suvidhaa** - "Your Bridge to Transparent Governance" is a React Native mobile app built with Expo that empowers citizens to understand, act on, and track government policies and governance. The app bridges the gap between complex government documentation and citizen engagement through AI-powered simplification and structured interaction channels.

### Core Features
- **Understand**: AI-powered policy document simplification (Samjhaau)
- **Act**: Citizen engagement through questions, suggestions, and grievances (Sawaal & Sujaav)
- **Track**: Personal watchlist for following policy updates and government responses

## Technology Stack

- **Framework**: React Native 0.79.5 with Expo SDK 54
- **Navigation**: Expo Router with file-based routing
- **UI Components**: React Native Paper, React Native Elements
- **State Management**: React Navigation, Async Storage
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI Integration**: NVIDIA API for LLM capabilities
- **File Upload**: Cloudinary for document/media management
- **Language**: TypeScript with strict mode enabled

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher (or yarn 1.22.x as specified in package.json)
- **Expo CLI**: Latest version (`npm install -g @expo/cli`)
- **Git**: For version control
- **Mobile Development Environment**: 
  - For iOS: Xcode (macOS only)
  - For Android: Android Studio
  - Or use Expo Go app for quick testing

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to frontend directory
cd /home/theamal/rex/projects/Suvidhaa-expo/frontend

# Install dependencies
npm install
# or
yarn install
```

### 2. Environment Configuration

The project uses environment variables for configuration. Key variables in `.env`:

```env
# Expo Configuration
EXPO_TUNNEL_SUBDOMAIN=suvidhaa-ui
EXPO_USE_FAST_RESOLVER="1"
METRO_CACHE_ROOT=/app/frontend/.metro-cache

# Supabase Configuration (Public - Safe for client)
EXPO_PUBLIC_SUPABASE_URL=https://avxkqwfnnuzpgwmkynzf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dc2hnehcz

# Server-only secrets (Never expose in client bundles)
NVIDIA_API_KEY=<nvidia_api_key>
NVIDIA_MODEL=meta/llama-4-scout-17b-16e-instruct
CLOUDINARY_API_KEY=<cloudinary_key>
CLOUDINARY_API_SECRET=<cloudinary_secret>
```

**Important**: Server-only secrets are used in Supabase Edge Functions, not in the client app.

## Development Scripts

### Primary Commands

```bash
# Start development server
npm start
# or
expo start

# Platform-specific starts
npm run android    # Start for Android
npm run ios        # Start for iOS  
npm run web        # Start for web

# Linting
npm run lint       # Run ESLint
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm start
   ```

2. **Choose Platform**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator  
   - Press `w` for web browser
   - Scan QR code with Expo Go app

3. **Hot Reloading**
   - Changes are automatically reflected
   - Press `r` to reload manually
   - Press `m` to toggle menu

## Project Structure

```
frontend/
├── app/                      # Main application screens (Expo Router)
│   ├── (tabs)/              # Tab-based navigation screens
│   │   ├── _layout.tsx      # Tab layout configuration
│   │   ├── index.tsx        # Home tab
│   │   ├── policies.tsx     # Policies tab
│   │   ├── profile.tsx      # Profile tab
│   │   ├── watchlist.tsx    # Watchlist tab
│   │   └── notifications.tsx # Notifications tab
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx           # Entry point
│   ├── login.tsx           # Authentication
│   ├── signup.tsx          # User registration
│   ├── onboarding.tsx      # First-time user flow
│   ├── understand.tsx      # Document analysis screen
│   ├── ask-ai.tsx          # AI interaction screen
│   ├── ask-suggest.tsx     # Suggestions screen
│   ├── track-progress.tsx  # Progress tracking
│   ├── quick-action.tsx    # Quick actions
│   ├── file-complaint.tsx  # Grievance filing
│   └── policy/            # Dynamic policy routes
│       └── [id].tsx       # Policy detail screen
├── lib/                    # Utility libraries and services
│   ├── supabase.ts        # Supabase client configuration
│   ├── ai.ts              # AI/LLM integration
│   ├── cloudinary.ts      # File upload service
│   ├── config.ts          # App configuration
│   ├── db.ts              # Database utilities
│   ├── policies.ts        # Policy management
│   ├── notifications.ts   # Notification handling
│   ├── qa.ts              # Q&A functionality
│   ├── quickActions.ts    # Quick action utilities
│   ├── tickets.ts         # Complaint/ticket system
│   └── watchlist.ts       # Watchlist management
├── assets/                # Static assets (images, fonts)
├── supabase/              # Supabase Edge Functions
│   └── functions/
├── scripts/               # Build and deployment scripts
├── .expo/                 # Expo configuration cache
├── node_modules/          # Dependencies
├── app.json              # Expo app configuration
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── metro.config.js       # Metro bundler configuration
├── eslint.config.js      # ESLint configuration
├── .env                  # Environment variables
└── README.md            # Basic project documentation
```

## Key Configuration Files

### app.json - Expo Configuration
- App metadata (name, version, icon)
- Platform-specific settings (iOS, Android, Web)
- Splash screen configuration
- New Architecture enabled
- Typed routes experimental feature

### tsconfig.json - TypeScript Setup
- Extends Expo's base TypeScript configuration
- Strict mode enabled
- Path aliases configured (`@/*` maps to `./`)

### metro.config.js - Metro Bundler
- Custom cache configuration for stability
- Optimized for shared cache across platforms
- Worker limit set to 2 for resource management

## Development Guidelines

### File-Based Routing (Expo Router)
- Routes are automatically generated from files in `app/` directory
- Use `(tabs)` for tab-based navigation
- Dynamic routes with `[id].tsx` pattern
- Layouts with `_layout.tsx` files

### State Management
- Local state with React hooks
- Persistent storage with AsyncStorage
- Navigation state managed by React Navigation

### API Integration
- Supabase for backend services
- NVIDIA API for AI capabilities
- Cloudinary for media management
- All external calls handled through `lib/` services

### Code Style
- TypeScript with strict mode
- ESLint for code quality
- Consistent component structure
- Proper error handling

## Common Development Tasks

### Adding New Screens
1. Create new file in `app/` directory
2. Export React component as default
3. Use TypeScript for type safety
4. Follow existing navigation patterns

### Database Operations
```typescript path=null start=null
import { supabase } from '@/lib/supabase';

// Example query
const { data, error } = await supabase
  .from('policies')
  .select('*')
  .eq('status', 'active');
```

### AI Integration
```typescript path=null start=null
import { askAI } from '@/lib/ai';

// Simplify policy document
const response = await askAI({
  type: 'simplify',
  content: documentText
});
```

### File Upload
```typescript path=null start=null
import { uploadToCloudinary } from '@/lib/cloudinary';

// Upload document
const result = await uploadToCloudinary(fileUri);
```

## Build and Deployment

### Supabase Edge Functions

The app uses Supabase Edge Functions for AI processing and file uploads.

**Initial Setup (already completed):**
```bash
# Install Supabase CLI
npm install supabase --save-dev

# Initialize and link to project
npx supabase init
npx supabase login
npx supabase link --project-ref avxkqwfnnuzpgwmkynzf

# Deploy functions
npm run supabase:deploy:ai
npm run supabase:deploy:cloudinary

# Set environment secrets
npx supabase secrets set NVIDIA_API_KEY=<your-key>
npx supabase secrets set NVIDIA_MODEL=meta/llama-4-scout-17b-16e-instruct
npx supabase secrets set CLOUDINARY_API_KEY=<your-key>
npx supabase secrets set CLOUDINARY_API_SECRET=<your-secret>
npx supabase secrets set CLOUDINARY_CLOUD_NAME=<your-cloud-name>

# Push database schema
npm run supabase:push
```

**Future Updates:**
```bash
# Deploy all functions
npm run supabase:deploy

# Deploy specific function
npm run supabase:deploy:ai
npm run supabase:deploy:cloudinary

# Update database schema
npm run supabase:push
```

### Development Builds
```bash
# Build for development
expo build:android --type apk
expo build:ios --type archive
```

### Production Builds
- Configure app signing
- Set production environment variables
- Use EAS Build for optimized builds

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform android
eas build --platform ios
```

## Troubleshooting

### Common Issues

**Metro Cache Issues**
```bash
# Clear Metro cache
npx expo start --clear
```

**Node Modules Issues**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Environment Variables Not Loading**
- Ensure `.env` file is in project root
- Restart development server after changes
- Use `EXPO_PUBLIC_` prefix for client-side variables

**Supabase Connection Issues**
- Verify URL and anon key in environment variables
- Check network connectivity
- Ensure Supabase project is active

**Build Failures**
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies are installed
- Clear Expo cache: `expo r -c`

**AI Assistant Not Working**
- Ensure edge functions are deployed: `npm run supabase:deploy:ai`
- Check if secrets are set: `npx supabase secrets list`
- Verify database schema is up to date: `npm run supabase:push`
- Check console for specific error messages

### Performance Optimization
- Use `metro.config.js` cache settings
- Limit Metro workers based on system resources
- Optimize image assets
- Use lazy loading for heavy components

### Debugging
- Use React Developer Tools
- Expo Developer Tools in browser
- Console logging with `console.log()`
- Network inspection in browser developer tools

## Git Workflow

Current status shows active development with modified files:
- Multiple app screens updated
- Environment configuration modified  
- New library utilities added
- Package dependencies updated

Recommended workflow:
1. Create feature branches for new development
2. Commit frequently with descriptive messages
3. Test thoroughly before merging
4. Keep environment variables secure

---

## Quick Reference

**Start Development**: `npm start`
**Clear Cache**: `expo start --clear`  
**Build Android**: `eas build --platform android`
**Lint Code**: `npm run lint`
**TypeScript Check**: `npx tsc --noEmit`

**Key Directories**: 
- `app/` - Screen components
- `lib/` - Utility services  
- `assets/` - Static files
- `supabase/` - Backend functions

This documentation provides a comprehensive guide for understanding and working with the Suvidhaa frontend codebase. The project represents a sophisticated citizen engagement platform with modern React Native architecture and robust backend integration.