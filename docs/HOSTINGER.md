# Hostinger + Node.js (NestJS) + MySQL

## Hostinger ile uyumluluk

Hostinger’ın resmi **backend** listesinde **NestJS** yer alıyor; bu repodaki API tam olarak NestJS + Node.js tabanlıdır. Panelde Node.js uygulaması oluştururken framework olarak **NestJS** seçebilirsiniz (veya Express seçiliyorsa başlangıç komutunu yine `node dist/main.js` / `npm run start:prod` olacak şekilde ayarlayın).

**Frontend** tarafında Hostinger; Angular, React, Vite, Next.js vb. destekliyor. Bu projedeki **admin paneli** (`admin/`) **Vite + React** ile yazıldığı için aynı “frontend” seçenekleriyle uyumludur — admin’i ayrı bir site olarak deploy edebilir veya API ile aynı sunucuda statik build (`npm run build` → `dist`) servis edebilirsiniz.

Bu proje veritabanını **MySQL** kullanacak şekilde yapılandırılmıştır (Hostinger MySQL ile uyumludur).

## 1. Hostinger’da MySQL oluşturma

1. **hPanel** → **Veritabanları** → **MySQL Veritabanı**.
2. Yeni veritabanı ve kullanıcı oluşturun; kullanıcıyı veritabanına **Tüm ayrıcalıklar** ile ekleyin.
3. Bağlantı bilgilerini not edin:
   - **Host:** genelde `localhost` (uzak bağlantıda panelde gösterilen hostname, örn. `mysql123.hostinger.com`).
   - **Port:** `3306`
   - **Veritabanı adı** ve **kullanıcı adı** (Hostinger bazen önek ekler: `u123456789_dbname`).

## 2. `DATABASE_URL` (Prisma)

Format:

```env
DATABASE_URL="mysql://KULLANICI:SIFRE@HOST:3306/VERITABANI_ADI"
```

- Şifrede özel karakter varsa URL-encode edin (`@` → `%40`, `#` → `%23` vb.).
- Bazı planlarda SSL gerekir; Hostinger dokümantasyonuna göre ekleyin:
  ```env
  DATABASE_URL="mysql://...?sslaccept=strict"
  ```

## 3. Ortam değişkenleri (Node.js uygulaması)

Hostinger Node.js bölümünde veya `.env` dosyasında örnek:

```env
DATABASE_URL=mysql://...
JWT_SECRET=uzun-rastgele-gizli-dize-min-32
JWT_REFRESH_SECRET=baska-uzun-gizli-dize
REDIS_DISABLED=true
PORT=3000
CORS_ORIGIN=https://siteniz.com
```

**`REDIS_DISABLED=true`:** Hostinger paylaşımlı hostingte genelde Redis yoktur. Bu durumda uygulama Redis olmadan çalışır; periyodik **ödeme reconcile** kuyruk job’u devre dışı kalır. Üretimde webhook + manuel kontrol önemlidir; ileride VPS + Redis eklenebilir.

## 4. Veritabanı tablolarını oluşturma

SSH veya Hostinger’ın “Terminal / Git” ortamında proje `backend` klasöründe:

```bash
cd backend
npm ci
npx prisma migrate deploy
npm run db:seed
```

İlk kurulumda migration’lar `prisma/migrations` altındaki MySQL SQL dosyalarını uygular.

## 5. Uygulamayı çalıştırma

- **Kök dizin (önemli):**  
  - **A)** Repo kökü (`mobileapp/`) → **Build komutu:** sadece **`npm run build`** (kök `package.json` önce `backend`’e `npm install` yapar, sonra `node scripts/build.cjs` ile derler — **`tsc` hiç kullanılmaz**).  
  - **B)** Kök dizin **`backend`** ise → Build: **`npm install && npm run build`** veya **`node scripts/build.cjs`**.  
- Panelde **`tsc`**, **`nest build`** tek başına yazmayın; “TypeScript derlemesi” seçeneği `tsc` çağırıyorsa kaldırıp yukarıdaki komutlardan birini kullanın.
- **Başlangıç:** kökten `npm run start --prefix backend` veya `backend` içinde `npm run start:prod` / `node dist/main.js`.

## 6. CORS

Mobil uygulama ve admin panel farklı domainlerden API’ye istek atacaksa `CORS_ORIGIN` içine bu origin’leri virgülle yazın.

## 6b. Hostinger panel: GitHub içe aktarma (sık görülen ayarlar)

Repoda **iki ayrı uygulama** var; Hostinger’da genelde **iki ayrı Node/Web uygulaması** açmanız gerekir (planınız birden fazla site/uygulamaya izin veriyorsa).

### A) Admin paneli (şu an yaptığınız gibi)

| Alan | Önerilen değer | Not |
|------|----------------|-----|
| Framework | **Vite** | `admin/` Vite + React |
| Dal | `main` | |
| Kök dizin | **`admin`** | Doğru |
| Node | 20.x veya **22.x** | İkisi de uygun |
| Derleme | Varsayılan Vite (`npm run build`) | Çıktı: `admin/dist` |
| Ortam değişkenleri | **`VITE_API_URL`** | **Zorunlu:** API’nin tam adresi, örn. `https://api.alanadiniz.com/api/v1` veya API için açtığınız Hostinger URL’si. Olmazsa panel `localhost`’a istek atar. |

**Geçici domain** (`*.hostingersite.com`) normaldir; sonra kendi domaininizi bağlarsınız.

### B) REST API (NestJS) — ayrı uygulama

Admin’den **ayrı** bir “Node.js uygulaması” oluşturup:

| Alan | Önerilen değer |
|------|----------------|
| Framework | **NestJS** |
| Kök dizin | **`backend`** |
| Derleme | `npm ci` (veya panelin yaptığı install) + `npm run build` |
| Başlatma | `npm run start:prod` veya `node dist/main.js` |
| Ortam | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_DISABLED=true`, `PORT` (panel atıyorsa ona göre), `CORS_ORIGIN=https://lightcoral-louse-504886.hostingersite.com` (admin geçici URL’niz) + ileride canlı domain |

İlk deploy sonrası SSH veya “Run command” ile bir kez: `npx prisma migrate deploy` ve isteğe bağlı `npm run db:seed`.

**Özet:** Şu anki ayarlar **sadece admin arayüzünü** yayınlar. Mobil uygulama ve admin’in çalışması için **backend**’i de Hostinger’da (ikinci uygulama veya VPS) çalıştırıp `VITE_API_URL` + mobil `API_BASE_URL`’i o API adresine yönlendirin.

---

## 7. Git ile deploy

**Node.js Web App (hPanel):** Birçok Hostinger Node.js planında **GitHub** deposunu doğrudan bağlayabilirsiniz: Websites → Node.js uygulaması eklerken **“Import Git Repository” / Git’ten içe aktar** benzeri seçenekle repo’yu yetkilendirirsiniz; panel build komutunu (`npm run build` vb.) ve başlangıç komutunu (`npm run start:prod` veya `node dist/main.js`) ayarlarsınız. NestJS bu akışta desteklenen framework’ler arasında.

**Dikkat:**

- Repo kökü tek uygulama ise `backend` klasörünü kök yapmak veya Hostinger’da **root directory / çalışma dizini** olarak `backend` seçmek gerekebilir (panelde alan varsa).
- **`.env`** ve gizli anahtarlar repoda olmamalı; hPanel **Environment variables** ile tanımlanmalı.
- `node_modules` genelde sunucuda `npm ci` / build ile üretilir; `.gitignore` zaten uygun olmalı.

**VPS:** GitHub Actions + SSH/rsync veya resmi VPS deploy aksiyonları ile push’ta deploy da yaygın bir yöntemdir.

Güncel adımlar ve plan kısıtları için: [Hostinger – Node.js Web App](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) yardım sayfasına bakın.

## 8. Yerel geliştirme (Docker MySQL)

```bash
docker compose up -d mysql
```

`.env`:

```env
DATABASE_URL="mysql://ecommerce:ecommerce@127.0.0.1:3306/ecommerce"
REDIS_DISABLED=true
```

Redis ile yerel test için: `docker compose --profile redis up -d` ve `.env` içinde `REDIS_DISABLED` satırını kaldırın veya `false` yapın.
