# Changelog

## v0.4.0-dev (2026-06-09)

### Added
- **WA Multi-Provider Gateway** — `WaAdapter` abstraction layer for 5 providers: OpenWA, Fonnte, Wablas, Twilio, WA Business API. FE dropdown + dynamic fields.
- **Multi-User Admin Management** — `AdminUserController` (CRUD), FE page `/admin-users` (superadmin only). Roles: superadmin, admin, auditor.
- **Role Teknisi** — read-only except tickets (can update status/solution/assigned_to, group-scoped).
- **Activity Log** — `LogController`, FE page, group filter, action/user/date params.
- **6 Fitur Baru:**
  1. Profile & Ganti Password (`ProfileController`, `/profile`)
  2. Payment Recording Modal (Bayar button, method dropdown, note)
  3. Export CSV (transactions + customers)
  4. Manual Isolir UI (toggle removes/restores radcheck/radreply)
  5. Auto-geocode (Nominatim on address blur, `countrycodes=id`)
  6. Pagination (server-side page/limit, FE Prev/Next)
- **Infrastruktur Map** — ODC, ODP, cable_routes tables + Leaflet map (red router, blue ODC, green ODP markers, polyline per cable type). CRUD tables + dialogs. Sidebar menu.

### Fixed
- **UI/UX overhaul** — dark mode default, contrast improved (text shade -400), NaN → "—", mobile 2-col grid, smaller padding, empty state icons.
- **Settings page** — fixed `e.reduce is not a function` error (API returns object, not array).
- **Navbar** — `user?.name` → `user?.fullname` for greeting.
- **Login** — fixed broken bcrypt hash (`$` stripped by shell).
- **Logs merged** — Activity Log + RADIUS Log into single `/logs` page with tabs.

### Changed
- Sidebar: "Activity Log" + "Radius" → merged into "Logs" menu item.
- Sidebar: all menus role-conditional (superadmin sees everything).
- FreeRADIUS: TLS config commented out, SQL dialect set to mysql, docker-net client added.
- `:root` CSS uses dark theme colors (default dark mode).

### Infrastructure
- Docker Compose: OpenWA removed (external). Stale bind volumes cleaned up.
- Frontend: React 19 rewrite (from Vue 3). Tailwind v4 + shadcn/ui.

---

## v0.3.0-dev (2026-06-09)

### Changed
- **Frontend rewrite:** Vue 3 + PrimeVue + Tailwind v3 → **React 19 + TypeScript + Tailwind v4 + shadcn/ui**
  - Vite, Zustand, React Router v6, Recharts, Lucide icons
  - Login: glassmorphism dark gradient
  - Dashboard: Recharts BarChart + AreaChart
  - All shadcn/ui components — Button, Card, Badge, Input, Select, Dialog, Table, Tabs
  - Docker build simplified (build local, copy dist to nginx)
  - Deployed on port 8091

---

## v0.2.2-dev (2026-06-09)

### Fixed
- **FreeRADIUS startup** — rewrite sed ke pipe method biar gak double-patch pas re-run container
- **TLS config** — comment ca_file/ca_path/certificate_file/private_key_file (gak ada di container)
- **SQL module** — set `dialect = mysql`, `driver = rlm_sql_mysql`, `read_clients = yes`
- **Default site** — enable sql & auth_log di `sites-enabled/default`
- **Docker network client** — tambah `docker-net` (192.168.176.0/24) di clients.conf
- **docker-compose.yml** — hapus bind volume `site-enabled/default` yg stale (mencegah bentrok)

---

## v0.2.0-dev (2026-06-05)

### Added
- **WhatsApp Gateway Integration** — OpenWA container alongside billing stack
  - `WaController` — test send endpoint `POST /api/wa/test`
  - `TransactionController::sendWa` — `POST /api/transactions/{id}/send-wa`
  - `WaSettings.vue` — halaman konfigurasi
  - Tombol WA send per baris tagihan
- **WA Setting menu** di sidebar (route `/settings/wa`)
- Link **Buka Dashboard OpenWA** di halaman WA Setting

### Fixed
- **Sidebar double-highlight** — `/settings` dan `/settings/wa` highlight masing-masing
- **WA auth header** — ganti dari `Authorization: Bearer` ke `X-API-Key`

### Changed
- `.gitignore` — exclude `openwa/` directory

---

## v0.1.0-dev (2026-06-04)

### Added
- Initial release — billing ISP management system
- Pelanggan CRUD, Paket & Pool, Router, Group management
- Aktivasi langganan + auto sync ke radcheck/radreply
- Tagihan & invoice PDF
- Auto isolir pelanggan expired
- Status Online & Log Radius (RADIUS accounting)
- Tiket gangguan
- Multi-level admin (superadmin, admin)
- Dashboard stats
- Leaflet map for customer locations
