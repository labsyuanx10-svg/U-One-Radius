# Changelog

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
- **WhatsApp Gateway Integration** — OpenWA container (port 3000 API, port 3001 dashboard) alongside billing stack
  - `WaController` — test send endpoint `POST /api/wa/test`
  - `TransactionController::sendWa` — `POST /api/transactions/{id}/send-wa` untuk kirim invoice via WA
  - `WaSettings.vue` — halaman konfigurasi API URL, API Key, session name + test send
  - Tombol WA send per baris tagihan di `TransactionList.vue`
- **WA Setting menu** di sidebar (route `/settings/wa`)
- Link **Buka Dashboard OpenWA** di halaman WA Setting

### Fixed
- **Sidebar double-highlight** — `/settings` dan `/settings/wa` sekarang highlight masing-masing
- **WA auth header** — ganti dari `Authorization: Bearer` ke `X-API-Key` (sesuai OpenWA)

### Changed
- `.gitignore` — exclude `openwa/` directory (separate submodule)
- `DOCS.md` — dokumentasi form, DB, API, docker commands

### Infrastructure
- OpenWA (Calanca/OpenWA-Dev) deployed as Docker container on `bill-net` network
  - API: port 3000
  - Dashboard: port 3001 (nginx, proxy ke openwa:2785)
  - SQLite storage, bind mount ke `./data/`
  - API key persist in volume (`/app/data/.api-key`)

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
- Peta lokasi pelanggan
