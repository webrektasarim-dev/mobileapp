# E-Ticaret Mobil (Flutter)

## Gereksinimler

- Flutter SDK 3.2+
- `flutter pub get`

## Çalıştırma

```bash
cd mobile
flutter run --dart-define=API_BASE_URL=http://localhost:3000/api/v1
```

## Yapı

- `lib/core` — config, dio, secure storage, router, theme
- `lib/shared` — ortak widget/extension
- `lib/features/*` — `data` / `domain` / `presentation`

Örnek tamamlanan modüller: **auth**, **home** (iskelet). Diğer feature klasörleri backend ile birlikte genişletilir.

## ARB (çok dil)

`lib/l10n/*.arb` — projeye `flutter_localizations` + `generate: true` ekleyip `flutter gen-l10n` çalıştırın.
