# OyunTicareti - Proje Dokümanı (Sıfırdan)

> Bu doküman sıfırdan yeniden başlangıç için oluşturuldu.

---

## 1. Proje Vizyonu

İlk aşamada Knight Online PVP odaklı başlayıp, altyapısı sonradan yeni oyunlar
eklemeye uygun olan sade ve güvenli bir oyuncu pazarı oluşturmak.

İlk aşamada hedef:
- sadece temel arayüz
- temiz bilgi mimarisi
- kontrollü, adım adım geliştirme

---

## 2. Çalışma Prensibi

- Her faz küçük olacak.
- Her adım tamamlanınca birlikte kontrol edilecek.
- Onaydan sonra bir sonraki adıma geçilecek.

---

## 3. Faz durumu

### Tamamlanan — Faz 2 (Ilan listeleme, temel)

- [x] `ilanlar` sayfasi temel versiyonu
- [x] Ornek ilan kartlari ve liste
- [x] PVP: sunucu → pazar (Item / CSS / Goldbar) → ilanlar akisi

**Ilan rotalari (Knight Online PVP):**
- `/ilanlar` — sunucu ara, eslesen sunuculara tikla
- `/ilanlar/pvp/[server]` — uc pazar secenegi
- `/ilanlar/pvp/[server]/[market]` — `item` | `css` | `goldbar` ilan listesi
  - Filtre query: `q`, `min` / `max` (TL), `job` (sadece `item`), `sort` (`price_asc` | `price_desc`), `page` (sayfa basina 4 ilan)

### Tamamlanan — Faz 3 (Ilan detayi, temel)

- [x] Ilan detay sayfasi: `/ilanlar/[id]` (breadcrumb, fiyat, satici, aciklama, `generateMetadata`)
- [x] Ilan kartindan detaya `Link` (`scroll={false}`)
- [x] `/ilanlar/pvp` ile cakismayi onlemek icin ayristirici: `id === "pvp"` → `/ilanlar` yonlendirme

---

## 4. Faz 4+ — bakiye, hesap, mesaj (devam)

### Urun mantigi (guncel)

- Kullanicilar **onceden platform bakiyesi** yukler; ilan satin alininca tutar bakiyeden dusulur (**odeme bekleniyor** adimi yok).
- **Teslimat** ilan satin alma formunda degil; siparis sonrasi **saticiyla mesaj** ekraninda konusulur.
- **Yonetici**: dolandiricilik / sahte IBAN / dis kanal odeme gibi durumlarda konusmaya mudahale ve inceleme; uyeler mesaji **bildirebilir**, `ADMIN_EMAILS` ile tanimli hesaplar `/admin/moderasyon` kuyrugundan kayit acar/kapatir.

### Tamamlanan (bu iterasyon)

- [x] `/login`, `/register` — e-posta + sifre (scrypt), oturum cerez (`AUTH_SECRET`), `next` ile geri donus
- [x] **PostgreSQL** (`pg`): `users` + `balance_ledger` + `listings` + `orders` + `messages` + `moderation_reports`; yerel icin `docker compose up -d` (`docker-compose.yml`, postgres:16-alpine); baglanti `DATABASE_URL` (`.env.example`)
- [x] Ilanlar veritabaninda; mock dizi kaldirildi. Tohumlama: `npm run seed:users` (10 kullanici), `npm run seed:listings` (100 ilan, yalniz `ko4fun`, `seller_user_id` dolu), `npm run seed` (ikisi)
- [x] `listings.seller_user_id` — ilan sahibi `users` ile FK; satin alma ve mesaj katilimcilari buna gore
- [x] `/bakiye/yukle` — simule bakiye yukleme (PSP yok); tutar limitleri `MOCK_MIN_TOPUP_TL` / `MOCK_MAX_TOPUP_TL`; `simulateTopUpAction`
- [x] `/hesabim` — hesap merkezi; bakiye + hareketler (zaman cizelgesi / tablo); `MOCK_BAKIYE_DEMOSU=1` ile demo +1000 TL (`.env.example`)
- [x] `/ilanlar/[id]/satin-al` — giris zorunlu; 2 adim (ozet, onay); tek transaction: bakiye dusumu, `orders`, `balance_ledger` (`purchase`, meta `orderId`), saticidan ilk mesaj
- [x] `/siparis/[orderId]` — siparis veritabanindan; giris zorunlu; yalnizca alici veya satici; `listingId` query istege bagli (yanlis ise canonical URL)
- [x] `/mesajlar/[threadId]?listingId=` — `threadId` = siparis id; mesajlar DB (`sendOrderMessageAction`); karsi mesaj **Bildir** → `moderation_reports`
- [x] `/admin/moderasyon` — `ADMIN_EMAILS` (virgul ayir) ile admin; acik bildirim listesi, yonetici notu + **Cozuldu**; Navbar ustunde **Yonetim** linki (admin ise)

### Sonraki adaylar (sirayla)

1. **PSP** ile gercek bakiye yukleme (webhook + ledger `topup_paid` vb.).
2. Moderasyon: e-posta / Slack bildirimi, rapor neden kodlari, mesaj silme veya kullanici uyari adimlari.
3. Siparis durumu (`pending` / `delivered` / `dispute`), satici bakiyeye odeme aktarimi (pazar komisyonu modeli).
4. Sifre sifirlama / sifre degistirme, e-posta dogrulama.
