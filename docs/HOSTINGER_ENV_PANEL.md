# Hostinger — Ortam değişkenleri (panel)

| Anahtar | Ne yazılır |
|---------|------------|
| **NODE_ENV** | `production` |
| **DATABASE_URL** | hPanel → MySQL bilgileri. Aynı sunucudaysa çoğu zaman `mysql://KULLANICI:SIFRE@localhost:3306/VERITABANI`. Uzak host gösteriliyorsa `localhost` yerine onu kullanın. Şifrede `@#%` varsa URL-encode. |
| **JWT_SECRET** | En az 32 karakter, rastgele (aşağıdaki gibi **kendi ürettiğiniz** iki farklı değer). Placeholder metin **kullanmayın**. |
| **JWT_REFRESH_SECRET** | JWT_SECRET’ten **farklı** uzun rastgele dize. |
| **REDIS_DISABLED** | `true` |
| **PORT** | Panelin verdiği port varsa o (çoğu zaman `3000`). |
| **CORS_ORIGIN** | Admin panelin **gerçek** adresi, örn. `https://xxxx.hostingersite.com`. Birden fazlaysa virgülle, boşluksuz. |

JWT üretmek (PowerShell):  
`[Convert]::ToBase64String((1..48|%{Get-Random -Max 256}) -as [byte[]])`  
İki kez çalıştırıp birini JWT_SECRET, diğerini JWT_REFRESH_SECRET yapın.
