# Sipariş ve Ödeme Durum Makinesi (V1)

## Sipariş (`orders.status`)

```
draft (opsiyonel internal)
  → pending_payment   (checkout tamamlandı, ödeme bekleniyor)
  → paid              (ödeme onaylandı)
  → processing        (hazırlanıyor)
  → shipped           (kargoya verildi)
  → delivered         (teslim)
  → cancelled         (sadece pending_payment öncesi veya admin)
```

**Geçiş kuralları:**

| Mevcut | Hedef | Tetikleyici |
|--------|--------|-------------|
| pending_payment | paid | Webhook/reconcile: payment success |
| pending_payment | cancelled | Süre aşımı (policy) veya admin |
| paid | processing | Admin veya otomatik |
| processing | shipped | Admin |
| shipped | delivered | Admin veya manuel |

## Ödeme (`orders.payment_status` + `payments.status`)

**payment_status (order üzerinde özet):**

- `pending` — ödeme başlatılmadı veya bekleniyor
- `authorized` — provizyon (POS senaryosu)
- `paid` — tahsilat tamam
- `failed` — red / hata
- `refunded` — V1 kısmi; admin işlemi

**payments kaydı:** Her deneme / provider referansı için satır; `external_id` UNIQUE (idempotent webhook).

## Idempotency

- `POST /orders` veya `POST /checkout/init`: header `Idempotency-Key` veya body `client_request_id`.
- Redis TTL 48 saat: aynı key → aynı `order_id` dönülür.

## Webhook iş akışı

1. Ham payload → `payment_events` (veya log tablosu) INSERT
2. İmza doğrulama
3. `external_id` ile daha önce işlendiyse **204 no-op**
4. Transaction: `payments` güncelle / insert → `orders` status + payment_status
5. Hata → BullMQ retry → DLQ

## Reconcile job

- `pending_payment` ve yaş > N dakika → provider API sorgula → yukarıdaki 3–4

## Manuel müdahale (admin)

- Sipariş ekranında: "Ödemeyi onayla" (çift kontrol) → audit log zorunlu.
