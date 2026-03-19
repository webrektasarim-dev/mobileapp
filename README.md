# E-Ticaret Monorepo (Flutter + NestJS + Admin)

Plan: [docs/STACK_DECISION.md](docs/STACK_DECISION.md) · [OpenAPI](docs/openapi-v1.yaml) · [Sipariş/ödeme durumları](docs/order-payment-state-machine.md)

## Gereksinimler

- Node 20+
- **MySQL 8** (Hostinger veya Docker: `docker compose up -d mysql`)
- Redis isteğe bağlı (`REDIS_DISABLED=true` ile kapalı)
- Flutter SDK (mobil geliştirme için)

**Hostinger önce API:** [docs/HOSTINGER_BACKEND_KURULUM.md](docs/HOSTINGER_BACKEND_KURULUM.md) · Tam akış: [HOSTINGER_BASLANGIC.md](docs/HOSTINGER_BASLANGIC.md)

## Hızlı başlangıç

```bash
# 1. MySQL (yerel)
docker compose up -d mysql

# 2. Backend
cd backend
cp .env.example .env
# DATABASE_URL=mysql://ecommerce:ecommerce@127.0.0.1:3306/ecommerce
# REDIS_DISABLED=true
npx prisma migrate deploy
npm run db:seed
npm run start:dev
# API: http://localhost:3000/api/v1

# 3. Admin panel
cd ../admin
cp .env.example .env
npm run dev
# Varsayılan admin: admin@example.com / admin123

# 4. Mobil
cd ../mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:3000/api/v1
```

## Klasörler

| Dizin | Açıklama |
|-------|----------|
| `backend/` | NestJS REST API, Prisma, BullMQ (ödeme reconcile) |
| `mobile/` | Flutter (Riverpod, Dio, go_router) |
| `admin/` | Vite + React admin MVP |
| `docs/` | Stack, OpenAPI, durum makinesi |

## Ödeme webhook (test)

`POST /api/v1/webhooks/payments/shopier`  
Body örnek: `{ "orderId": "<uuid>", "externalId": "ext-1", "success": true }`

## Lisans

Özel proje.
