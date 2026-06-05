#!/bin/bash
# Billing ISP - Management Script
# Usage: ./manage.sh [command]

COMPOSE_FILE="../docker-compose.yml"

case "${1:-help}" in
    start)
        echo "Starting all services..."
        docker compose -f $COMPOSE_FILE up -d
        echo "✅ Backend:  http://localhost:8090"
        echo "✅ Frontend: http://localhost:8091"
        echo "✅ RADIUS:   port 1812/1813"
        ;;
    stop)
        echo "Stopping all services..."
        docker compose -f $COMPOSE_FILE down
        ;;
    restart)
        echo "Restarting all services..."
        docker compose -f $COMPOSE_FILE down
        docker compose -f $COMPOSE_FILE up -d
        ;;
    rebuild)
        echo "Rebuilding and starting..."
        docker compose -f $COMPOSE_FILE down
        docker compose -f $COMPOSE_FILE build --no-cache
        docker compose -f $COMPOSE_FILE up -d
        ;;
    logs)
        docker compose -f $COMPOSE_FILE logs -f "${2:-backend}"
        ;;
    db)
        docker compose -f $COMPOSE_FILE exec db mariadb -u billing -pbilling billing
        ;;
    radius)
        docker compose -f $COMPOSE_FILE exec freeradius freeradius -C
        ;;
    status)
        docker compose -f $COMPOSE_FILE ps
        ;;
    seed)
        echo "Adding superadmin (admin/admin) if not exists..."
        docker compose -f $COMPOSE_FILE exec db mariadb -u billing -pbilling billing -e "
        INSERT IGNORE INTO users (uid, username, password, fullname, role, status)
        VALUES ('A0001', 'admin', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'superadmin', 'active');
        "
        ;;
    *)
        echo "Billing ISP Management"
        echo ""
        echo "Commands:"
        echo "  start     Start all containers"
        echo "  stop      Stop all containers"
        echo "  restart   Restart all containers"
        echo "  rebuild   Rebuild and start fresh"
        echo "  logs [svc] View logs (backend/frontend/db/freeradius)"
        echo "  db        Open MySQL console"
        echo "  radius    Test RADIUS config"
        echo "  status    Container status"
        echo "  seed      Seed default admin"
        ;;
esac
