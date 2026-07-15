# Auth + Online kurulumu

Supabase anonim (guest) auth **ve** tam online multiplayer kurulu. Kod tarafı
hazır; Supabase dashboard'ında 2 adım kaldı (koddan yapılamaz).

## 1. Anonim auth'ı aç (KRİTİK)

1. https://supabase.com/dashboard → proje `aenmzqizydxkcqqxqlap`
2. **Authentication → Sign In / Providers → Anonymous → Enable**

Açılmazsa lobi/maç **"Bağlantı kurulamadı"** verir.

## 2. Tabloları yükle / güncelle

1. **SQL Editor → New query**
2. `db/online_schema.sql` içeriğini yapıştır → **Run**

Dosya idempotiktir (tekrar çalıştırılabilir). `match_states` tablosu online
maçın yaşayan durumunu tutar (karakter, hazır, oynandı, çip, altın, jokerler,
dükkân, el, deste, seçili, oynanan kartlar, breakdown, kazanan). Önceki şemayı
çalıştırdıysan **tekrar Run yap** — eksik sütunlar otomatik eklenir.

## 3. Çalıştır

```bash
npm install        # veya: bun install
npm run dev        # http://localhost:3000
```

## 4. Online maçı dene (iki oyuncu)

Aynı makinede iki tarayıcı ile test edebilirsin (örn. Chrome + gizli pencere):

1. Tarayıcı A → Ana Menü → **Online** → isim gir → **Maç Oluştur**
   → "Rakip bekleniyor" ekranı + maç kodu görünür.
2. Tarayıcı B → Ana Menü → **Online** → başka isim → A'daki bekleyen maça **Katıl**.
3. İkisi de **karakter** seçer → otomatik **Dükkân** (Hazır butonu).
4. İkisi de **Hazır** → **Oyna**: kart seç/discard/et → **Eli Oyna**.
5. İkiniz de oynayınca **Showdown** (iki el açılır) → **Tur Sonu**.
6. 3 tur → **Maç Sonu** (kazanan çiplere göre).

## Nasıl çalışıyor

- **Auth:** Supabase anonim giriş → `players` satırı.
- **Senkron modeli:** her oyuncu `match_states` satırında **sadece kendi
  sütunlarını** yazar (altın, jokerler, el, seçili, oynandı, hazır). Çakışma yok.
- **Faz motoru:** rastgelelik içermeyen geçişleri (shop→play, play→showdown,
  showdown→maç sonu) **her iki oyuncu** yapar; kart dağıtan geçişleri (tur başı)
  `player1` (host) yapar. (`src/lib/online/useOnlineMatch.ts`)
- **Realtime:** `match_states`, `matches`, `match_logs` tabloları yayınlandı.

## Değişen dosyalar

| Dosya | Durum |
|---|---|
| `.env.local` | Supabase URL+key + DATABASE_URL |
| `src/lib/supabase/client.ts` | Eksik env'de net hata |
| `src/lib/supabase/server.ts` | Bozuktu → doğru SSR client |
| `src/lib/supabase/onlineGame.ts` | Tam online state + realtime + meta |
| `src/lib/online/useOnlineMatch.ts` | **Yeni:** senkron + aksiyon + faz motoru |
| `src/components/online/OnlineScreens.tsx` | **Yeni:** karakter/dükkân/oyna/showdown/sonu ekranları |
| `src/app/match/[id]/page.tsx` | **Yeni:** online maç route'u |
| `src/hooks/useOnlineGame.ts` | İçeriği geri yüklendi |
| `db/online_schema.sql` | 4 tablo + RLS + realtime |

## Sınırlar (bilinen)

- **Host bağımlılığı (azaltıldı):** rastgelelik içermeyen faz geçişlerini her
  iki oyuncu yapar; sadece **tur başı kart dağıtımı** host'a bağlıdır (yoksa iki
  taraf farklı el dağıtabilirdi). Host kopsa bile oyunun çoğu noktası ilerler.
- **Saboteur:** showdown'da rakibin çip/skoru -15 (min 0) düşülür.
- **El gizliliği:** realtime payload tüm satırı taşır; rakip UI'sı kartları
  kapalı gösterir ama veri websocket'de vardır. Tam gizlilik için oyuncu başına
  ayrı satır/RLS gerekir.
