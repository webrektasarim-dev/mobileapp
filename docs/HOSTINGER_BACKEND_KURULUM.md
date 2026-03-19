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

Repo GitHub’da olmalı (örn. `webrektasarim-dev/mobileapp`). Kod güncel olsun (kök `package.json` + `backend/` klasörü).

---

## 3. Hostinger’da Node.js uygulaması (sadece API)

1. **Websites** → **Node.js** (veya benzeri) → **Uygulama oluştur / Ekle**.
2. **Git repository** bağla → dal: **`main`**.
3. **Kök dizin (Root / Application root):**  
   - **Seçenek A (önerilen):** Boş / **repo kökü** — `mobileapp` kökünde hem `package.json` hem `backend` görünür.  
   - **Seçenek B:** Kök dizin **`backend`**.
4. **Node sürümü:** 20.x veya 22.x.
5. **Framework:** NestJS seçilebiliyorsa seç; asıl önemli build komutu.

### Derleme (Build)

| Kök dizin | Derleme komutu |
|-----------|----------------|
| **Repo kökü** | `npm run build` |
| **backend** | `npm install && npm run build` |

Panelde **`tsc`** tek başına veya **`nest build`** zorunlu değil; yukarıdaki yeterli.

### Başlatma (Start)

| Kök dizin | Start komutu |
|-----------|--------------|
| **Repo kökü** | `npm run start --prefix backend` |
| **backend** | `npm run start:prod` veya `node dist/main.js` |

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
| Build hatası (`tsc` vb.) | Kök + build komutunu §3 tablosuna göre kontrol et; repo’yu push et. |
| 502 / uygulama düşüyor | `DATABASE_URL` host doğru mu? `PORT` panel ile aynı mı? Logları Hostinger’da aç. |
| Migration hata | `backend` klasöründe olduğundan emin ol; `DATABASE_URL` ile MySQL’e bağlanabildiğini doğrula. |

---

Backend bu adımlarla tamam. Sonra **admin** kurulumu için: [HOSTINGER_BASLANGIC.md](./HOSTINGER_BASLANGIC.md) → Adım 3.
