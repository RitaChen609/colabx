# Backend

The backend is an Express application that queries the same MarkLogic REST
endpoint and XQuery module used by `marklogic-perfRunStatus`. Credentials stay
on the server; the browser only calls the local API.

## Run

From the repository root, install all workspace dependencies once:

```sh
npm install
```

Create `backend/config/marklogic.local.json` from
[config/marklogic.example.json](config/marklogic.example.json), enter the password,
then start the API:

```sh
npm run dev:backend
```

The local config is gitignored. Environment variables (`MARKLOGIC_URL`,
`MARKLOGIC_USERNAME`, `MARKLOGIC_PASSWORD`, and `MARKLOGIC_DATABASE`) override
its values when set.

The API listens at `http://localhost:3001`. Its single endpoint is:

```text
GET /api/pipeline-status
```

For each category, data center, architecture, and version, `GET /api/pipeline-status`
invokes `/ext/find-perf-category-run-info.xqy` through MarkLogic's `/v1/invoke`
endpoint using HTTP Digest authentication. The cell matrix and expected features
are in [data/category-config.json](data/category-config.json), aligned with the
desktop app's `category-config.jsonc`.