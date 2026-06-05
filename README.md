# U-One Radius

Billing ISP Management System — PHP + Vue 3 + Docker + FreeRADIUS

**Tech:** PHP 8.4 (Slim Framework) · Vue 3 · PrimeVue 4 · MariaDB 11 · FreeRADIUS · Docker

Status: **v0.1.0-dev** (masih pengembangan)

## Fitur

- 👥 Manajemen pelanggan + aktivasi paket
- 📦 Paket internet + IP pool
- 🖥️ Router MikroTik
- 💰 Tagihan dan invoice
- 📡 Status online user RADIUS
- 📋 Log radius (connect/disconnect)
- ⛔ Auto isolir pelanggan expired
- 🔑 Multi-level admin (superadmin, admin)
- 🗺️ Peta lokasi pelanggan (Leaflet)
- 🐳 Docker Compose — siap jalan

## Stack

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Frontend   │────▶│   Backend    │────▶│ MariaDB  │
│  (nginx)    │     │  (PHP 8.4)   │     │          │
│  port 8091  │     │  port 8090   │     │          │
└─────────────┘     └──────┬───────┘     └──────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────────┐  ┌──────────────┐
                    │   FreeRADIUS    │  │  radcheck    │
                    │  (1812-1813/udp)│  │  radacct     │
                    └─────────────────┘  └──────────────┘
```

## Cara Jalanin

```bash
git clone https://github.com/labsyuanx10-svg/U-One-Radius.git
cd U-One-Radius
docker compose up -d
```

Akses: `http://localhost:8091` — login: `admin` / `admin`

## Lisensi

Hak cipta pengembang. Belum ditentukan.
