TURAN OTO YÖNETİM PANELİ V2

EKLENENLER
- /admin ana yönetim paneli ve istatistikler
- /admin/excel-yukle gelişmiş Excel ön izleme ve aktarım sonucu
- /admin/urunler arama, düzenleme ve silme
- CSV dışa aktarma
- Yönetim ve ürün API'leri için kullanıcı adı/şifre koruması
- Mevcut Supabase tablonuzdaki product_name/product_group/vat sütunlarıyla tam uyum

KURULUM
1) ZIP içindeki app, lib, supabase ve middleware.ts dosyalarını proje ana klasörüne kopyalayın. Aynı klasörleri birleştirin; mevcut klasörleri silmeyin.
2) package.json ile aynı yerde middleware.ts olmalı.
3) npm install xlsx @supabase/supabase-js (zaten yaptıysanız tekrar gerekmez)
4) Supabase SQL Editor'da supabase/products-v2.sql dosyasını çalıştırın.
5) Vercel > Settings > Environment Variables bölümüne ekleyin:
   ADMIN_USERNAME=belirleyeceginiz_kullanici_adi
   ADMIN_PASSWORD=guclu_bir_sifre
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
6) GitHub'a yükleyin ve Vercel'de Redeploy yapın.
7) /admin adresini açın. Tarayıcı kullanıcı adı ve şifre soracaktır.

ÖNEMLİ
- .env.local dosyasını GitHub'a yüklemeyin.
- SUPABASE_SERVICE_ROLE_KEY hiçbir zaman tarayıcı tarafına yazılmaz.
- Bu paket yönetim panelini kurar. Mağaza ürün kartlarının Supabase'den okunması ayrı bir bağlantı adımıdır.
