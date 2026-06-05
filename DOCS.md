# Billing ISP — Dokumentasi Proyek

## 📋 Ringkasan

Aplikasi billing management untuk ISP (Internet Service Provider). Manage pelanggan, paket, router, tagihan, RADIUS, dan monitoring online/offline.

**Tech Stack:**
- Backend: PHP 8.4 + Slim Framework 4
- Frontend: Vue 3 + PrimeVue 4 + TailwindCSS + Leaflet.js
- Database: MariaDB 11
- RADIUS: FreeRADIUS 3 (MySQL backend)
- Container: Docker + Docker Compose

**Akses:**
- Web UI: `http://10.10.33.52:8091`
- API: `http://10.10.33.52:8090/api`
- Default login: `admin` / `admin`

---

## 📁 Struktur Proyek

```
billing/
├── docker-compose.yml          # Orkestrasi container
├── db/
│   └── schema.sql              # Database schema + seed data
├── backend/                    # PHP API (Slim Framework)
│   ├── Dockerfile
│   ├── composer.json
│   ├── .env
│   └── src/
│       ├── Config/Database.php
│       ├── Controllers/
│       │   ├── AuthController.php       # Login/logout
│       │   ├── DashboardController.php  # Stats
│       │   ├── UserController.php       # CRUD pelanggan
│       │   ├── PlanController.php       # CRUD paket
│       │   ├── PoolController.php       # CRUD IP pool
│       │   ├── RouterController.php     # CRUD router
│       │   ├── GroupController.php      # CRUD group/cabang
│       │   ├── SubscriptionController.php # Aktivasi langganan
│       │   ├── TransactionController.php  # Tagihan + invoice PDF
│       │   ├── TicketController.php       # Tiket gangguan
│       │   ├── SettingController.php      # Pengaturan
│       │   ├── CronController.php         # Auto isolir
│       │   └── RadacctController.php      # RADIUS online/log
│       └── Middleware/
│           ├── AuthMiddleware.php
│           └── AdminMiddleware.php
├── frontend/                   # Vue 3 SPA
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.vue
│       ├── api/axios.js
│       ├── router/index.js
│       ├── stores/auth.js
│       ├── stores/app.js
│       ├── components/
│       │   ├── Sidebar.vue
│       │   ├── Navbar.vue
│       │   ├── Modal.vue
│       │   └── StatCard.vue
│       └── views/
│           ├── Login.vue
│           ├── Dashboard.vue
│           ├── customers/
│           │   ├── CustomerList.vue
│           │   ├── CustomerForm.vue
│           │   └── CustomerDetail.vue
│           ├── plans/
│           │   ├── PlansView.vue
│           │   ├── PlanList.vue
│           │   └── PoolList.vue
│           ├── routers/RouterList.vue
│           ├── groups/GroupList.vue
│           ├── tickets/
│           │   ├── TicketList.vue
│           │   └── TicketForm.vue
│           ├── transactions/
│           │   ├── TransactionList.vue
│           │   └── InvoicePrint.vue
│           ├── radacct/
│           │   ├── StatusOnline.vue
│           │   └── LogRadius.vue
│           └── settings/SettingsView.vue
├── freeradius/
│   └── startup.sh              # Config patch untuk FreeRADIUS
├── scripts/
│   └── setup-routers.php       # Sync RADIUS NAS table
└── memory/                     # Catatan sesi
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
                    │  MikroTik via NAS │   │  nas             │
                    └──────────────────┘   └─────────────────┘
```

**Container dependencies:**
- `db` → MariaDB, healthcheck via `mysqladmin ping`
- `backend` → PHP 8.4 Apache, depends on `db` (healthy)
- `frontend` → Vue build via nginx, proxies `/api` ke `backend:80`
- `freeradius` → FreeRADIUS, depends on `db` (healthy)

---

## 🗄️ Database Schema

### Tables inti:

| Table | Fungsi | Key fields baru |
|-------|--------|-----------------|
| `users` | Pelanggan + admin | `uid, email, nik, phone, address, device_merk, device_serial, coordinates` |
| `groups` | Cabang/divisi | `code, name, address, phone, email` |
| `plans` | Paket internet | `name, type, price, bandwidth_*, burst_*, ip_pool_id` |
| `ip_pools` | Pool IP | `range_ip, gateway, dns*, router_id` |
| `routers` | MikroTik | `ip_address, secret, type (hotspot/pppoe), group_id` |
| `subscriptions` | Aktivasi pelanggan | `username_radius, password_radius, billing_date, started_at, expired_at` |
| `transactions` | Tagihan | `invoice_no, amount, status (unpaid/paid), due_date, billing_date` |
| `tickets` | Tiket gangguan | `ticket_no, category, priority, status` |
| `logs` | Log aktivitas admin | `user_id, action, description, ip_address` |
| `settings` | Pengaturan sistem | `key, value, category` |

### RADIUS tables (standar FreeRADIUS):

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
POST   /api/auth/login          # Login admin
GET    /api/auth/me             # Profile admin (token)
```

### Dashboard
```
GET    /api/dashboard/stats     # Total user, aktif, expired, revenue
```

### Pelanggan (alias: /api/users + /api/customers)
```
GET    /api/customers           # List pelanggan + group_name, plan_name
GET    /api/customers/{id}      # Detail
POST   /api/customers           # Create
PUT    /api/customers/{id}      # Update
DELETE /api/customers/{id}      # Delete + cleanup radcheck/radreply
GET    /api/customers/{id}/transactions  # Tagihan pelanggan
GET    /api/customers/{id}/tickets      # Tiket pelanggan
GET    /api/customers/{id}/subscriptions # Langganan pelanggan
```

### Plans, Pools, Routers, Groups
```
CRUD   /api/plans               # Paket internet
CRUD   /api/ip-pools            # IP pool
CRUD   /api/routers             # Router MikroTik
CRUD   /api/groups              # Group (superadmin only)
```

### Subscriptions
```
CRUD   /api/subscriptions       # Langganan + sync radcheck/radreply
```

### Transactions
```
CRUD   /api/transactions        # Tagihan
GET    /api/transactions/{id}/pdf  # Cetak invoice PDF
```

### Tickets
```
CRUD   /api/tickets             # Tiket gangguan
```

### RADIUS Accounting
```
GET    /api/radacct/online      # User online (acctstoptime IS NULL)
GET    /api/radacct/log         # Log radius (connect/disconnect)
```

### Settings & Cron
```
GET/PUT /api/settings           # Pengaturan app
GET     /api/cron/isolir        # Cron auto-isolir
```

---

## 🧠 Core Workflow

### 1. Tambah Pelanggan Baru

```
Admin buka /customers/new
→ Isi form: Nama*, HP, Email, NIK, Alamat, Group*, Paket, 
  Username PPPoE*, Password PPPoE*, Merk ONT, Serial
→ Submit

Backend:
  1. Generate UID (C0001, C0002, ...)
  2. Insert ke users table (role=customer, password=blank)
  3. Jika pilih paket & isi PPPoE:
     a. Validasi username_radius + password_radius required
     b. Cari router (group sesuai kalo ada)
     c. Hitung expired_at dari duration_days
     d. Insert ke subscriptions
     e. Insert ke radcheck (Cleartext-Password)
     f. Insert ke radreply (Mikrotik-Rate-Limit = bw_down/bw_up)
     g. Generate invoice (unpaid) dengan due_date
  4. Log aktivitas
```

### 2. Auto Isolir (Cron)

```
Endpoint: GET /api/cron/isolir

Logic:
  1. Cari semua subscriptions WHERE expired_at < NOW() AND status = 'active'
  2. Untuk setiap:
     - Hapus radcheck (Cleartext-Password)
     - Hapus radreply (Mikrotik-Rate-Limit)
     - Update subscription.status = 'expired'
     - Update users.status = 'expired'
     - Log aktivitas
```

### 3. Koneksi MikroTik → RADIUS

```
MikroTik → PPPoE auth request → FreeRADIUS (port 1812/udp)
  → Query radcheck WHERE username = pppoe_user AND attribute = 'Cleartext-Password'
  → Verify password
  → If OK: Query radreply WHERE username = pppoe_user
    → Return Mikrotik-Rate-Limit (bandwidth)
  → Accept

Session active → MikroTik kirim accounting update
  → INSERT/UPDATE radacct
  → Data: username, framed-ip, calling-station-id (MAC), 
           acctinputoctets, acctoutputoctets, session time

Session end → MikroTik kirim accounting stop
  → Update radacct SET acctstoptime, acctterminatecause
```

### 4. Status Online / Log

```
Online: SELECT FROM radacct WHERE acctstoptime IS NULL
  → JOIN users by username_radius
  → JOIN plans for plan name
  → Tampilkan: username, name, UID, IP, MAC, start time, duration

Log:   SELECT FROM radacct ORDER BY id DESC
  → Filter: connect (acctterminatecause=null), disconnect (acctterminatecause!=null)
  → Tampilkan: nama, UID, action, IP, MAC, waktu, durasi, alasan putus
```

---

## 🖥️ Frontend Routes

```
/login               → Login admin
/                    → Dashboard (stats, recent transactions, tickets)
/customers           → List pelanggan + search/filter
/customers/new       → Form tambah pelanggan
/customers/:id       → Detail pelanggan + tabs
/customers/:id/edit  → Edit pelanggan
/plans               → Paket + IP Pool management
/routers             → Router management
/groups              → Group management (superadmin)
/tickets             → Tiket gangguan
/transactions        → Tagihan, mark as paid, print invoice
/radacct             → Status Online
/radacct/logradius   → Log Radius
/settings            → Pengaturan app
```

---

## 📝 Form Pelanggan (CustomerForm.vue)

Layout: 2 kolom (form utama 2/3, peta lokasi 1/3)

```
┌──────────────────────────────────────┬────────────────────┐
│  Data Pribadi                        │   Lokasi           │
│  ┌─────────┬──────────┐             │                    │
│  │ Nama*   │ No HP    │             │   [Leaflet Map]    │
│  ├─────────┼──────────┤             │                    │
│  │ Email   │ NIK      │             │   Lat: -6.2088     │
│  └─────────┴──────────┘             │   Lng: 106.8456    │
│                                     │                    │
│  Alamat                             │                    │
│  ┌─────────────────────────────────┐│                    │
│  │ Alamat Lengkap                  ││                    │
│  │ (jalan, desa, kec, kota)        ││                    │
│  └─────────────────────────────────┘│                    │
│                                     │                    │
│  Data Layanan                       │                    │
│  ┌─────────┬──────────┐             │                    │
│  │ Group*  │ Paket    │             │                    │
│  ├─────────┼──────────┤             │                    │
│  │ Username│ Password │             │                    │
│  │ PPPoE*  │ PPPoE*   │             │                    │
│  └─────────┴──────────┘             │                    │
│                                     │                    │
│  [✓] Aktifkan sekarang              │                    │
│  [Tgl Aktivasi] [Tgl Expired]       │                    │
│                                     │                    │
│  Perangkat                          │                    │
│  ┌─────────┬──────────┐             │                    │
│  │ Merk ONT│ Serial   │             │                    │
│  └─────────┴──────────┘             │                    │
│                                     │                    │
│        [Batal] [Simpan]             │                    │
└──────────────────────────────────────┴────────────────────┘
```

---

## 🔧 Development Workflow

### Membuat perubahan

1. Edit file di workspace `~/billing/`
2. Build + restart container:
```bash
cd ~/billing
docker compose up -d --build <service>
# service = backend | frontend | freeradius
```

### Melihat log
```bash
docker compose logs -f <service>
docker compose logs -f backend     # PHP logs
docker compose logs -f frontend    # nginx logs
docker compose logs -f freeradius  # RADIUS logs
docker compose logs -f db          # MariaDB logs
```

### Akses database langsung
```bash
docker compose exec db mysql -u billing -pbilling123 bill_isp
```

### Test RADIUS auth
```bash
docker compose exec freeradius radtest testuser test123 localhost 0 testing123
# Should return Access-Accept
```

### Status container
```bash
cd ~/billing && docker compose ps
```

---

## 🌐 nginx Config (Frontend)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }

    location /api/ {
        proxy_pass http://backend:80/api/;   # Proxy API
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 📦 docker-compose.yml Ringkasan

| Service | Image | Port | Depends | Volume |
|---------|-------|------|---------|--------|
| `db` | mariadb:11 | 3306 | - | `bill-db-data` (volume) |
| `backend` | custom (php:8.4-apache) | 8090:80 | db (healthy) | - |
| `frontend` | custom (nginx) | 8091:80 | - | - |
| `freeradius` | freeradius/freeradius-server | 1812-1813/udp | db (healthy) | - |
| `openwa-api` | custom (node:22 + puppeteer) | 3000:2785 | - | `./openwa/data:/app/data` |
| `openwa-dashboard` | custom (nginx:alpine) | 3001:80 | openwa-api | - |

Environment variables utama:
- `MYSQL_DATABASE=bill_isp`, `MYSQL_USER=billing`, `MYSQL_PASSWORD=billing123`
- `TZ=Asia/Jakarta` (semua container)

---

## 🔐 Keamanan

- **API Auth**: JWT Bearer token via `AuthMiddleware`
- **Password admin**: bcrypt hash
- **Admin role**: `superadmin` (full), `admin`/`auditor` (filter group)
- **Customer password**: kosong (gak bisa login web)
- **CORS**: Allow all origins (development)
- **Path traversal**: Tidak ada file upload/read
- **RADIUS secret**: Shared secret per router, disimpan plain di `routers.secret`

---

## 🐞 Error Handling Pattern

Backend selalu return JSON:
```json
{ "data": [...] }        # Success
{ "error": "message" }   # Error
{ "data": {...} }        # Single item
{ "message": "..." }     # Success message (delete etc)
```

Status codes: 200, 201 (create), 400 (validation), 403 (forbidden), 404 (not found)

Frontend: toast notifications via PrimeVue Toast + redirect on success.

---

## 🚀 Docker Commands Cepat

```bash
# Full rebuild + start
docker compose up -d --build

# Start
docker compose up -d

# Stop
docker compose down

# Restart service
docker compose restart <service>

# Rebuild + restart 1 service
docker compose up -d --build <service>

# Logs follow
docker compose logs -f

# Hapus semua + volume (⚠️ data hilang)
docker compose down -v
```

---

## 📐 Service Port Reference

| Port | Service | Protocol |
|------|---------|----------|
| 8090 | Backend API | HTTP |
| 8091 | Frontend UI | HTTP |
| 3306 | MariaDB | MySQL |
| 1812 | RADIUS Auth | UDP |
| 1813 | RADIUS Accounting | UDP |
| 3000 | OpenWA API | HTTP |
| 3001 | OpenWA Dashboard | HTTP |

---

## 📝 Catatan

- **Durasi paket** ditentukan pas aktivasi per pelanggan, bukan di paket
- **billing_date** = tanggal tagihan (1-31), bisa di set per subscription
- **Maps** pake OpenStreetMap + Leaflet (no API key needed)
- **Freeradius** restart loop sementara masih ada, tapi auth jalan
- **Auto-generate username/password** untuk customer udah dihapus — pake UID aja
- **Username PPPoE + Password PPPoE** wajib diisi kalo pilih paket

---

## 📲 WhatsApp Gateway (OpenWA)

### Container Architecture

```
┌────────────────────────┐      HTTP /api/sendText
│   Billing Backend       │─────────────────────────┐
│   (PHP, port 8090)      │                         │
│                         │   POST /api/wa/test     │
│  TransactionController  │   POST /transactions/   │
│  → sendWa()            │       {id}/send-wa      │
└────────────────────────┘                         │
                                                   ▼
┌──────────────────────────────────────────────────────┐
│                    OpenWA                             │
│  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │  API (Node.js)      │  │  Dashboard (nginx)     │ │
│  │  port 3000          │  │  port 3001             │ │
│  │  NestJS + Puppeteer │  │  React SPA             │ │
│  └─────────┬───────────┘  │  → proxy /api ->       │ │
│            │              │    openwa:2785         │ │
│            ▼              └────────────────────────┘ │
│  ┌──────────────────┐                                 │
│  │  Chromium        │  ┌────────────────────┐        │
│  │  (WhatsApp Web)  │  │  data/ (.api-key,  │        │
│  │  headless mode   │  │  sessions, db)     │        │
│  └──────────────────┘  └────────────────────┘        │
└──────────────────────────────────────────────────────┘
```

### Cara Deploy OpenWA

OpenWA berjalan di container terpisah, join network `bill-net` yang sama.

**1. Clone & setup**

```bash
cd ~/billing
mkdir -p openwa/data openwa/dashboard
# OpenWA source ada di direktori openwa/
# (clone dari https://github.com/Calanca/OpenWA-Dev)
```

**2. Build & start**

```bash
cd ~/billing/openwa
docker compose -f docker-compose-custom.yml build
docker compose -f docker-compose-custom.yml up -d
```

**3. Cek status**

```bash
docker ps --filter name=openwa
curl http://10.10.33.52:3000/api/health
# → {"status":"ok",...}
```

### Setup di Billing

**1. Dapatkan API Key**

```bash
docker exec openwa cat /app/data/.api-key
# → owa_k1_<random_hex>
```

**2. Buka Settings > WA Setting di billing UI**

| Field | Value |
|-------|-------|
| API URL | `http://10.10.33.52:3000` |
| API Key | `owa_k1_...` (dari langkah 1) |
| Session | `default` |

**3. Scan QR**

1. Buka `http://10.10.33.52:3001` di browser
2. Login pake API key di atas
3. Klik **Start New Session** → scan QR pake HP
4. Status jadi Connected

**4. Test kirim**

- Di **WA Setting**, isi no HP + pesan, klik **Test Kirim**
- Atau dari halaman **Tagihan** → klik tombol WA per baris

### Format Invoice WA

```
*INVOICE - U-One Radius*

Halo {nama},

Tagihan periode ini:
No Invoice : INV-{bulan}/{tahun}/{id}
Paket      : {nama paket}
Total      : Rp {jumlah}
Status     : BELUM DIBAYAR
Jatuh Tempo: {tanggal}

Bayar via:
💰 Transfer Bank
🏧 QRIS

Terima kasih,
Tim U-One Radius
```

### Error Handling

- `Konfigurasi WA Gateway belum diatur` → isi API URL & Key di Settings
- `Invalid API key` → pastikan API key sesuai (`docker exec openwa cat /app/data/.api-key`)
- `Cannot find session` → session belum di-start, scan QR dulu
- `Not connected` → WA belum terhubung, buka dashboard dan scan QR

### Phone Number Format

Input `08xxx` → otomatis jadi `628xxx` sebelum dikirim ke WA gateway.

---

## 🛠️ Tutorial OpenWA Lengkap

### 1. Clone Repo

```bash
cd ~/billing
git clone https://github.com/Calanca/OpenWA-Dev.git openwa-source
mv openwa-source/* openwa/
rm -rf openwa-source
```

### 2. Konfigurasi

File `openwa/.env`:

```
NODE_ENV=production
STORAGE_TYPE=sqlite
HOST=0.0.0.0
PORT=2785
CORS=true
```

Custom compose (`openwa/docker-compose-custom.yml`):

```yaml
services:
  openwa-api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: openwa
    restart: unless-stopped
    ports:
      - "3000:2785"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    networks:
      - bill-net

  openwa-dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    container_name: openwa-dashboard
    restart: unless-stopped
    ports:
      - "3001:80"
    depends_on:
      - openwa-api
    networks:
      - bill-net

networks:
  bill-net:
    external: true
    name: billing_bill-net

volumes:
  openwa-data:
```

### 3. Build & Start

```bash
cd ~/billing/openwa
docker compose -f docker-compose-custom.yml build
docker compose -f docker-compose-custom.yml up -d
```

### 4. Dapatkan API Key

```bash
docker exec openwa cat /app/data/.api-key
# → owa_k1_...
```

### 5. Akses Dashboard

- URL: `http://<ip-server>:3001`
- Login: paste API key".
- Start new session, scan QR via HP WhatsApp

### 6. Kirim Pesan via API

```bash
curl -X POST http://<ip-server>:3000/api/sendText \
  -H "X-API-Key: owa_k1_..." \
  -H "Content-Type: application/json" \
  -d '{
    "session": "default",
    "to": "628123456789",
    "text": "Test dari OpenWA"
  }'
```

### Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Build hang/Chrome install lama | Gunakan `--no-install-recommends` di apt-get, pake `ghcr.io/puppeteer/puppeteer` base image |
| 404 di root (`/`) | Dashboard belum di-deploy, deploy service dashboard |
| 401 Unauthorized | API key salah, ambil ulang dari container |
| Session not found | Belum start session di dashboard |
| "Not connected" | QR belum di-scan, scan dari dashboard |
| Chrome crash | Kurang shared memory, tambah `--shm-size=1gb` |
