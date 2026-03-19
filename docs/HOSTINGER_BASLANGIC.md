# Hostinger’da uygulamayı başlatma — adım adım

Bu projede **3 parça** var; Hostinger’a **ikisi** yüklenir, biri bilgisayarınızda kalır:

| Parça | Ne | Hostinger’a yüklenir mi? |
|-------|-----|---------------------------|
| **Backend (API)** | NestJS, MySQL, REST | **Evet** — ayrı Node.js uygulaması |
| **Admin panel** | Vite + React (yönetim arayüzü) | **Evet** — ayrı site / Node uygulaması |
| **Mobil uygulama** | Flutter (iOS/Android) | **Hayır** — telefonda çalışır; sadece API adresini bilir |

Aşağıdaki sırayı takip et.

---

## DİKKAT: İki ayrı uygulama — karıştırmayın

| | **Admin paneli** (`admin/`) | **API** (`backend/`) |
|---|------------------------------|----------------------|
| **Framework** | **Vite** veya **React** — **Next.js DEĞİL** | **NestJS** (veya özel build) |
| **Çıktı dizini** | **`dist`** | `dist` (backend derlemesi) |
| **YANLIŞ** | Next.js + çıktı `.next` → **bu projede yok, hata verir** | — |
| **DATABASE_URL / JWT** | **Buraya koymayın** — admin statik sitedir | **Buraya koyun** |
| **Zorunlu env** | Sadece **`VITE_API_URL`** (API adresiniz `/api/v1` ile) | `DATABASE_URL`, `JWT_*`, `REDIS_DISABLED`, `CORS_ORIGIN`, `PORT` |

Şu anki hatanız büyük ihtimalle: **admin** uygulamasında **Next.js** + **`.next`** seçili; proje **Vite** ve çıktı **`admin/dist`**.

---

## Adım 0: GitHub

Kodunuz GitHub’da olmalı (ör. `webrektasarim-dev/mobileapp`). Hostinger “Git’ten içe aktar” ile bu repoyu bağlayacak.

---

## Adım 1: MySQL veritabanı

1. **hPanel** → **Veritabanları** → **MySQL**.
2. Yeni veritabanı + kullanıcı oluşturun; kullanıcıya veritabanı üzerinde **tüm yetkileri** verin.
3. Şunları bir yere not edin:
   - **Sunucu (host):** Çoğu zaman `localhost` (Node.js uygulaması aynı Hostinger sunucusundaysa). Bazen panelde farklı host yazar — **orada ne yazıyorsa onu** kullanacaksınız.
   - **Veritabanı adı** (örn. `u830061040_mobileapp`)
   - **Kullanıcı adı**
   - **Şifre**
   - **Port:** genelde `3306`

**DATABASE_URL** formatı (tek satır, tırnak Hostinger’da genelde gerekmez):

```text
mysql://KULLANICI:SIFRE@HOST:3306/VERITABANI_ADI
```

Örnek (kendi bilgilerinizle değiştirin):

```text
mysql://u830061040_mobileapp:GUVENLI_SIFRE@localhost:3306/u830061040_mobileapp
```

Şifrede `@`, `#`, `%` varsa [URL encode](https://www.urlencoder.org/) gerekir.

---

## Adım 2: Backend (API) — ilk Node.js uygulaması

Bu, mobil uygulamanın ve admin panelinin konuştuğu **API**’dir.

### 2.1 Yeni Node.js uygulaması oluştur

- **Websites** → **Node.js** (veya benzeri) → **Uygulama ekle**.
- **GitHub** reposunu seçin, dal: **`main`**.
- **Kök dizin:**  
  - **Önerilen:** boş bırakın veya repo **kökü** (`mobileapp` — `package.json` ve `backend/` klasörünün olduğu yer).  
  - Alternatif: kök dizin **`backend`** (o zaman build komutu aşağıda B seçeneği).

### 2.2 Framework / derleme

- Framework **NestJS** seçilebiliyorsa seçin; asıl önemli olan **build komutu**.
- **Build (derleme) komutu** — şunlardan **birini** yazın:
  - **Kök dizin repo köküyse:** `npm run build`
  - **Kök dizin `backend` ise:** `npm install && npm run build`
- **Başlatma (start) komutu:**
  - Kök repo ise: `npm run start --prefix backend`  
    veya `cd backend && npm run start:prod` (panel izin veriyorsa)
  - Kök `backend` ise: `npm run start:prod` veya `node dist/main.js`

> Panelde sadece **`tsc`** yazıyorsa silin; yukarıdaki `npm run build` kullanılmalı.

### 2.3 Ortam değişkenleri (Environment variables) — API uygulaması

Hostinger’da bu uygulamanın **Environment variables** bölümüne **tek tek** ekleyin:

| Anahtar | Değer (açıklama) |
|---------|------------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Adım 1’deki MySQL bağlantı diziniz (tam satır). |
| `JWT_SECRET` | En az 32 karakter rastgele dize (PowerShell örneği: `openssl rand -base64 48` veya online password generator). |
| `JWT_REFRESH_SECRET` | JWT_SECRET’ten **farklı** başka uzun rastgele dize. |
| `REDIS_DISABLED` | `true` (Hostinger’da Redis yok varsayımı). |
| `PORT` | Panel size port verdiyse onu yazın; çoğu zaman `3000` veya panelin gösterdiği değer. |
| `CORS_ORIGIN` | Admin panelin **tam HTTPS adresi**. Birden fazlaysa virgülle, boşluksuz: `https://admin-xxx.hostingersite.com,https://siteniz.com` |

Kaydedin, deploy edin. Build başarılı olunca uygulama ayağa kalkar.

### 2.4 Veritabanı tablolarını oluşturma (bir kez)

API bir kez çalıştıktan / build olduktan sonra **SSH** veya Hostinger **Terminal / Run command** ile:

```bash
cd domains/SITENIZ/public_html/.../backend
# veya deploy klasörünüz neresiyse — backend içinde olmalısınız
npx prisma migrate deploy
npm run db:seed
```

(`db:seed` admin kullanıcısı ve örnek veri ekler: `admin@example.com` / `admin123` — üretimde şifreyi değiştirin.)

> SSH yolu panelden farklıdır; File Manager veya Hostinger dokümantasyonundan **backend** klasörünün tam yolunu bulun.

### 2.5 API adresiniz

Deploy sonrası Hostinger size bir URL verir, örneğin:

`https://api-xxx.hostingersite.com`

API’nin **base path**’i: **`/api/v1`**. Yani tam taban:

```text
https://SIZIN_API_DOMAIN/api/v1
```

Bunu not edin; admin ve mobil buna bağlanacak.

---

## Adım 3: Admin panel — ikinci uygulama

1. **Yeni** site / Node uygulaması oluşturun.
2. Repo: aynı GitHub, dal **`main`**, **kök dizin: `admin`**.
3. **Framework ön ayarı: `Vite`** seçin. **Next.js seçmeyin.**  
4. **Derleme komutu:** `npm install && npm run build` (veya sadece `npm run build`). Ekstra **`tsc`** adımı **eklemeyin** — build artık `node` ile Vite çalıştırıyor.  
5. **Çıktı dizini:** **`dist`** (`.next` değil).  
6. **Paket yöneticisi:** npm  

**Admin için ortam değişkenleri — sadece bunlar:**

| Anahtar | Değer |
|---------|--------|
| `NODE_ENV` | `production` (opsiyonel; build için) |
| **`VITE_API_URL`** | Backend API’nin tam adresi, örn. `https://SIZIN-API-SUBDOMAIN.hostingersite.com/api/v1` |

**Admin uygulamasından silin / eklemeyin:** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_DISABLED`, `PORT`, `CORS_ORIGIN` — bunlar **sadece API uygulamasında** olmalı.

> **`VITE_API_URL` olmadan** admin API’ye bağlanamaz. API’yi önce ayağa kaldırıp URL’yi buraya yazın.

Deploy sonrası admin URL’niz (örn. `https://lightcoral-xxx.hostingersite.com`) ile giriş yapın. İlk seed ile: **admin@example.com** / **admin123**.

**CORS:** API uygulamasındaki `CORS_ORIGIN` içinde bu admin adresinin de olması gerekir (Adım 2.3).

---

## Adım 4: Mobil uygulama (Flutter)

Hostinger’a **yüklenmez**. Bilgisayarda:

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=https://SIZIN_API_DOMAIN/api/v1
```

Release build’de de aynı `API_BASE_URL` kullanılır. Mağazaya çıkarken bu adresin **HTTPS** ve sabit domain olması iyi olur.

---

## Özet kontrol listesi

- [ ] MySQL oluşturuldu, `DATABASE_URL` doğru.
- [ ] **API** uygulaması: build `npm run build` (kök) veya `backend` içi komut; env’ler tanımlı.
- [ ] `prisma migrate deploy` + isteğe bağlı `db:seed` çalıştırıldı.
- [ ] API test: tarayıcıda `https://.../api/v1/categories` veya Postman ile basit GET.
- [ ] **Admin**: `VITE_API_URL=https://.../api/v1`, `CORS_ORIGIN`’de admin URL’si var.
- [ ] Mobil: `API_BASE_URL` aynı API tabanı.

---

## Sık sorunlar

| Sorun | Ne yapın |
|-------|----------|
| Build’de `tsc` bulunamadı | Build komutunu **`npm run build`** yapın (repo kökünden). `tsc` tek başına kullanmayın. |
| API 502 / çöküyor | `DATABASE_URL` host’u doğru mu? `PORT` panel ile uyumlu mu? Logları Hostinger panelinden açın. |
| Admin giriş / istek hatası | `VITE_API_URL` tam mı (`/api/v1` dahil)? `CORS_ORIGIN` admin domainini içeriyor mu? |
| Veritabanı boş | SSH’tan `npx prisma migrate deploy` çalıştırıldı mı? |

---

Daha teknik kısa notlar: [HOSTINGER.md](./HOSTINGER.md) · Ortam anahtarları özeti: [HOSTINGER_ENV_PANEL.md](./HOSTINGER_ENV_PANEL.md)
