# connectChat

A minimal React + Vite chat application template with fast HMR, ESLint, and a simple development workflow.

## Features

- React with Vite for fast development and builds
- Hot Module Replacement (HMR)
- ESLint configuration (extendable for TypeScript)
- Minimal, opinionated project structure suitable for chat UI development

## Prerequisites

- Node.js (>= 16)
- npm or yarn

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/AbdulGhaffarcs/connectChat.git
   cd connectChat
   ```
2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

## Development

Start the dev server with HMR:
```bash
npm run dev
# or
yarn dev
```
Open http://localhost:5173 (or the port printed in your terminal).

## Build

Build a production bundle:
```bash
npm run build
# or
yarn build
```
Preview the production build locally:
```bash
npm run preview
# or
yarn preview
```

## Linting

This template includes ESLint rules. For production apps we recommend using TypeScript with type-aware linting.

To run lint:
```bash
npm run lint
# or
yarn lint
```

## Project Structure (example)

- src/ — application source code
  - main.jsx — app entry
  - App.jsx — root component
  - components/ — reusable components
  - styles/ — CSS
- public/ — static assets
- index.html — Vite HTML entry

## Adding the React Compiler

The React Compiler is not enabled by default due to performance impact. To add it, see: https://react.dev/learn/react-compiler/installation

## Contributing

Contributions are welcome. Open an issue or submit a pull request and describe the changes.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
