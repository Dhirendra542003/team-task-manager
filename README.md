# TeamFlow - Project Management Application

A modern, production-ready project management application built with React and Vite.

## Features

- 🎯 **Dashboard** - Overview of tasks, projects, and team performance
- 📊 **Projects** - Create and manage multiple projects with team members
- ✅ **Tasks** - Kanban board and list views for task management
- 👥 **Team Management** - Admin panel for team oversight
- 🤖 **AI Insights** - Get intelligent recommendations (requires API key)
- 🎨 **Modern UI** - Beautiful, responsive design with smooth animations

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **CSS-in-JS** - Inline styles for component encapsulation

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Demo Accounts

- **Admin**: alice@team.com / admin123
- **Member**: bob@team.com / member123

## Project Structure

```
teamflow/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── data/            # Mock data and constants
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── styles/          # Global styles
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
└── index.html           # HTML template
```

## Configuration

### AI Features (Optional)

To enable AI insights, you'll need to configure the Anthropic API:

1. Get an API key from [Anthropic](https://www.anthropic.com/)
2. Create a `.env` file:

```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

3. Update the API calls in the code to use the environment variable

## Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

## Deployment

The application can be deployed to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions
- **AWS S3**: Upload the `dist` folder

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
