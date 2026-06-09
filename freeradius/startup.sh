#!/bin/bash
# FreeRADIUS startup script — generate patched config via pipe
set -e

SQL_CONF=/etc/freeradius/mods-available/sql
SITE=/etc/freeradius/sites-enabled/default

echo "Patching SQL config..."

# Generate patched version — pipe method (reliable)
sed \
  -e 's|^[[:space:]]*dialect = "sqlite"|        dialect = "mysql"|' \
  -e 's|^[[:space:]]*driver = "rlm_sql_null"|        driver = "rlm_sql_mysql"|' \
  -e 's|^#\s*server\s*=\s*"localhost"|        server = "db"|' \
  -e 's|^#\s*port\s*=\s*3306|        port = 3306|' \
  -e 's|^#\s*login\s*=\s*"radius"|        login = "billing"|' \
  -e 's|^#\s*password\s*=\s*"radpass"|        password = "changeme"|' \
  -e 's|^[[:space:]]*radius_db = "radius"|        radius_db = "billing"|' \
  -e 's|^\s*#\s*read_clients\s*=\s*yes|        read_clients = yes|' \
  "$SQL_CONF" > /tmp/sql-patched.conf

# Comment TLS lines in mysql block (files don't exist in container)
sed -i '/^\tmysql {/,/^\t}/{
  /ca_file/ s/^/#/
  /ca_path/ s/^/#/
  /certificate_file/ s/^/#/
  /private_key_file/ s/^/#/
}' /tmp/sql-patched.conf

# Add client_table = nas inside sql {} block
grep -q "client_table" /tmp/sql-patched.conf || \
  sed -i '/^sql {/a \\tclient_table = "nas"' /tmp/sql-patched.conf

# Replace original
cp /tmp/sql-patched.conf "$SQL_CONF"

# Enable sql module link
if [ ! -L /etc/freeradius/mods-enabled/sql ]; then
  ln -s "$SQL_CONF" /etc/freeradius/mods-enabled/sql
fi

echo "Patching default site..."
sed -i 's|#\s*-sql|-sql|g; s|#\s*-ldap|-ldap|g; s|#\s*auth_log|auth_log|g' "$SITE"

echo "Starting FreeRADIUS..."
exec /usr/sbin/freeradius -f
