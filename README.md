# DogTrainerApp 

A comprehensive, gamified React Native application for dog training, activity tracking, and community engagement. Built with Expo and Supabase.

## Overview

DogTrainerApp is designed to help dog owners structure their training, track daily activities, and stay motivated through gamification. Users can follow structured lesson plans, track walks with GPS, earn achievements, and compete on leaderboards. The app features robust offline support, ensuring walk data is never lost even without an internet connection.

## Key Features

- ** Structured Training**: Progressive lesson plans (Beginner, Intermediate, Advanced) with unlockable tiers.
- ** Smart Walk Tracking**: GPS-enabled walk tracking with live mapping, distance calculation, and event logging (pee, poop, water breaks).
- ** Gamification**: 
    - **Leaderboards**: Compete globally or with friends based on walks, distance, and training streaks.
    - **Achievements**: Unlock badges for milestones like "Early Bird" walks or "Marathoner" distances.
- ** AI-Powered**: Integrated AI assistant for personalized training advice and smart greetings.
- ** Offline-First Architecture**: Walks are saved locally and synced automatically when connection is restored.
- ** Localization**: Full support for English and Hungarian (Magyar) languages.

## Tech Stack

### Frontend
- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 52)
- **Language**: TypeScript
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Navigation**: Expo Router (File-based routing)
- **Maps**: react-native-maps (Google Maps on Android, Apple Maps on iOS)

### Backend & Services
- **BaaS**: [Supabase](https://supabase.com/)
    - Authentication
    - PostgreSQL Database
    - Storage (Photos)
    - Edge Functions (AI Chat)
- **AI**: Google Generative AI (Gemini)
- **Monitoring**: Sentry Integration

### Testing
- **Unit/Integration**: Jest & React Native Testing Library

## Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn
- Expo Go app on your physical device OR Android Studio/Xcode for emulators.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/dog-trainer-app.git
   cd dog-trainer-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```

4. **Start the project**
   ```bash
   npx expo start
   ```

## Project Structure

```
├── app/                  # Application screens & navigation (Expo Router)
├── components/           # Reusable UI components
├── lib/                  # Core services & utilities
│   ├── supabase.ts       # Database client
│   ├── syncService.ts    # Offline sync logic
│   ├── logger.ts         # Professional logging utility
│   └── ...
├── assets/               # Images and fonts
├── locales/              # i18n translation files
└── __tests__/            # Jest test specifications
```

## Testing

Run the test suite to verify core functionality:

```bash
npm test
```
