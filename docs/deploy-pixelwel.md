# Deploy to pixelwel.com

Target: **ops.pixelwel.com** (API + SPA) or **halwot.pixelwel.com**.

## Recommended layout on PHP hosting

```text
public_html/ops/          # or subdomain document root
  public/                 # Laravel public (index.php + built SPA assets)
  ...                     # rest of Laravel app above web root when possible
```

Preferred VPS layout:

```text
/var/www/halwot-ops/
  apps/api/               # Laravel
  apps/web/dist/          # built SPA — served by Nginx or copied into api/public
```

## Build steps

1. On the server (or CI), set production `.env` with MySQL:

```env
APP_NAME="Halwot Ops"
APP_URL=https://ops.pixelwel.com
FRONTEND_URL=https://ops.pixelwel.com
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=halwot_ops
DB_USERNAME=...
DB_PASSWORD=...
SESSION_DOMAIN=.pixelwel.com
SANCTUM_STATEFUL_DOMAINS=ops.pixelwel.com
```

2. Install API:

```bash
cd apps/api
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
```

3. Build SPA and publish into Laravel `public`:

```bash
cd apps/web
npm ci
npm run build
# copy dist/* into apps/api/public/
# ensure index.html is served for SPA routes (fallback)
```

4. Point the subdomain document root at `apps/api/public`.

5. Ensure HTTPS, writable `storage/` and `bootstrap/cache/`.

## SPA routing

Configure the web server so unknown non-file routes fall back to `index.html` while `/api/*` hits Laravel.

## Notes

- Keep giving/finance modules off until Phase 3 and restrict by role.
- Rotate the seeded admin password immediately after first deploy.
