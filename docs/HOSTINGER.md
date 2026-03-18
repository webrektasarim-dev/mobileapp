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

- **Başlangıç komutu** (Hostinger panelinde): örn. `node dist/main.js` veya `npm run start:prod`
- Önce `npm run build` ile derleyin; çıktı `dist/` olmalı.

## 6. CORS

Mobil uygulama ve admin panel farklı domainlerden API’ye istek atacaksa `CORS_ORIGIN` içine bu origin’leri virgülle yazın.

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
