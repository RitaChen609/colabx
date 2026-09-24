# Backend

The backend is an Express application that exposes static mock pipeline data.

## Run

From the repository root, install all workspace dependencies once:

```sh
npm install
```

Start the API:

```sh
npm run dev:backend
```

The API listens at `http://localhost:3001`. Its single endpoint is:

```text
GET /api/pipeline-status
```

Update [data/pipeline-status.json](data/pipeline-status.json) to change the mocked response. The server reads that file for every request, so no restart is required after fixture changes.