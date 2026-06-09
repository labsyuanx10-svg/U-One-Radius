# Billing ISP — Dokumentasi Proyek

## 📋 Ringkasan

Aplikasi billing management untuk ISP (Internet Service Provider). Manage pelanggan, paket, router, tagihan, RADIUS, monitoring online/offline, infrastruktur jaringan (ODC/ODP/kabel), multi-cabang.

**Tech Stack:**
- Backend: PHP 8.4 + Slim Framework 4 + Idiorm
- Frontend: React 19 + TypeScript + Tailwind v4 + shadcn/ui
- Database: MariaDB 11
- RADIUS: FreeRADIUS 3 (MySQL backend)
- Map: Leaflet.js
- Container: Docker + Docker Compose

**Akses:**
- Web UI: `http://localhost:8091`
- API: `http://localhost:8090/api`
- Default login: `admin` / `admin`

---

## 📁 Struktur Proyek

```
billing/
├── docker-compose.yml          # Orkestrasi container
├── db/
│   └── schema.sql              # Database schema + seed data
├── backend/                    # PHP API (Slim Framework 4)
│   ├── Dockerfile
│   ├── composer.json
│   ├── .env
│   └── src/
│       ├── Config/Database.php
│       ├── Controllers/ (20 controllers — lihat daftar di bawah)
│       ├── Middleware/
│       │   ├── AuthMiddleware.php     # JWT (base64 JSON)
│       │   └── AdminMiddleware.php    # Role check
│       └── Helpers/
│           └── WaAdapter.php          # WA multi-provider
├── frontend/                   # React 19 SPA
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── lib/
│       │   ├── api.ts         # Axios instance + interceptor
│       │   └── utils.ts       # cn() helper
│       ├── stores/
│       │   └── authStore.ts   # Zustand auth state
│       ├── layout/
│       │   ├── AppShell.tsx   # Layout wrapper
│       │   ├── Sidebar.tsx    # Sidebar navigasi
│       │   ├── Navbar.tsx     # Top bar
│       │   └── StatCard.tsx   # Dashboard stat card
│       ├── components/ui/     # shadcn/ui components
│       │   ├── button.tsx, card.tsx, badge.tsx, input.tsx
│       │   ├── select.tsx, dialog.tsx, table.tsx, tabs.tsx
│       │   └── ...
│       └── pages/
│           ├── Login.tsx
│           ├── Dashboard.tsx
│           ├── customers/
│           │   ├── CustomerList.tsx
│           │   ├── CustomerForm.tsx
│           │   └── CustomerDetail.tsx
│           ├── plans/PlansView.tsx
│           ├── routers/RouterList.tsx
│           ├── groups/GroupList.tsx
│           ├── tickets/TicketList.tsx + TicketForm.tsx
│           ├── transactions/TransactionList.tsx + InvoicePrint.tsx
│           ├── radacct/StatusOnline.tsx + LogRadius.tsx
│           ├── settings/SettingsView.tsx + WaSettings.tsx + AdminUsers.tsx + ProfilePage.tsx
│           ├── infrastructure/Infrastructure.tsx + InfrastructureMap.tsx + OdcList.tsx + OdpList.tsx + CableRouteList.tsx
│           └── logs/LogsPage.tsx
├── freeradius/
│   └── startup.sh              # Config patch untuk FreeRADIUS
│   └── clients.conf            # RADIUS client definitions
└── scripts/
    └── setup-routers.php       # Sync RADIUS NAS table
```

---

## ⚙️ Container Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────▶│   Backend    │────▶│    MariaDB      │
│  (nginx)    │     │  (PHP-Apache)│     │   (port 3306)   │
│  port 8091  │     │  port 8090   │     │                 │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │                        │
                           ▼                        ▼
                    ┌──────────────────┐   ┌─────────────────┐
                    │   FreeRADIUS     │   │  radcheck        │
                    │  (port 1812/udp) │   │  radreply        │
                    │  auth + acct     │   │  radacct         │
                    └──────────────────┘   └─────────────────┘
```

**Container:**
- `db` → MariaDB 11
- `backend` → PHP 8.4 Apache (Slim 4)
- `frontend` → nginx (React build), proxy `/api` ke `backend:80`
- `freeradius` → FreeRADIUS 3 (MySQL auth + accounting)

---

## 🗄️ Database Schema

### Tables inti:

| Table | Fungsi | Key fields |
|-------|--------|------------|
| `users` | Pelanggan + admin | `uid, email, nik, phone, address, device_merk, device_serial, coordinates, group_id` |
| `groups` | Cabang/divisi | `code, name, address` |
| `plans` | Paket internet | `name, type, price, bandwidth_*, burst_*, ip_pool_id, group_id` |
| `ip_pools` | Pool IP | `range_ip, gateway, dns*, router_id, group_id` |
| `routers` | MikroTik | `ip_address, secret, type (hotspot/pppoe), group_id` |
| `subscriptions` | Aktivasi | `username_radius, password_radius, billing_date, started_at, expired_at` |
| `transactions` | Tagihan | `invoice_no, amount, status (unpaid/paid), due_date, billing_date, method, note` |
| `tickets` | Tiket gangguan | `ticket_no, category, priority, status, solution, group_id` |
| `logs` | Log aktivitas | `user_id, action, description, ip_address` |
| `settings` | Pengaturan | `key, value, category` |
| `odc` | ODC (spliter) | `name, latitude, longitude, capacity, port_used, router_id, group_id` |
| `odp` | ODP (terminal) | `name, latitude, longitude, capacity, port_used, odc_id, group_id` |
| `cable_routes` | Rute kabel | `name, type (feeder/distribution/drop), coordinates JSON, odc_id, odp_id, distance_km, group_id` |

### RADIUS tables (FreeRADIUS standard):

| Table | Fungsi |
|-------|--------|
| `nas` | Daftar MikroTik (RADIUS client) |
| `radcheck` | Auth: Cleartext-Password per user |
| `radreply` | Reply: Mikrotik-Rate-Limit (bandwidth) |
| `radacct` | Accounting: session start/stop, traffic, IP, MAC |

---

## 🔗 API Endpoints

### Auth
```
POST   /api/auth/login          # Login (return JWT base64)
GET    /api/auth/me             # Current user profile
```

### Dashboard
```
GET    /api/dashboard/stats     # Stats: total, active, expired, isolir, revenue
```

### Pelanggan
```
CRUD   /api/customers           # Customer list with pagination
GET    /api/customers/export    # Export CSV
PUT    /api/customers/{id}/toggle-isolir  # Manual isolir/aktifkan
GET    /api/customers/{id}/transactions
GET    /api/customers/{id}/tickets
GET    /api/customers/{id}/subscriptions
```

### Plans, Pools, Routers, Groups
```
CRUD   /api/plans               # Auto group_id
CRUD   /api/ip-pools            # Auto group_id
CRUD   /api/routers             # Auto group_id
CRUD   /api/groups              # Superadmin only
```

### Subscriptions
```
CRUD   /api/subscriptions       # Aktivasi + sync radcheck/radreply
```

### Transactions
```
CRUD   /api/transactions        # Tagihan with pagination
PUT    /api/transactions/{id}   # Bayar (status → paid, method, note)
GET    /api/transactions/export # Export CSV
GET    /api/transactions/{id}/pdf  # Invoice PDF
POST   /api/transactions/{id}/send-wa  # Kirim via WA
```

### Tickets
```
CRUD   /api/tickets             # With pagination
```

### RADIUS
```
GET    /api/radacct/online      # Active sessions
GET    /api/radacct/log         # Auth log with pagination
```

### Settings
```
GET    /api/settings            # All settings
PUT    /api/settings            # Update (key-value pairs)
```

### WA Gateway
```
GET    /api/wa/settings         # Get WA config
PUT    /api/wa/settings         # Save WA config
POST   /api/wa/test             # Test send
```

### Admin Users (superadmin only)
```
CRUD   /api/admin-users
```

### Profile
```
GET    /api/profile             # Current user profile
PUT    /api/profile/password    # Change password
```

### Activity Log
```
GET    /api/logs                # With group filter, search, pagination (max 200)
```

### Infrastruktur
```
CRUD   /api/odc                 # ODC with group filter + logging
CRUD   /api/odp                 # ODP with group filter + logging
CRUD   /api/cable-routes        # Cable routes with group filter + logging
```

---

## 👥 Role System

| Role | Capabilities |
|------|-------------|
| `superadmin` | Full access, no group restriction, manage admin users, settings, activity log |
| `admin` | Group-scoped CRUD for customers/plans/pools/routers, can edit ticket fully |
| `teknisi` | Group-scoped read-only, can only update ticket status/solution/assigned_to |
| `auditor` | Read-only (not fully implemented) |
| `customer` | Pelanggan (not implemented for self-service yet) |

---

## 🗺️ Infrastruktur Map

- **ODC** (Optical Distribution Cabinet) — titik split jaringan, terkait router
- **ODP** (Optical Distribution Point) — titik terminasi, terkait ODC
- **Cable Routes** — rute kabel feeder/distribution/drop dengan koordinat polyline

**Legend map:**
- 🔴 Red — Router
- 🔵 Blue — ODC
- 🟢 Green — ODP
- Red polyline — Feeder cable
- Yellow polyline — Distribution cable
- White polyline — Drop cable

---

## 📦 WA Multi-Provider

Adapter mendukung 5 provider:
1. **OpenWA** — self-hosted, X-API-Key header
2. **Fonnte** — api.fonnte.com, Authorization: token
3. **Wablas** — self-hosted, token query param
4. **Twilio** — REST API, Basic Auth (Account SID + Auth Token)
5. **WA Business API** — Meta Graph API, Bearer token

---

## 🐳 Docker Commands

```bash
# Start all
docker compose up -d

# Rebuild frontend
docker compose up -d --build frontend

# Rebuild backend
docker compose up -d --build backend

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop all
docker compose down

# Full reset (data aman di volume)
docker compose down -v
```

---

## 📝 Environment Variables

Backend (`.env`):
```
DB_HOST=db
DB_PORT=3306
DB_NAME=billing
DB_USER=billing
DB_PASS=changeme
```

Default credentials: `admin` / `admin`
