# Teknik Stack Kararı (V1)

| Katman | Seçim | Gerekçe |
|--------|--------|---------|
| **Mobil** | Flutter 3.x | Tek kod tabanı, native his; plan gereği WebView yok |
| **Mobil state** | **Riverpod** (flutter_riverpod) | Compile-safe provider'lar, test edilebilirlik, modüler feature'lara uyum |
| **Mobil routing** | go_router | Declarative deep link / ödeme dönüş URL'leri |
| **Mobil HTTP** | dio | Interceptor (JWT refresh), timeout |
| **Mobil güvenli depolama** | flutter_secure_storage | Access/refresh token |
| **Backend** | **NestJS 10** (Node 20+) | Modüler monolith, REST, TypeScript ekosistemi, hızlı geliştirme |
| **ORM / migration** | **Prisma** | Şema tek kaynak, migration net, PostgreSQL ile uyum |
| **Veritabanı** | PostgreSQL 16 | ACID, plan E şeması |
| **Cache / rate limit / queue** | **Redis 7** + **BullMQ** | Idempotency TTL, rate limit, webhook retry, FCM job |
| **Admin panel** | **React 18 + Vite + TypeScript** | Hafif MVP; ayrı deploy, REST admin API |
| **Ödeme** | Shopier / sanal POS | Webhook + reconcile worker (backend içinde) |

## Alternatifler (reddedilme nedeni)

- **Bloc:** Eşdeğer; ekip Riverpod tercih ederse tek dosyada provider değişimi yeterli.
- **.NET / Go:** Güçlü; V1 için NestJS ile tek dil (TS) admin + API paylaşımı hız kazandırır.

## Repo düzeni

```
mobileapp/
  docs/           # OpenAPI, state machine, stack
  backend/        # NestJS API
  mobile/         # Flutter uygulama
  admin/          # Vite React admin
```
