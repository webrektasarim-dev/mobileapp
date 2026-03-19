# Hostinger — API için ayrı GitHub reposu (monorepo hatası)

**“Desteklenmeyen framework / geçersiz proje yapısı”** hâlâ çıkıyorsa büyük olasılıkla sebep şudur:

Hostinger, Git’ten **tüm monorepo**yu indirir ve projeyi tararken aynı depoda **birden fazla** proje görür (`admin/` Vite, `mobile/` Flutter, `backend/` NestJS). Otomatik tespit bu yüzden başarısız olabilir.

**Kalıcı çözüm:** Sadece `backend/` içeriğini, kökünde tek bir NestJS projesi olacak şekilde **ayrı bir GitHub reposuna** itmek; Hostinger’da **o** repoyu bağlamak.

---

## 1. GitHub’da boş repo oluşturun

Örnek ad: `mobileapp-api` (örn. `https://github.com/SIZIN-KULLANICI/mobileapp-api`).

README eklemeden, boş oluşturun.

---

## 2. Yerelde `backend` dalını üretin ve itin

Monorepo kökünde (`mobileapp` klasörü):

```bash
cd c:\xampp\htdocs\mobileapp

git subtree split --prefix=backend -b deploy-api-only
```

Bu komut, geçmişte `backend/` altındaki commit’leri tek bir dalda birleştirir; o dalın **kökünde** doğrudan `package.json`, `src/`, `prisma/` olur (üstte `admin/` / `mobile/` yok).

Uzak repoyu ekleyip itin (`SIZIN-KULLANICI` ve repo URL’sini değiştirin):

```bash
git remote add mobileapp-api https://github.com/SIZIN-KULLANICI/mobileapp-api.git
git push mobileapp-api deploy-api-only:main --force
```

İlk push’ta uzakta dal yoksa `--force` gerekebilir; sonraki güncellemeler için aynı komutu tekrar kullanabilir veya [subtree push](https://stackoverflow.com/questions/1371087/git-subtree-push-to-new-remote-branch) akışını tercih edebilirsiniz.

**Güncelleme akışı (her backend değişikliğinden sonra):**

1. `main` (veya çalışma dalınız) üzerinde normal commit + push.
2. Yukarıdaki `git subtree split` + `git push ... deploy-api-only:main` adımlarını tekrarlayın (Hostinger’ın bağlı olduğu repo güncellenir).

---

## 3. Hostinger ayarları (yalnızca API reposu)

| Alan | Değer |
|------|--------|
| **Repository** | `mobileapp-api` (ayrı repo) |
| **Kök dizin** | Boş / repo kökü |
| **Framework** | NestJS |
| **Build** | `npm install && npm run build` |
| **Start** | `npm run start:prod` veya `node dist/main.js` |

Ortam değişkenleri ana repodakiyle aynı: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_DISABLED=true`, `PORT`, vb. → bkz. [HOSTINGER_BACKEND_KURULUM.md](./HOSTINGER_BACKEND_KURULUM.md).

---

## 4. Alternatif: ZIP ile sadece backend

Git kullanmak istemezseniz: `backend` klasörünü (içinde `node_modules` **olmadan**) zipleyin → Hostinger’da **Dosya yükle** ile NestJS uygulaması oluşturun; build/start yine yukarıdaki gibi.

---

Ana monorepo (`mobileapp`) admin ve mobil için aynı kalır; sadece canlı API bu ayrı repodan beslenir.
