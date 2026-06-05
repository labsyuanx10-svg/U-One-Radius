#!/bin/bash
# FreeRADIUS startup script with MySQL config patching

set -e

# Patch default sql.conf with our DB credentials
sed -i \
  -e "s|^.*server = .*|        server = \"db\"|" \
  -e "s|^.*port = .*|        port = 3306|" \
  -e "s|^.*login = .*|        login = \"billing\"|" \
  -e "s|^.*password = .*|        password = \"billing\"|" \
  -e "/ca_file\|ca_path\|certificate_file\|private_key_file/s/^/\\/* /" \
  -e "/ca_file\|ca_path\|certificate_file\|private_key_file/s/$/ *\\//" \
  -e "s|radius_db = \"radius\"|radius_db = \"billing\"|" \
  /etc/freeradius/mods-available/sql

# Link sql if not already enabled
if [ ! -L /etc/freeradius/mods-enabled/sql ]; then
  ln -s /etc/freeradius/mods-available/sql /etc/freeradius/mods-enabled/sql
fi

# Set read_clients = yes in sql config
sed -i 's/read_clients = no/read_clients = yes/' /etc/freeradius/mods-available/sql || true

# Add client_table = nas inside sql {} block if not present
grep -q "client_table" /etc/freeradius/mods-available/sql || \
  sed -i '/^sql {/a \\tclient_table = "nas"' /etc/freeradius/mods-available/sql

echo "Starting FreeRADIUS..."
exec /usr/sbin/freeradius -f
