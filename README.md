# U-One Radius

Billing ISP Management System — multi-cabang, FreeRADIUS, infrastruktur mapping

**Tech:** PHP 8.4 (Slim 4) · React 19 + shadcn/ui · MariaDB 11 · FreeRADIUS · Docker

Status: **v0.4.0-dev**

## Fitur

- 👥 Manajemen pelanggan + aktivasi paket + auto-expired
- 📦 Paket internet + IP pool
- 🖥️ Router MikroTik (multi-cabang)
- 💰 Tagihan + invoice PDF + payment recording
- 📡 Status online user RADIUS + log auth
- 📲 WA Gateway — OpenWA, Fonnte, Wablas, Twilio, WA Business API
- ⛔ Manual isolir (toggle di detail pelanggan)
- 🗺️ Infrastruktur jaringan — ODC, ODP, cable routes + Leaflet map
- 📊 Dashboard stats + revenue chart (Recharts)
- 🐳 Docker Compose — siap jalan
- 🔑 Multi-role: superadmin, admin, teknisi, auditor
- 📋 Activity log + export CSV
- 📍 Auto-geocode dari alamat pelanggan
- 📄 Pagination di semua halaman utama

## Quick Start

```bash
git clone https://github.com/labsyuanx10-svg/U-One-Radius.git
cd U-One-Radius
docker compose up -d
```

Akses: `http://localhost:8091` — login: `admin` / `admin`

## Stack

```
┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  React 19    │────▶│   PHP 8.4    │────▶│ MariaDB  │
│  shadcn/ui   │     │  Slim 4      │     │  FreeRADIUS
│  Tailwind v4 │     │  Idiorm      │     │          │
│  port 8091   │     │  port 8090   │     │          │
└──────────────┘     └──────────────┘     └──────────┘
```

## Lihat Juga

- [Dokumentasi lengkap](DOCS.md)
- [Changelog](CHANGELOG.md)

## Lisensi

Hak cipta pengembang. Belum ditentukan.
