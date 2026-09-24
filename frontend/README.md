# Frontend

The frontend is a Vite React application. It requests the latest fixture data from the local API, derives coverage rows from expected and observed pipelines, and presents a sortable, pageable table.

## Run

From the repository root, install all workspace dependencies once:

```sh
npm install
```

Start the backend in one terminal:

```sh
npm run dev:backend
```

Then start the frontend in a second terminal:

```sh
npm run dev:frontend
```

Open `http://localhost:5173`. Vite proxies `/api` calls to the backend at port `3001`.

## Production build

Build the frontend from the repository root:

```sh
npm run build
```