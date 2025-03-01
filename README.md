# Free Planning Poker

A modern Planning Poker application built with Angular, Firebase Real-time Database, and Three.js for 3D components.

## Features

- Create or join Planning Poker sessions with real-time collaboration
- Standard Planning Poker decks (Fibonacci, Modified Fibonacci, T-Shirt sizes, Powers of 2)
- Create custom decks with your own values
- 3D card visualization with Three.js
- Real-time updates of voting status
- Reveal cards and view voting results
- Mobile-friendly responsive design

## Technology Stack

- **Angular** (latest version) for the frontend
- **Firebase Real-time Database** for real-time data synchronization
- **Three.js** for 3D card visualization
- **SCSS** for styling

## Setup and Configuration

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Angular CLI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/free-planning-poker.git
   cd free-planning-poker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable the Real-time Database
   - Set up authentication if you want to add user login
   - Get your Firebase configuration from Project Settings
   - Update the environment files (`src/environments/environment.ts` and `src/environments/environment.prod.ts`) with your Firebase configuration

   ```typescript
   export const environment = {
     production: false, // or true for production
     firebase: {
       apiKey: 'YOUR_API_KEY',
       authDomain: 'YOUR_AUTH_DOMAIN',
       databaseURL: 'YOUR_DATABASE_URL',
       projectId: 'YOUR_PROJECT_ID',
       storageBucket: 'YOUR_STORAGE_BUCKET',
       messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
       appId: 'YOUR_APP_ID'
     }
   };
   ```

### Running the Application

Run the development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser.

### Building for Production

Build the project for production:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

- **components/** - Angular components
  - **home/** - Home page with session creation/joining
  - **session/** - Planning Poker session page
  - **card/** - Card component for displaying Planning Poker cards
  - **deck-selection/** - Component for selecting and creating decks
  - **three-component/** - Three.js 3D card visualization
- **models/** - TypeScript interfaces and models
- **services/** - Angular services
  - **firebase.service.ts** - Service for Firebase Real-time Database operations
  - **session.service.ts** - Service for managing Planning Poker sessions
  - **three.service.ts** - Service for Three.js 3D rendering
- **environments/** - Environment configuration files

## Three.js Integration

The application includes a Three.js integration for 3D card visualization. The main components for this are:

- **ThreeService** (`src/app/services/three.service.ts`) - A service that handles the 3D rendering
- **ThreeComponentComponent** (`src/app/components/three-component/three-component.component.ts`) - A component that displays the 3D card

The 3D card can be toggled on and off during a Planning Poker session, and it demonstrates how Three.js can be integrated into an Angular application.

## Extending the Application

Here are some ideas for extending the application:

- Add authentication for user accounts
- Add more deck types or customization options
- Implement a story/ticket management system
- Add a chat feature for discussion during voting
- Create more advanced 3D visualizations
- Add analytics for voting patterns

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Angular](https://angular.io/)
- [Firebase](https://firebase.google.com/)
- [Three.js](https://threejs.org/)
