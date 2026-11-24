# StockFlow – Inventory Management MVP

A beginner-friendly full-stack inventory application built with React + Vite, Express, SQLite, JWT and bcryptjs.

## Requirements
- Node.js LTS (Node 20 or newer recommended)
- npm
- VS Code
- Git (for pushing to GitHub)

## 1. Install dependencies
Open this folder in VS Code, then Terminal → New Terminal:

```bash
npm install
npm run install:all
```

## 2. Configure the backend
Copy `server/.env.example` to `server/.env`.
The default values work for local development. Change `JWT_SECRET` to a long random value before sharing/deploying.

## 3. Run the application
From the root `StockFlow` folder:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/api/health

Keep the terminal running while using the app. Press Ctrl+C to stop both servers.

## 4. First use
1. Open http://localhost:5173
2. Select **Create account**.
3. Enter your name, email, password and organization name.
4. Add products from the Products page.
5. Set your default low-stock threshold in Settings.

Each account is linked to an organization. Product and settings queries are scoped to the logged-in user's organization.

## 5. Build for production
```bash
npm run build
```

The frontend build is created in `client/dist`. The API remains a separate Express service.

## 6. Push to GitHub
Create an empty repository on GitHub (do not add a README or .gitignore there), then run from the project root:

```bash
git init
git add .
git commit -m "Initial StockFlow MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/StockFlow.git
git push -u origin main
```

Replace the URL with your own GitHub repository URL. Never commit `.env`, database files, passwords, or API secrets.

## Notes
- This is an MVP starter, not a production-hardened SaaS service.
- Passwords are hashed with bcryptjs; authentication uses JWT.
- SQLite database is created automatically at `server/data/stockflow.db`.
- SKU must be unique within an organization.
- A product is low stock when quantity is less than or equal to its threshold. If a product threshold is blank, the organization's default is used.
- The PRD does not require stock movement history, payment, integrations, multiple warehouses or staff roles.
