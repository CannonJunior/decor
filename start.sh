#!/bin/bash

# Nest - Home Decor & Design Intelligence Platform
# Startup script: manages port, migrations, seeding, and cron for price monitoring

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PORT=3001

echo -e "${BLUE}🏠 Nest — Home Decor & Design Platform${NC}"
echo -e "${BLUE}=======================================${NC}\n"

# Check if port is in use
echo -e "${YELLOW}🔍 Checking if port ${PORT} is in use...${NC}"

port_pids() {
    lsof -ti TCP:${PORT} -s TCP:LISTEN 2>/dev/null \
        || ss -tlnp | awk -F'[=,]' "/[*:]${PORT} /{for(i=1;i<=NF;i++) if(\$i~/^pid$/) print \$(i+1)}" \
        || true
}

PID=$(port_pids)

if [ -n "$PID" ]; then
    echo -e "${YELLOW}⚠️  Found process on port ${PORT} (PID: ${PID})${NC}"
    kill $PID 2>/dev/null || true
    sleep 2
    if [ -n "$(port_pids)" ]; then
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
    if [ -n "$(port_pids)" ]; then
        echo -e "${RED}❌ Failed to free port ${PORT}${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Port ${PORT} is now free${NC}\n"
    fi
else
    echo -e "${GREEN}✅ Port ${PORT} is available${NC}\n"
fi

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npm run db:migrate
echo -e "${GREEN}✅ Database ready${NC}\n"

# Seed Style Wiki if empty
STYLE_COUNT=$(node -e "
const DB = require('better-sqlite3');
try { const db = new DB('nest.db'); console.log(db.prepare('SELECT COUNT(*) as n FROM style_wiki').get().n); db.close(); }
catch { console.log(0); }
" 2>/dev/null || echo "0")

if [ "$STYLE_COUNT" -lt 10 ]; then
    echo -e "${YELLOW}🎨 Seeding Style Wiki...${NC}"
    npm run seed:styles || true
    npm run seed:materials || true
    echo -e "${GREEN}✅ Style Wiki seeded${NC}\n"
else
    echo -e "${GREEN}✅ Style Wiki ready (${STYLE_COUNT} entries)${NC}\n"
fi

# Seed inspiration sources if empty
SOURCE_COUNT=$(node -e "
const DB = require('better-sqlite3');
try { const db = new DB('nest.db'); console.log(db.prepare('SELECT COUNT(*) as n FROM inspiration_sources').get().n); db.close(); }
catch { console.log(0); }
" 2>/dev/null || echo "0")

if [ "$SOURCE_COUNT" -lt 1 ]; then
    echo -e "${YELLOW}📰 Seeding inspiration sources...${NC}"
    npm run seed:sources || true
    echo -e "${GREEN}✅ Inspiration sources seeded${NC}\n"
else
    echo -e "${GREEN}✅ Inspiration sources ready (${SOURCE_COUNT} sources)${NC}\n"
fi

# Set up price check cron (every 6 hours)
echo -e "${YELLOW}⏰ Setting up price monitoring cron...${NC}"
(crontab -l 2>/dev/null | grep -v 'nest.*check-prices'; \
 echo "0 */6 * * * curl -s http://localhost:${PORT}/api/wishlist/check-prices > /dev/null 2>&1") | crontab -
echo -e "${GREEN}✅ Price monitoring cron set (every 6 hours)${NC}\n"

# Remove stale Next.js dev lock
rm -f .next/dev/lock

# Start the application
echo -e "${GREEN}🚀 Starting Nest on port ${PORT}...${NC}"
echo -e "${BLUE}=======================================${NC}\n"

npm run dev
