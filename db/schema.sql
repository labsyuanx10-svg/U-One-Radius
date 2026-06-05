-- ============================================================
-- Billing ISP - Database Schema (Fase 1 - Final)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Groups (Cabang / Divisi) ──
CREATE TABLE `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(128),
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Users (Admin, Auditor, nanti Customer) ──
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(20) NOT NULL UNIQUE COMMENT 'Customer UID, e.g. C0001',
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(128) DEFAULT '' COMMENT 'Email customer',
    nik VARCHAR(20) DEFAULT '' COMMENT 'No KTP',
    phone VARCHAR(20) DEFAULT '',
    address TEXT,
    village VARCHAR(100) DEFAULT '' COMMENT 'Desa/Kelurahan',
    district VARCHAR(100) DEFAULT '' COMMENT 'Kecamatan',
    city VARCHAR(100) DEFAULT '' COMMENT 'Kota/Kabupaten',
    coordinates VARCHAR(50) DEFAULT '' COMMENT 'lat,lng for maps',
    device_merk VARCHAR(100) DEFAULT '' COMMENT 'Perangkat/ONT Merk',
    device_serial VARCHAR(100) DEFAULT '' COMMENT 'Perangkat/ONT Serial',
    role ENUM('superadmin','admin','auditor','customer') NOT NULL DEFAULT 'customer',
    group_id INT DEFAULT NULL,
    status ENUM('active','isolir','expired','disabled') NOT NULL DEFAULT 'active',
    notes TEXT,
    created_by INT DEFAULT NULL,
    last_login DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_group (group_id),
    INDEX idx_uid (uid),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Plans (Paket Internet, tanpa durasi) ──
CREATE TABLE plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('hotspot','pppoe','vpn','others') NOT NULL DEFAULT 'hotspot',
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    bandwidth_download INT NOT NULL DEFAULT 0 COMMENT 'Kbps',
    bandwidth_upload INT NOT NULL DEFAULT 0 COMMENT 'Kbps',
    burst_download INT DEFAULT 0 COMMENT 'Kbps',
    burst_upload INT DEFAULT 0 COMMENT 'Kbps',
    burst_time INT DEFAULT 0 COMMENT 'seconds',
    ip_pool_id INT DEFAULT NULL,
    shared_users INT DEFAULT 1,
    description TEXT,
    group_id INT DEFAULT NULL COMMENT 'NULL=global, INT=spesifik group',
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_group (group_id),
    INDEX idx_status (status),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL,
    FOREIGN KEY (ip_pool_id) REFERENCES ip_pools(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── IP Pools ──
CREATE TABLE ip_pools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    range_ip VARCHAR(200) NOT NULL COMMENT 'e.g. 192.168.1.2-192.168.1.254',
    gateway VARCHAR(20) DEFAULT '',
    dns1 VARCHAR(20) DEFAULT '',
    dns2 VARCHAR(20) DEFAULT '',
    router_id INT DEFAULT NULL,
    group_id INT DEFAULT NULL COMMENT 'NULL=global, INT=spesifik group',
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_group (group_id),
    INDEX idx_router (router_id),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL,
    FOREIGN KEY (router_id) REFERENCES routers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Routers (cuma IP + RADIUS secret) ──
CREATE TABLE routers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    secret VARCHAR(100) NOT NULL COMMENT 'RADIUS shared secret',
    type ENUM('hotspot','pppoe') NOT NULL DEFAULT 'pppoe',
    group_id INT NOT NULL,
    description TEXT,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_group (group_id),
    INDEX idx_status (status),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Subscriptions (Aktivasi Pelanggan) ──
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    router_id INT NOT NULL,
    ip_address VARCHAR(50) DEFAULT '',
    username_radius VARCHAR(64) NOT NULL COMMENT 'RADIUS username',
    password_radius VARCHAR(100) NOT NULL COMMENT 'RADIUS password',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at DATETIME NOT NULL,
    billing_date TINYINT DEFAULT NULL COMMENT 'Tanggal tagihan 1-31',
    status ENUM('active','expired','suspended','cancelled') NOT NULL DEFAULT 'active',
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_expired (expired_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id),
    FOREIGN KEY (router_id) REFERENCES routers(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Transactions (Tagihan) ──
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    subscription_id INT DEFAULT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    bill_type ENUM('subscription','renewal','topup') NOT NULL DEFAULT 'subscription',
    status ENUM('unpaid','paid','cancelled') NOT NULL DEFAULT 'unpaid',
    paid_at DATETIME DEFAULT NULL,
    paid_by INT DEFAULT NULL COMMENT 'admin yg centang lunas',
    payment_method VARCHAR(50) DEFAULT 'manual',
    payment_note TEXT,
    due_date DATE DEFAULT NULL,
    billing_date TINYINT DEFAULT NULL COMMENT 'Tanggal tagihan 1-31',
    period_start DATE DEFAULT NULL,
    period_end DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_due (due_date),
    INDEX idx_invoice (invoice_no),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tickets (Gangguan) ──
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_no VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    category ENUM('jaringan','perangkat','billing','lainnya') NOT NULL DEFAULT 'jaringan',
    priority ENUM('rendah','sedang','urgent') NOT NULL DEFAULT 'sedang',
    status ENUM('baru','diproses','selesai','ditolak') NOT NULL DEFAULT 'baru',
    description TEXT NOT NULL,
    solution TEXT,
    assigned_to INT DEFAULT NULL,
    created_by INT NOT NULL,
    closed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Logs ──
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Settings ──
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    category VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── RADIUS tables ──
CREATE TABLE IF NOT EXISTS nas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nasname VARCHAR(128) NOT NULL,
    shortname VARCHAR(32),
    type VARCHAR(30) DEFAULT 'other',
    ports INT DEFAULT NULL,
    secret VARCHAR(60) NOT NULL DEFAULT 'testing123',
    server VARCHAR(64),
    community VARCHAR(50),
    description VARCHAR(200) DEFAULT 'RADIUS Client',
    UNIQUE KEY nasname (nasname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS radcheck (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL DEFAULT '',
    attribute VARCHAR(64) NOT NULL DEFAULT '',
    op CHAR(2) NOT NULL DEFAULT '==',
    value VARCHAR(253) NOT NULL DEFAULT '',
    KEY username (username(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS radreply (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL DEFAULT '',
    attribute VARCHAR(64) NOT NULL DEFAULT '',
    op CHAR(2) NOT NULL DEFAULT '=',
    value VARCHAR(253) NOT NULL DEFAULT '',
    KEY username (username(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS radacct (
    radacctid BIGINT AUTO_INCREMENT PRIMARY KEY,
    acctsessionid VARCHAR(64) NOT NULL DEFAULT '',
    acctuniqueid VARCHAR(32) NOT NULL DEFAULT '',
    username VARCHAR(64) NOT NULL DEFAULT '',
    groupname VARCHAR(64) DEFAULT '',
    realm VARCHAR(64) DEFAULT '',
    nasipaddress VARCHAR(15) NOT NULL DEFAULT '',
    nasportid VARCHAR(15) DEFAULT NULL,
    nasporttype VARCHAR(32) DEFAULT NULL,
    acctstarttime DATETIME DEFAULT NULL,
    acctupdatetime DATETIME DEFAULT NULL,
    acctstoptime DATETIME DEFAULT NULL,
    acctinterval INT DEFAULT NULL,
    acctsessiontime INT UNSIGNED DEFAULT NULL,
    acctauthentic VARCHAR(32) DEFAULT NULL,
    connectinfo_start VARCHAR(128) DEFAULT NULL,
    connectinfo_stop VARCHAR(128) DEFAULT NULL,
    acctinputoctets BIGINT DEFAULT NULL,
    acctoutputoctets BIGINT DEFAULT NULL,
    calledstationid VARCHAR(50) NOT NULL DEFAULT '',
    callingstationid VARCHAR(50) NOT NULL DEFAULT '',
    acctterminatecause VARCHAR(32) NOT NULL DEFAULT '',
    servicetype VARCHAR(32) DEFAULT NULL,
    framedprotocol VARCHAR(32) DEFAULT NULL,
    framedipaddress VARCHAR(15) NOT NULL DEFAULT '',
    KEY username (username),
    KEY acctstarttime (acctstarttime),
    KEY acctstoptime (acctstoptime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Seed Data
-- ============================================================

-- Default superadmin (password: admin)
INSERT INTO users (uid, username, password, fullname, role, status) VALUES
('A0001', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'superadmin', 'active');

-- Default settings
INSERT INTO settings (`key`, value, category) VALUES
('app_name',      'NetFlow ISP',     'general'),
('currency',      'Rp',              'general'),
('timezone',      'Asia/Jakarta',    'general'),
('uid_prefix',    'C',               'uid_format'),
('uid_digits',    '4',               'uid_format'),
('auto_isolir',   '1',               'isolir'),
('isolir_method', 'disable',         'isolir'),
('isolir_plan_id','',                'isolir'),
('cron_schedule', '0 0 * * *',       'isolir'),
('invoice_header','NetFlow ISP',     'invoice'),
('invoice_address','Jl. Raya No.123, Bandung', 'invoice'),
('invoice_footer','Terima Kasih',   'invoice'),
('invoice_show_ppn','1',            'invoice'),
('ppn_percent',   '11',              'invoice'),
('bank_name',     'BCA',             'payment'),
('bank_account',  '1234567890',      'payment'),
('bank_holder',   'NetFlow ISP',     'payment'),
('notif_template_paid', 'Halo {nama}, pembayaran tagihan {paket} sebesar Rp{jumlah} telah diterima. Terima kasih.', 'notification'),
('notif_template_unpaid', 'Halo {nama}, tagihan {paket} sebesar Rp{jumlah} jatuh tempo pada {jatuh_tempo}. Segera lakukan pembayaran.', 'notification'),
('notif_template_isolir', 'Halo {nama}, akun Anda telah diisolir karena tagihan jatuh tempo. Hubungi admin untuk aktivasi kembali.', 'notification');

-- Default group
INSERT INTO `groups` (code, name, address, phone, email) VALUES
('PST', 'Pusat', 'Jl. Raya No.123, Bandung', '022-1234567', 'pusat@netflow.id');

SET FOREIGN_KEY_CHECKS = 1;
