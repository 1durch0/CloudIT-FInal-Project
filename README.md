# Full Stack Cloud IT — Image Gallery

A full-stack image gallery built as microservices, hosted on Azure. React + Vite
frontend, two Node/Express backends (`auth-service`, `gallery-service`), MongoDB
Atlas, Azure Blob Storage, an Azure Function (`stats`), all containerized and
deployed to Azure Container Apps.

## Architecture

```
[Browser]
   │
   ▼
[frontend (React + nginx)]  ← public: https://frontend.mangosky-c9c689c6.francecentral.azurecontainerapps.io
   │  /api/*  proxied via nginx (same-origin, security headers + CSP)
   ├──▶ [auth-service]      ← internal-only (http://...internal...)
   ├──▶ [gallery-service]   ← internal-only (http://...internal...)
   └──▶ [stats Function]    ← Azure Functions (serverless)
                       │
                       ├── [MongoDB Atlas]          (images + users metadata)
                       └── [Azure Blob Storage]     (image files)
```

- Frontend and backends run as **Azure Container Apps** in `fullstack-cloudit-rg`.
- Backend Container Apps use **internal ingress** only; the public frontend
  proxies to them via nginx with `proxy_set_header Host <internal-fqdn>`.
- Secrets are stored in **Azure Key Vault** and referenced from the Container
  Apps via a user-assigned managed identity (no secrets in images, repos, or env).
- **Kubernetes**: `k8s/` contains Deployment/Service manifests for the same app
  (previously deployed on AKS; useful for local minikube).

## Run locally (docker-compose)

```bash
docker-compose up --build
```

- Frontend: http://localhost:8080
- auth-service: http://localhost:3000
- gallery-service: http://localhost:3001

Each backend reads `MONGO_URI` / `AZURE_STORAGE_CONNECTION_STRING` from its
local `.env` file (gitignored, never committed). See `backend/*/.env.example`
for the required variables.

## Secrets & Rotation

All runtime secrets live in **Azure Key Vault** (`fullstack-cloudit-kv`,
RBAC-enabled). The Container Apps reference them with a user-assigned managed
identity (`ca-secrets-id`, role `Key Vault Secrets User`):

- `mongo-uri` — MongoDB Atlas connection string
- `storage-conn` — Azure Storage connection string

> **Important:** Container Apps resolve Key Vault references when a **revision
> is created**, not on restart. After changing a secret in Key Vault you must
> roll a new revision — a plain restart keeps the old cached value:
>
> ```bash
> az containerapp update -g fullstack-cloudit-rg -n <service> --revision-suffix rot
> ```

### Rotating the storage account key

Rotating the Azure Storage key affects **three** consumers. Do all of them, in order:

1. Renew the key:
   ```bash
   az storage account keys renew -g fullstack-cloudit-rg -n fullstackcloudit --key primary
   KEY=$(az storage account keys list -g fullstack-cloudit-rg -n fullstackcloudit --query "[?keyName=='key1'].value" -o tsv)
   CS="DefaultEndpointsProtocol=https;AccountName=fullstackcloudit;AccountKey=$KEY;EndpointSuffix=core.windows.net"
   ```
2. Update the Key Vault secret and roll a new gallery revision:
   ```bash
   az keyvault secret set --vault-name fullstack-cloudit-kv --name storage-conn --value "$CS"
   az containerapp update -g fullstack-cloudit-rg -n gallery-service --revision-suffix rot
   ```
3. **Do not forget the Function App.** `AzureWebJobsStorage` and
   `WEBSITE_CONTENTAZUREFILECONNECTIONSTRING` in the `stats` function's app
   settings also point at the same storage account. With the old key the
   function host **cannot restart** after any config change and stops serving
   (`Function host is not running`):
   ```bash
   az functionapp config appsettings set -g fullstack-cloudit-rg -n fullstack-cloudit-stats \
     --settings "AzureWebJobsStorage=$CS" "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING=$CS"
   ```
4. Update the local `.env`: `backend/gallery-service/.env`
   (`AZURE_STORAGE_CONNECTION_STRING`). The K8s `app-secret` is recreated from
   the same `.env` on deploy.

### Rotating the MongoDB Atlas password

1. In the Atlas portal (Security → Database Access) change the password of the
   `jurekmongodb_db_user`.
2. Update the `MONGO_URI` password locally: `backend/auth-service/.env`,
   `backend/gallery-service/.env`, and `functions/local.settings.json`.
3. Update Key Vault and roll new revisions:
   ```bash
   az keyvault secret set --vault-name fullstack-cloudit-kv --name mongo-uri --value "<new URI>"
   az containerapp update -g fullstack-cloudit-rg -n auth-service --revision-suffix rot
   az containerapp update -g fullstack-cloudit-rg -n gallery-service --revision-suffix rot
   ```
4. Update the Function App's `MONGO_URI` app setting (see note below).

> **Function App note:** the `stats` function uses a **direct (non-SRV)** Atlas
> connection string (`mongodb://...@ac-t0s9coe-shard-00-00.pb1qbr7.mongodb.net:27017,...`)
> with `replicaSet=atlas-rred56-shard-0`, because the function's DNS does not
> resolve Atlas SRV records (`querySrv ECONNREFUSED`). Keep the direct form when
> updating its password.

## Security hardening (Topic 11)

- Input validation + rate limiting (`express-rate-limit`) on both backends.
- Upload validation: magic-byte detection + extension whitelist (JPG/PNG/GIF/WEBP/AVIF),
  size limit 5 MB, HTML/script sanitization of title & description.
- `helmet` on both backends; security headers + CSP on nginx.
- Containers run as non-root (`USER node` / `USER nginx`).
- Function CORS pinned to the exact frontend origin (no `*`).
- Secrets in Key Vault via managed identity (above).

**Known limitations:** user passwords are stored in plaintext (`auth-service.js`,
direct string comparison) — a bcrypt + JWT overhaul was out of scope for this
iteration and is listed as a known limitation.

## Hosted endpoints

| Component | URL |
|-----------|-----|
| Frontend (public) | https://frontend.mangosky-c9c689c6.francecentral.azurecontainerapps.io |
| auth-service (internal) | https://auth-service.internal.mangosky-c9c689c6.francecentral.azurecontainerapps.io |
| gallery-service (internal) | https://gallery-service.internal.mangosky-c9c689c6.francecentral.azurecontainerapps.io |
| stats Function | https://fullstack-cloudit-stats.azurewebsites.net/api/stats |

## AI usage declaration

AI tooling (an LLM-based coding assistant --> opencode zen, model: Big Pickle) was used during the development of
this project in the following areas:

- **Debugging** — locating and analyzing errors, and guiding through the fixes.
  Examples: the nginx `bind() to 0.0.0.0:80 failed (13: Permission denied)`
  crash after switching the frontend container to a non-root user, the
  Key Vault secret that resolved to an empty value, the Function App
  host failing to restart after the storage key rotation, and the
  `querySrv ECONNREFUSED` SRV-DNS failure from the serverless function.
- **Orientation** — deciding what to do in which order and how to structure the
  work, following the project roadmap (see [`ROADMAP.md`](ROADMAP.md)) topic by
  topic.
- **Testing** — verifying that the architecture actually works, i.e. that the
  serverless component (Azure Function), the hosting (Azure Container Apps),
  the database (MongoDB Atlas), the blob storage, and the internal/proxied
  service communication all function together end to end.
- **Documentation** - documentation and description of the project were writting by AI and then editited by me to ensure it's correctness

All code was reviewed and understood before being committed; AI output was used
as guidance, not as a substitute for understanding.
