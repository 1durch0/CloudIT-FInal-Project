# Full Stack Cloud IT Project — Roadmap

**Deadline:** 15. August 17:00 · **Submission:** Moodle (code + hosted link, optional Git link)
**Skill level:** beginner — this roadmap is ordered so you only learn what you need, step by step.

---

## 1. Project Requirements (from the PDF)

- Full stack application (website or mobile app) with **minimum 5 pages** of navigation.
- Free choice of business idea (e.g. ticket booking, campus app, game).
- **Microservice architecture**: Frontend + Backend split into services.
- Images / data stored in a **cloud blob storage** (e.g. Azure Blob Storage).
- **REST API** for frontend ↔ backend communication.
- **Docker** containers for every service.
- **Container orchestration** with Kubernetes (e.g. Azure AKS, or open source).
- The whole app **hosted on a cloud service** (Netlify, Heroku, AKS, …).
- At least **one serverless component** (e.g. Azure Functions).
- Use **one cloud provider** of your choice (Azure recommended — used in class).

## 2. Recommended Tech Stack

| Component        | Choice (recommended)                  | Why |
|------------------|---------------------------------------|-----|
| Frontend         | React + Vite + React Router           | Most beginner-friendly, huge ecosystem |
| Backend services | Node.js + Express (2–3 services)      | Same language as frontend = less to learn |
| Database         | MongoDB Atlas (cloud) or PostgreSQL   | Managed = no local install pain |
| Blob storage     | Azure Blob Storage                    | Covered in class, has SDK + free tier |
| Containers       | Docker + docker-compose (local)       | Required by the assignment |
| Orchestration    | minikube (local) → Azure AKS (cloud)  | Learn locally, deploy on Azure |
| Hosting          | Frontend on Netlify, backend on AKS   | Free tier + required hosting |
| Serverless       | Azure Functions                       | Counts as serverless component |
| Version control  | Git + GitHub                          | Needed for submission Option 2 |

### Example business idea
A **photo blog / image gallery** works perfectly because it naturally needs blob
storage for images, a REST API, and multiple pages:

1. Home
2. Login / Register
3. Dashboard (your uploads)
4. Image detail view
5. Upload image
6. About / Contact

---

## 3. Architecture Overview

```
[Browser]
   │  (React, 6 pages, hosted on Netlify)
   ▼
[Frontend Service] ──REST (JSON)──▶ [API Gateway / auth-service] ──▶ [gallery-service]
                                                    │                        │
                                              [Azure Functions]        [MongoDB Atlas]
                                              (serverless)            (database)
                                                             ▲
                                            [Azure Blob Storage]
                                            (images via signed URLs)
```

All services run as **Docker containers**, orchestrated by **Kubernetes (AKS)**
in the cloud and **minikube** locally.

---

## 4. Work Topics (do them in order)

### Topic 0 — Setup your environment
**Goal:** Everything installed, Git repo ready.
- Install: VS Code, Node.js LTS, Git, Docker Desktop, Postman, Azure CLI.
- Create GitHub repo + clone it locally.
- Create free accounts: Azure (student credit), MongoDB Atlas, Netlify.
- Push a simple `README.md` as your first commit.
- **Checkpoint:** `git push` works, `node -v` and `docker --version` run.

### Topic 1 — Frontend basics
**Goal:** A React app with 5+ pages and navigation, running locally.
- Learn: JSX, components, props/state, React Router (`npm install react-router-dom`).
- Create pages: Home, Login, Register, Dashboard, Upload, About.
- Wire navigation between pages (Link / NavLink).
- Use a bit of CSS or a library like Tailwind/Bootstrap for a clean look.
- **Checkpoint:** you can click through all pages in the browser.

### Topic 2 — Backend basics (REST API)
**Goal:** Your first backend service with real endpoints.
- Learn: Node.js + Express, routes, request/response, JSON.
- Create `backend/auth-service` with endpoints like `POST /register`, `POST /login`,
  `GET /health`.
- Test every endpoint in Postman (status codes, JSON bodies).
- **Checkpoint:** Postman shows correct responses for all endpoints.

### Topic 3 — Connect Frontend ↔ Backend
**Goal:** Frontend sends requests to the backend and shows data.
- Use `fetch` (or axios) in React; handle loading/error states.
- Enable CORS on the backend so the browser allows requests.
- Wire Login/Register pages to the real API.
- **Checkpoint:** registering a user from the website works end to end.

### Topic 4 — Microservice architecture
**Goal:** Split the backend into 2+ independent services.
- Add a second service `backend/gallery-service` (own repo-folder, own API).
- Service split example:
  - `auth-service` → users, login, JWT tokens.
  - `gallery-service` → images, metadata, blob upload.
  - `gateway` (optional) → single entry point that routes to the services.
- Services only talk over REST/HTTP — never share code files.
- **Checkpoint:** both services run separately with `npm start` and answer requests.

### Topic 5 — Database
**Goal:** Data is persisted in a real (cloud) database.
- Set up MongoDB Atlas (free tier), get a connection string.
- `auth-service` stores users; `gallery-service` stores image metadata.
- Use Mongoose (or pg) and test CRUD operations.
- **Checkpoint:** data survives a restart of the services.

### Topic 6 — Cloud blob storage (Azure Blob Storage)
**Goal:** Images are stored in the cloud, not on disk.
- Create a storage account + container in Azure (free tier).
- Backend uploads images to Blob Storage via the Azure SDK.
- Frontend shows images via a public/signed URL.
- **Checkpoint:** uploading an image from the website stores it in Azure and it displays again.

### Topic 7 — Serverless component
**Goal:** One serverless function in the app.
- Create an **Azure Function** (e.g. `resize-image` or `thumbnail-generator`, or a
  `stats` endpoint that counts uploads).
- Trigger it via HTTP; call it from the frontend or gallery-service.
- **Checkpoint:** the function runs and returns a result from the website.

### Topic 8 — Docker containers
**Goal:** Every service (frontend + each backend) runs as a Docker image.
- Write a `Dockerfile` for the frontend (build → serve with nginx) and for each backend.
- Write a `docker-compose.yml` that starts everything locally with one command.
- **Checkpoint:** `docker-compose up` starts the whole app on your machine.

### Topic 9 — Kubernetes orchestration
**Goal:** The app runs in Kubernetes, not just docker-compose.
- Learn the basics: Pods, Deployments, Services, Ingress.
- Start locally with **minikube**; write YAML manifests (deployment + service per app).
- Deploy to **Azure AKS** in the cloud (create cluster in Azure Portal/CLI).
- **Checkpoint:** `kubectl get pods` shows all services running; app reachable via URL.

### Topic 10 — Hosting the finished app
**Goal:** Publicly accessible URLs.
- Frontend: deploy the built React app to **Netlify** (or Vercel) via Git.
- Backend: keep running on AKS (already deployed) or simplify to **Azure Container Apps**.
- Set environment variables/secrets in the cloud (no hardcoded keys).
- Test the live link end to end on your phone too.
- **Checkpoint:** you can open the app from any browser via a public URL.

### Topic 11 — Security, polish & final checks
**Goal:** No embarrassing bugs or leaks before submission.
- Remove/never commit secrets — use `.env` + `.gitignore`.
- Hash passwords (bcrypt), protect routes with JWT middleware.
- Handle errors gracefully; add loading spinners; make it responsive.
- Re-check all **Must-Have requirements** against the checklist below.

### Topic 12 — Submission
**Goal:** Hand in everything on Moodle.
- Push final code to GitHub, verify the hosted link works.
- Write a short README (how to run locally + architecture + hosted links).
- Submit in Moodle: Option 1 (code + link) or Option 2 (Git + hosted link).

---

## 5. Requirement Checklist (tick off before submitting)

- [ ] 5+ pages with working navigation
- [ ] Microservice architecture (frontend + 2+ backend services)
- [ ] Images/data stored in cloud blob storage (Azure Blob Storage)
- [ ] REST API between frontend and backend
- [ ] All services in Docker containers
- [ ] Kubernetes orchestration (AKS) — app runs in a cluster
- [ ] Whole app hosted on a cloud service (live URL)
- [ ] At least one serverless component (Azure Function)
- [ ] Code pushed to Git (optional but recommended)
- [ ] Hosted link submitted on Moodle

---

## 6. Tips for a beginner

- **Follow the order.** Topics build on each other; skip nothing.
- **One thing at a time.** Finish a topic and check it off before the next.
- **Commit often** with clear messages — instant backup and needed for submission.
- When stuck: paste the error into a search, or ask the tutor. Expect errors — they are part of learning.
- Keep services small. A "microservice" here just means a small, separately running backend app, not a complex system.
- Start early: the deployment topics (Docker/Kubernetes/hosting) take the most time.
