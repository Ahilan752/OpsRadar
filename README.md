# OpsRadar - Native Android AWS Monitoring Platform

**OpsRadar** is an enterprise-grade native Android monitoring platform for Amazon Web Services (AWS). It allows cloud engineers, DevOps teams, and site reliability engineers to securely connect multiple AWS accounts and monitor EC2 instances, CloudWatch metrics, alarms, and AWS Cost Explorer data directly from their Android mobile devices.

---

## Key Highlights & Architecture

- **Native Android Application**: Written in Kotlin with modern Jetpack Compose, Material 3, Navigation Compose, MVVM Architecture, Kotlin Coroutines, Flow, Hilt Dependency Injection, DataStore Preferences, and Retrofit.
- **Enterprise Dark Theme**: Restrained navy/charcoal background (`#0D1117`), crisp typography, AWS orange accents, and clean status badges (Green / Amber / Red / Neutral).
- **Zero Permanent AWS Credential Storage**: Uses AWS STS `AssumeRole` with unique cryptographically generated `ExternalId` tokens and least-privilege read-only permissions. AWS access keys or root credentials are **never** requested or stored.
- **Interactive High-Performance Charts**: Custom Android Canvas-drawn time-series metric charts (CPU, Network In/Out, Disk I/O) and daily spending trend bar charts.
- **Full Backend Service**: Production-ready Node.js, TypeScript, Express, MongoDB/Mongoose, JWT Authentication (bcrypt rounds 12), and AWS SDK for JavaScript v3 (`@aws-sdk/client-sts`, `@aws-sdk/client-ec2`, `@aws-sdk/client-cloudwatch`, `@aws-sdk/client-cost-explorer`).

---

## Project Structure

```
d:\OpsRadar\
├── android\                     # Complete Native Android Application
│   ├── app\
│   │   ├── src\main\
│   │   │   ├── java\com\opsradar\app\
│   │   │   │   ├── core\       # Resource wrapper, result types
│   │   │   │   ├── data\       # Models, DataStore, Network Api, Repositories
│   │   │   │   ├── di\         # Hilt Network & Data Modules
│   │   │   │   ├── presentation\
│   │   │   │   │   ├── components\  # MetricLineChart, StatCard, StatusBadge, TopBar
│   │   │   │   │   ├── navigation\  # Screen routes & NavGraph
│   │   │   │   │   ├── screens\     # Dashboard, Infra, EC2Detail, Alarms, Billing, Settings
│   │   │   │   │   ├── theme\       # Dark navy palette, Material 3 Typography & Theme
│   │   │   │   │   └── viewmodels\  # MVVM ViewModels
│   │   │   │   ├── MainActivity.kt
│   │   │   │   └── OpsRadarApp.kt
│   │   │   └── res\            # XML strings, colors, network security config
│   │   └── build.gradle.kts
│   ├── gradle\libs.versions.toml
│   └── build.gradle.kts
│
├── backend\                     # Node.js + TypeScript REST Backend
│   ├── src\
│   │   ├── aws\                # AWSClientFactory (STS AssumeRole & client caching)
│   │   ├── config\             # Environment & Database config
│   │   ├── controllers\        # Auth, AWSConnection, Monitoring, Dashboard, Notifications
│   │   ├── middleware\         # Auth, RequireAWSConnection, RateLimiter, ErrorHandler
│   │   ├── models\             # User, AWSConnection, NotificationPreference
│   │   ├── routes\             # Express REST routes
│   │   ├── services\           # Business logic & AWS SDK v3 integration
│   │   ├── tests\              # Automated unit & integration tests
│   │   ├── utils\              # Logger (sanitizing), Crypto (ExternalID & AES-256-GCM)
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── cloudformation\
│   └── OpsRadarReadOnlyRole.template.yaml   # 1-Click AWS Customer Role Stack
│
└── deployment\
    ├── Dockerfile               # Multi-stage production container build
    ├── docker-compose.yml       # Backend + MongoDB stack
    ├── nginx.conf               # Nginx reverse proxy with SSL & security headers
    ├── systemd.service          # Linux service daemon
    └── AWS_IAM_SECURITY_GUIDE.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **MongoDB**: Local MongoDB or MongoDB Atlas
- **Android Studio / Android SDK**: Android SDK 35 (API 26+)

---

### 2. Running the Backend Service

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Build TypeScript and run automated tests:
   ```bash
   npm run build
   npm test
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000` and respond to `/health`.

---

### 3. Building and Running the Android App

1. Open `d:\OpsRadar\android` in **Android Studio**.
2. If testing against a local backend on your workstation using the Android Emulator:
   - The default base URL `http://10.0.2.2:5000/` configured in `NetworkModule.kt` connects directly to your computer's `localhost:5000`.
3. Select an emulator or connected device and click **Run (Shift + F10)**.

---

## AWS Account Connection (IAM Cross-Account Role)

1. Open the OpsRadar App and select **Connect AWS Account**.
2. Enter an **Account Name** (e.g., `Production`) and a **Default Region** (`us-east-1`).
3. The app displays your generated **External ID** and **IAM Trust Policy**.
4. In your AWS Console, create the IAM role or deploy `cloudformation/OpsRadarReadOnlyRole.template.yaml` in AWS CloudFormation.
5. Enter your **12-digit AWS Account ID** and **Role ARN** (`arn:aws:iam::123456789012:role/OpsRadarReadOnlyRole`).
6. Tap **Validate & Connect**. The backend calls AWS STS `AssumeRole`, verifies permissions, and loads your live infrastructure!

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Sign in and get JWT token pair
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Discard session
- `GET /api/auth/me` - User profile

### AWS Connection Management
- `POST /api/aws/connections` - Initiate connection & generate External ID
- `POST /api/aws/connections/validate` - Validate Role ARN via STS AssumeRole
- `GET /api/aws/connections` - List user's connected AWS accounts
- `GET /api/aws/connections/:id` - Get connection details
- `DELETE /api/aws/connections/:id` - Disconnect AWS account
- `GET /api/aws/connections/:id/regions` - List supported AWS regions

### Monitoring & Infrastructure
- `GET /api/dashboard/overview` - Consolidated dashboard metrics
- `GET /api/aws/ec2/instances` - List EC2 instances with state/search filter
- `GET /api/aws/ec2/instances/:instanceId` - EC2 instance details & status checks
- `GET /api/aws/cloudwatch/metrics` - CloudWatch time-series metric data
- `GET /api/aws/cloudwatch/alarms` - List CloudWatch alarms
- `GET /api/aws/cloudwatch/alarms/:alarmName/history` - Alarm state transition history
- `GET /api/aws/billing/summary` - AWS Cost Explorer monthly, daily, and service spending

---

## Security & Compliance
- **No Resource Mutation**: Read-only V1 guarantees no user can start, stop, create, or delete AWS resources.
- **Tenant Isolation**: Multi-tenant database queries strictly enforce `userId` ownership.
- **Sanitized Logging**: Access keys, session tokens, passwords, and secrets are automatically scrubbed from server logs.
- **At-Rest Encryption**: Sensitive metadata is encrypted with AES-256-GCM.

