# Hostinger — Önce sadece backend (API) kurulumu

Admin ve mobil **sonra** bağlanır. Bu dokümanda yalnızca **REST API** ayağa kalkar.

---

## 1. MySQL hazırla

1. **hPanel** → **Veritabanları** → **MySQL**.
2. Yeni veritabanı + kullanıcı oluştur; kullanıcıya bu veritabanında **tüm yetkiler**.
3. Not al:
   - **Host** (çoğu zaman `localhost`; panelde başka yazıyorsa onu kullan)
   - **Veritabanı adı**
   - **Kullanıcı adı**
   - **Şifre**
   - Port: `3306`

**DATABASE_URL** (tek satır):

```text
mysql://KULLANICI:SIFRE@HOST:3306/VERITABANI
```

---

## 2. GitHub

- **Monorepo (`mobileapp`):** Admin + mobil + backend aynı repoda ise Hostinger bazen **“desteklenmeyen framework”** verir (repoda birden fazla Node/Flutter projesi taranıyor).  
  → **Önerilen:** API’yi ayrı repoya taşıyın → **[HOSTINGER_BACKEND_AYRI_REPO.md](./HOSTINGER_BACKEND_AYRI_REPO.md)** (5 dakikada kurulur).
- Tek repoda denemek istiyorsanız kod güncel olsun; kök veya `backend` kök dizinini deneyin (aşağıda).

---

## 3. Hostinger’da Node.js uygulaması (sadece API)

1. **Websites** → **Node.js** (veya benzeri) → **Uygulama oluştur / Ekle**.
2. **Git repository** bağla → dal: **`main`**.
3. **Kök dizin (Root / Application root):**  
   - **Seçenek A:** **Repo kökü** (boş / `.`) — kökte `package.json`, `nest-cli.json` ve `backend/` vardır; Hostinger “NestJS” olarak tanır.  
   - **Seçenek B:** Hâlâ “desteklenmeyen framework” diyorsa kök dizini **`backend`** yapın (içinde `nest-cli.json`, `src/`, `package.json`).
4. **Node sürümü:** 20.x veya 22.x.
5. **Framework:** NestJS seçilebiliyorsa seç; asıl önemli build komutu.

### Derleme (Build)

**Repo kökü (`./`) + monorepo:** Hostinger bazen yalnızca `npm install` çalıştırır; `build` script’i hiç çalışmaz → `backend/dist/main.js` oluşmaz. Kök `package.json` içinde **`postinstall`** ile her `npm install` sonrası `backend` kurulur ve derlenir; bu yüzden **derleme komutu boş veya `npm install` bile olsa** API derlenir.

| Kök dizin | Derleme komutu (panel) |
|-----------|------------------------|
| **Repo kökü** | `npm install` **veya** `npm run build` (ikisi de backend’i derler) |
| **backend** (ayrı repo) | `npm install && npm run build` |

Çıktı / giriş: **Output dir ve entry’yi boş bırakın** veya start komutunu kullanın; Nest çıktısı `backend/dist/`.

### Başlatma (Start)

| Kök dizin | Start komutu |
|-----------|--------------|
| **Repo kökü** | **`npm run start:prod`** veya **`node scripts/hostinger-start.cjs`** — `dist` yoksa önce derler. **`node backend/dist/main.js` kullanmayın** (Hostinger bazen derlemeyi atlar). |
| **backend** (ayrı repo) | `npm run start:prod` veya `node dist/main.js` |

**Node sürümü:** Sorun devam ederse panelde **18.x** deneyin.

---

## 4. Ortam değişkenleri (Environment variables)

Bu **API uygulamasının** Environment bölümüne ekle:

| Anahtar | Örnek / açıklama |
|---------|------------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Adım 1’deki MySQL URL |
| `JWT_SECRET` | Uzun rastgele dize (min ~32 karakter) |
| `JWT_REFRESH_SECRET` | JWT_SECRET’ten **farklı** uzun dize |
| `REDIS_DISABLED` | `true` |
| `PORT` | Panelin verdiği port (çoğu zaman `3000` veya panelde yazan) |
| `CORS_ORIGIN` | **İlk kurulumda hiç ekleme** (tanımlı değilse API tarayıcıdan test için açık). Admin kurunca ekle: `https://admin-domainin.com` |

Kaydet → **Deploy**.

---

## 5. Veritabanı tabloları (bir kez, SSH veya terminal)

Deploy ve build başarılı olduktan sonra:

1. **hPanel** → **Gelişmiş** → **SSH Erişimi** (veya Web Terminal).
2. Sunucuda projenin **backend** klasörüne git (yol panelde / File Manager’da farklı olabilir), örnek:

```bash
cd ~/domains/ALANADI/public_html/.../backend
# veya deploy path — "backend" içinde prisma/ ve package.json olmalı
```

3. Çalıştır:

```bash
npx prisma migrate deploy
npm run db:seed
```

`db:seed` isteğe bağlı; admin panel girişi için örnek kullanıcı: `admin@example.com` / `admin123`.

---

## 6. API’nin çalıştığını kontrol et

Tarayıcıda (veya Postman):

```text
https://SENIN-API-DOMAIN/api/v1/categories
```

- JSON (boş dizi `[]` bile olsa) veya 200 → **API ayakta**.
- Domain: Hostinger’da bu Node uygulamasına verilen URL (geçici `*.hostingersite.com` olabilir).

**Tam API kökü:** `https://DOMAIN/api/v1` — bunu sonra admin’de `VITE_API_URL` ve mobilde `API_BASE_URL` olarak kullanacaksın.

---

## 7. Sorun giderme

| Durum | Ne yap |
|-------|--------|
| **Desteklenmeyen framework / geçersiz yapı** | Çoğu zaman **monorepo**: Hostinger tüm repoyu tarar. **Kesin çözüm:** [HOSTINGER_BACKEND_AYRI_REPO.md](./HOSTINGER_BACKEND_AYRI_REPO.md) — sadece `backend/` içeriğini ayrı GitHub reposuna itin, Hostinger’da o repoyu bağlayın. Ek olarak `backend/package.json` içinde `file:..` bağımlılığı kaldırıldı; kök dizin **`backend`** + Build `npm install && npm run build` deneyin. |
| Build hatası (`tsc` vb.) | Build: `npm run build` (kök) veya `backend` kökünde `npm install && npm run build`. |
| 502 / uygulama düşüyor | `DATABASE_URL` host doğru mu? `PORT` panel ile aynı mı? Logları Hostinger’da aç. |
| Migration hata | `backend` klasöründe olduğundan emin ol; `DATABASE_URL` ile MySQL’e bağlanabildiğini doğrula. |

---

Backend bu adımlarla tamam. Sonra **admin** kurulumu için: [HOSTINGER_BASLANGIC.md](./HOSTINGER_BASLANGIC.md) → Adım 3.
