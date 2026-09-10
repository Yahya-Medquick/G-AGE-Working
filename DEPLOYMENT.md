# G-AGE AI — Production Deployment Guide

This guide details the step-by-step procedures for deploying **G-AGE AI | Universal Knowledge Engine** into high-availability production environments, with a primary focus on Railway.

---

## 1. System Requirements & Prerequisites

- **Node.js**: v22.0.0+ (ES Modules & Native TypeScript Type Stripping support)
- **Docker**: Engine v24.0+ & Docker Compose v2+
- **Memory**: Minimum 512 MB RAM (1 GB recommended per container instance)
- **CPU**: 1 vCPU per container instance
- **Storage**: Ephemeral or persistent storage for static bundle assets

---

## 2. Environment Configuration

Copy `.env.example` to `.env` or set environment variables in your container deployment service (Railway, Google Cloud Run, AWS ECS, Kubernetes):

```env
NODE_ENV="production"
PORT=3000
APP_URL="https://gageai.org"
GEMINI_API_KEY="your-gemini-api-key"
ADMIN_TOKEN="your-custom-secure-admin-token"
OPENALEX_MAILTO="admin@your-domain.com"
GITHUB_TOKEN="your-github-personal-access-token"
YOUTUBE_API_KEY="your-google-youtube-api-key"
```

---

## 3. Local Production Build & Test

Validate compilation, type safety, unit tests, and production server execution locally before deploying:

```bash
# 1. Run Linter & Type Checker
npm run lint

# 2. Run Automated Test Suite
npm test

# 3. Build Production Bundle
npm run build

# 4. Start Production Server
npm start
```

---

## 4. Deploying to Railway (Recommended)

Railway is the primary cloud host for G-AGE AI, serving traffic at **`bifrostai.up.railway.app`**.

### Step 1: Push Code to GitHub
Ensure your repository is initialized and pushed to a remote GitHub repository.
```bash
git init
git add .
git commit -m "feat: initial commit for G-AGE AI"
git remote add origin https://github.com/yourusername/gage-ai.git
git branch -M main
git push -u origin main
```

### Step 2: Provision a New Project on Railway
1. Go to [Railway](https://railway.app) and log in.
2. Click **New Project** and select **Deploy from GitHub repo**.
3. Choose your `gage-ai` repository.

### Step 3: Configure Environment Variables
In the **Variables** tab of your Railway service, add the following parameters:
- `NODE_ENV`: `production`
- `PORT`: `3000`
- `APP_URL`: `https://bifrostai.up.railway.app`
- `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
- `ADMIN_TOKEN`: *(A custom secure password string for your Admin panel)*

### Step 4: Verify Deployment
Railway will automatically detect the root `Dockerfile`, build the multi-stage image, and expose the domain at `bifrostai.up.railway.app`. Verify that:
- `/api/v1/health` returns status `{ "status": "healthy" }`
- The front-end interface loads with full responsive capabilities.

---

## 5. Containerized Deployment with Docker (Manual)

### A. Build Docker Image
```bash
docker build -t gage-ai:latest .
```

### B. Test Docker Container Locally
```bash
docker run -d \
  --name gage-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY="your-gemini-key" \
  -e ADMIN_TOKEN="your-admin-token" \
  gage-ai:latest
```

### C. Verify Container Health
```bash
curl http://localhost:3000/api/v1/health
```

---

## 6. Alternative Cloud Platform Deployments

### Option A: Google Cloud Run
```bash
# 1. Authenticate with Google Cloud
gcloud auth login

# 2. Build and Submit to Artifact Registry
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/gage/explorer:v1.0.0

# 3. Deploy Service to Cloud Run
gcloud run deploy gage-ai \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/gage/explorer:v1.0.0 \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production,APP_URL=https://bifrostai.up.railway.app" \
  --set-secrets "GEMINI_API_KEY=GEMINI_KEY_SECRET:latest,ADMIN_TOKEN=ADMIN_TOKEN_SECRET:latest"
```

### Option B: Kubernetes
Apply deployment and service manifests:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gage-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gage-ai
  template:
    metadata:
      labels:
        app: gage-ai
    spec:
      containers:
      - name: explorer
        image: gage-ai:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: gage-secrets
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /api/v1/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
```

---

## 7. Reverse Proxy & SSL/TLS Configuration (Nginx)

When deploying behind an Nginx gateway manually:

```nginx
server {
    listen 443 ssl http2;
    server_name bifrostai.up.railway.app;

    ssl_certificate /etc/letsencrypt/live/bifrostai.up.railway.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bifrostai.up.railway.app/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 8. Automated Continuous Integration & Delivery (CI/CD)

The repository includes a GitHub Actions workflow `.github/workflows/ci.yml` that automatically:
1. Performs static analysis (`tsc --noEmit`).
2. Executes automated tests (`vitest run`).
3. Compiles production assets (`npm run build`).
4. Verifies multi-stage Docker build.
