# Restaurant POS Desktop App – UI Design Specification

## 1. Proje Özeti

Bu proje, restoranların masa siparişlerini, adisyonlarını, ödeme süreçlerini, gün sonu özetlerini ve temel istatistiklerini takip edebilmesi için tasarlanacak bir **masaüstü restoran yönetim / POS arayüzü**dür.

Uygulama şu aşamada yalnızca **arayüz prototipi** olarak geliştirilecektir. Backend entegrasyonu daha sonra eklenecektir. Bu nedenle tüm veriler şimdilik mock data üzerinden çalışmalıdır.

Uygulama React ile geliştirilecek, ilerleyen aşamada Electron ile masaüstü uygulaması olarak paketlenecektir. Bu yüzden tasarım masaüstü kullanımına uygun, geniş ekran odaklı, hızlı anlaşılır ve profesyonel olmalıdır.

---

## 2. Genel Tasarım Hedefi

Arayüz şu hissi vermelidir:

- Basit
- Temiz
- Profesyonel
- Restoran personelinin hızlı kullanabileceği kadar anlaşılır
- Dokunmatik ekran / POS ekranı kullanımına uygun
- Karmaşık olmayan ama kurumsal görünen
- Light tema ağırlıklı
- Gereksiz animasyonlardan uzak
- Büyük butonlar, net ikonlar ve okunabilir yazılar

Uygulama günlük restoran operasyonunda hızlı kullanılacağı için tasarımda estetikten önce **hız, okunabilirlik ve işlem akışı** önceliklidir.

---

## 3. Teknoloji ve Geliştirme Notları

### Kullanılacak teknoloji

- React
- Vite önerilir
- Tailwind CSS önerilir
- Lucide React ikonları kullanılabilir
- State yönetimi şimdilik React state ile yapılabilir
- Backend yok, mock data kullanılacak
- Electron entegrasyonu ileride eklenecek

### Önemli geliştirme kuralları

- Şimdilik API çağrısı yapılmayacak
- Tüm veriler `mockData.js` veya benzeri bir dosyadan gelecek
- Butonlar çalışır gibi davranmalı
- Sayfalar arası geçişler yapılmalı
- Modal / popup / drawer yapıları olmalı
- Ürün ekleme, masa seçme, ödeme alma gibi işlemler mock state üzerinde çalışabilir
- LocalStorage kullanılabilir ama zorunlu değil
- Kod yapısı backend entegrasyonuna hazır olmalı
- Electron için responsive değil, desktop-first düşünülmeli
- Minimum hedef çözünürlük: 1366x768
- İdeal hedef çözünürlük: 1440x900 ve üzeri

---

## 4. Genel Layout Yapısı

Uygulama ana ekranda şu layout yapısını kullanmalıdır:

### Sol Sidebar

Sabit sol menü olacak.

Genişlik:
- Açık halde: 240px
- Daraltılmış halde: 72px

Menü içerikleri:

1. Masalar
2. Sipariş Oluştur
3. Açık Adisyonlar
4. Ödemeler
5. İstatistikler
6. Gün Sonu Özeti
7. Ürünler / Menü
8. Ayarlar

Sidebar sade ve açık renkli olmalı. Aktif sayfa soft accent background ile gösterilmeli.

### Üst Bar

Üstte ince bir header olmalı.

İçerikler:

- Sol tarafta sayfa başlığı
- Ortada gerekirse hızlı arama
- Sağ tarafta:
  - Aktif kullanıcı adı: “Kasiyer”
  - Gün / saat bilgisi
  - Bildirim ikonu
  - Küçük profil alanı

### Ana İçerik Alanı

Ana içerik geniş, ferah ve kart tabanlı olmalı.

Background:
- Çok açık gri: `#F8FAFC`
- Kartlar beyaz: `#FFFFFF`

---

## 5. Renk Paleti

Light tema kullanılacak.

### Ana renkler

```css
--background: #F8FAFC;
--surface: #FFFFFF;
--surface-soft: #F1F5F9;
--border: #E2E8F0;

--primary: #2563EB;
--primary-hover: #1D4ED8;
--primary-soft: #DBEAFE;

--success: #16A34A;
--success-soft: #DCFCE7;

--warning: #F59E0B;
--warning-soft: #FEF3C7;

--danger: #DC2626;
--danger-soft: #FEE2E2;

--text-main: #0F172A;
--text-muted: #64748B;
--text-light: #94A3B8;
```

### Restoran uygulaması için durum renkleri

Masa durumları:

- Boş masa: açık gri / beyaz
- Dolu masa: soft mavi
- Sipariş bekliyor: soft turuncu
- Ödeme bekliyor: soft yeşil
- Rezerve: soft mor

Örnek:

```css
.empty-table {
  background: #FFFFFF;
  border-color: #E2E8F0;
}

.occupied-table {
  background: #DBEAFE;
  border-color: #60A5FA;
}

.pending-order {
  background: #FEF3C7;
  border-color: #F59E0B;
}

.payment-waiting {
  background: #DCFCE7;
  border-color: #22C55E;
}

.reserved-table {
  background: #F3E8FF;
  border-color: #A855F7;
}
```

---

## 6. Typography

Font olarak modern ve okunabilir bir font kullanılmalı.

Öneri:
- Inter
- Manrope
- system-ui fallback

### Font ölçüleri

```css
Page title: 24px / 700
Section title: 18px / 600
Card title: 16px / 600
Normal text: 14px / 400
Muted text: 13px / 400
Small label: 12px / 500
Button text: 14px / 600
Table number / price: 16px / 700
```

Restoran personeli hızlı okuyacağı için yazılar çok küçük olmamalı.

---

## 7. Component Tasarım Sistemi

### Button

Butonlar büyük, net ve kolay tıklanabilir olmalı.

Varyantlar:

- Primary
- Secondary
- Success
- Danger
- Ghost
- Outline

Minimum yükseklik:
- Normal button: 40px
- POS aksiyon button: 48px
- Büyük işlem button: 56px

Örnek kullanım:

- “Sipariş Ekle”
- “Ödeme Al”
- “Adisyon Yazdır”
- “Masayı Kapat”
- “Ürün Ekle”
- “İptal”

### Card

Kartlar sade beyaz zeminli olmalı.

```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 16px;
box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
```

### Modal

Modal yapısı şu işlemler için kullanılmalı:

- Masaya ürün ekleme
- Adisyon detay görüntüleme
- Ödeme alma
- Ürün notu ekleme
- Ürün iptal onayı
- Gün sonu kapatma onayı

Modal arka planı hafif blur veya koyu overlay olabilir.

### Drawer

Sağdan açılan drawer özellikle masa detayları için kullanılmalı.

Masa kartına tıklanınca sağdan detay paneli açılmalı.

Drawer içeriği:

- Masa adı
- Masa durumu
- Açılış saati
- Siparişler
- Toplam tutar
- Ödeme butonları
- Adisyon yazdır butonu
- Ürün ekle butonu

### Badge

Durumları göstermek için badge kullanılmalı.

Örnek badge’ler:

- Boş
- Dolu
- Hazırlanıyor
- Servis Edildi
- Ödeme Bekliyor
- Kapandı
- Rezerve

---

## 8. Sayfa ve Ekran Akışları

## 8.1 Masalar Ekranı

Bu uygulamanın ana ekranı olmalıdır.

### Amaç

Restoran içindeki tüm masaların durumunu hızlıca görmek ve masaya tıklayarak işlem yapmak.

### Layout

Üst bölümde filtreler:

- Tüm Masalar
- Boş
- Dolu
- Sipariş Bekleyen
- Ödeme Bekleyen
- Rezerve

Ana alanda masa kartları grid halinde gösterilmeli.

Grid:
- Desktop için 4-6 kolon
- Kart boyutu yaklaşık 180x140px

### Masa Kartı İçeriği

Her masa kartında:

- Masa adı: “Masa 1”
- Durum badge’i
- Toplam tutar
- Son sipariş saati
- Kişi sayısı
- Küçük ikon: masa / sandalye
- Renkli durum göstergesi

Örnek masa kartı:

```text
Masa 4
Dolu

₺740,00
3 ürün
Açılış: 14:25
```

### Masa Kartı Davranışı

Masa kartına tıklanınca sağdan “Masa Detay Drawer” açılmalı.

Boş masaya tıklanınca:

- “Yeni Sipariş Başlat”
- “Masa Rezerve Et”
- “Kişi Sayısı Seç”

Dolu masaya tıklanınca:

- Sipariş listesi
- Ürün ekleme
- Adisyon görüntüleme
- Ödeme alma
- Masayı kapatma

---

## 8.2 Masa Detay Drawer

Masa ekranında masa kartına tıklanınca açılır.

### İçerik

Header:

- Masa adı
- Durum
- Açılış zamanı
- Kişi sayısı

Sipariş listesi:

Her ürün satırı:

- Ürün adı
- Adet
- Birim fiyat
- Toplam fiyat
- Durum
- Not varsa küçük not ikonu
- Sil / iptal ikonu

Alt toplam alanı:

- Ara toplam
- Servis ücreti
- İndirim
- Genel toplam

Aksiyon butonları:

- Ürün Ekle
- Adisyon Yazdır
- Ödeme Al
- Masayı Kapat
- Masayı Taşı
- Masaları Birleştir

### Ek UI Notu

Drawer genişliği:
- 420px - 520px

Drawer scroll edilebilir olmalı.

---

## 8.3 Sipariş Oluşturma Ekranı

### Amaç

Bir masa seçip ürünleri hızlıca sepete eklemek.

### Layout

Bu ekran iki ana bölüme ayrılmalı.

Sol taraf:
- Kategori listesi
- Ürün grid’i

Sağ taraf:
- Seçili masa
- Sepet / sipariş özeti
- Toplam fiyat
- Not alanı
- Siparişi gönder butonu

### Ürün Kategorileri

Örnek kategoriler:

- Başlangıçlar
- Ana Yemekler
- Burgerler
- Pizzalar
- Salatalar
- Tatlılar
- Sıcak İçecekler
- Soğuk İçecekler
- Alkolsüz Kokteyller

### Ürün Kartı

Ürün kartında:

- Ürün adı
- Kısa açıklama
- Fiyat
- Hazırlık süresi
- Kategori badge’i
- Artı butonu

Örnek:

```text
Tavuk Burger
Izgara tavuk, cheddar, özel sos
₺220
+ Ekle
```

### Sepet Alanı

Sağ panelde:

- Masa seçimi dropdown
- Eklenen ürünler
- Adet artır / azalt
- Ürün notu ekleme
- Ürün silme
- Ara toplam
- Toplam
- “Siparişi Masaya Ekle” butonu

### Popup Akışları

Ürüne tıklanınca modal açılabilir:

- Ürün detay
- Adet seçimi
- Ürün notu
- Ekstra seçenekler
- Sepete ekle

Örnek ekstralar:

- Ek peynir
- Acısız
- Soğansız
- Büyük boy
- Ek sos

---

## 8.4 Açık Adisyonlar Ekranı

### Amaç

Henüz kapanmamış tüm adisyonları listelemek.

### Layout

Tablo veya kart listesi olabilir.

Kolonlar:

- Adisyon No
- Masa
- Açılış Saati
- Ürün Sayısı
- Toplam Tutar
- Durum
- Aksiyonlar

Aksiyonlar:

- Detay Gör
- Ödeme Al
- Adisyon Yazdır
- Masaya Git

### Detay Modalı

Adisyon detayına basınca modal açılmalı.

İçerik:

- Adisyon no
- Masa adı
- Siparişler
- Vergi / servis
- Toplam
- Ödeme geçmişi
- Yazdır / ödeme al butonları

---

## 8.5 Ödeme Alma Ekranı / Modalı

Ödeme alma genellikle modal olarak tasarlanmalı.

### Ödeme Modal İçeriği

Header:
- Masa adı
- Toplam ödeme tutarı

Ödeme yöntemleri:

- Nakit
- Kredi Kartı
- Yemek Kartı
- Online Ödeme
- Parçalı Ödeme

### Parçalı Ödeme

Parçalı ödeme arayüzü olmalı.

Örnek:

```text
Toplam: ₺1.250
Ödenen: ₺750
Kalan: ₺500
```

Kullanıcı ödeme yöntemi seçip tutar girebilmeli.

### Aksiyonlar

- Ödeme Ekle
- Tamamını Nakit Al
- Tamamını Kart Al
- Ödeme Tamamla
- Fiş Yazdır
- Adisyonu Kapat

### Başarılı Ödeme Popup

Ödeme tamamlanınca küçük success modal:

```text
Ödeme tamamlandı.
Masa 4 kapatıldı.
```

Butonlar:
- Masalara Dön
- Fiş Yazdır

---

## 8.6 İstatistikler Ekranı

### Amaç

Restoran sahibinin veya yöneticinin satış performansını hızlıca görmesi.

### Üst KPI Kartları

- Bugünkü Ciro
- Açık Adisyon Sayısı
- Ortalama Adisyon
- En Çok Satan Ürün
- Toplam Sipariş Sayısı
- Nakit / Kart Dağılımı

### Grafik Alanları

Şimdilik mock chart component kullanılabilir.

Grafikler:

- Saatlik satış grafiği
- Kategori bazlı satış
- Ödeme yöntemi dağılımı
- En çok satan ürünler listesi

### Tasarım

Grafikler sade kartlar içinde gösterilmeli.
Aşırı karmaşık dashboard görünümünden kaçınılmalı.

---

## 8.7 Gün Sonu Özeti Ekranı

### Amaç

Günün sonunda kasa kapanışı ve özet kontrolü için kullanılır.

### İçerik

Üstte tarih seçici:

- Bugün
- Dün
- Özel tarih

Özet kartları:

- Toplam Ciro
- Nakit Toplam
- Kart Toplam
- Yemek Kartı Toplam
- İptal Edilen Ürünler
- İndirimler
- Kapalı Adisyon Sayısı
- Açık Kalan Adisyon Sayısı

### Detay Bölümleri

1. Ödeme Yöntemi Dağılımı
2. En Çok Satan Ürünler
3. Garson Bazlı Satışlar
4. İptal / İade İşlemleri
5. Gün Sonu Notları

### Aksiyonlar

- Gün Sonu Raporu Yazdır
- PDF Olarak Dışa Aktar
- Gün Sonunu Kapat

“Gün Sonunu Kapat” butonuna basınca onay modalı açılmalı.

Onay modalı:

```text
Gün sonunu kapatmak istediğinize emin misiniz?
Bu işlemden sonra bugüne ait satışlar kilitlenir.
```

Butonlar:
- Vazgeç
- Gün Sonunu Kapat

---

## 8.8 Ürünler / Menü Yönetimi Ekranı

Bu ekran şimdilik sadece arayüz olacak.

### Amaç

Restoran menüsündeki ürünleri görmek.

### İçerik

Üstte:

- Ürün ara
- Kategori filtrele
- Yeni ürün ekle butonu

Ürün listesi:

- Ürün adı
- Kategori
- Fiyat
- Stok durumu
- Aktif / pasif
- Düzenle butonu

### Yeni Ürün Modalı

Alanlar:

- Ürün adı
- Kategori
- Fiyat
- Kısa açıklama
- Hazırlık süresi
- Aktif / pasif toggle

Kaydet butonu şimdilik mock çalışabilir.

---

## 8.9 Ayarlar Ekranı

### İçerik

Ayarlar ekranı basit sekmeli yapıda olabilir.

Sekmeler:

1. Restoran Bilgileri
2. Masa Düzeni
3. Yazıcı Ayarları
4. Kullanıcılar
5. Vergi / Servis Ücreti
6. Tema

### Yazıcı Ayarları

Backend/Electron aşamasında yazıcı entegrasyonu yapılacak ama şimdilik UI olmalı.

Alanlar:

- Adisyon yazıcısı seç
- Mutfak yazıcısı seç
- Test çıktısı al
- Otomatik yazdır toggle

### Masa Düzeni

Şimdilik masa ekleme UI:

- Masa adı
- Bölge: Salon / Bahçe / Teras
- Kapasite
- Aktif / pasif

---

## 9. Mock Data Yapısı

Şu tarz mock data hazırlanmalı:

```js
export const tables = [
  {
    id: 1,
    name: "Masa 1",
    area: "Salon",
    status: "empty",
    guests: 0,
    openedAt: null,
    total: 0,
    orders: []
  },
  {
    id: 2,
    name: "Masa 2",
    area: "Salon",
    status: "occupied",
    guests: 3,
    openedAt: "14:25",
    total: 740,
    orders: [
      {
        id: 101,
        productName: "Tavuk Burger",
        quantity: 2,
        unitPrice: 220,
        status: "served",
        note: "Soğansız"
      },
      {
        id: 102,
        productName: "Limonata",
        quantity: 2,
        unitPrice: 150,
        status: "preparing",
        note: ""
      }
    ]
  }
];
```

Ürün mock data:

```js
export const products = [
  {
    id: 1,
    name: "Tavuk Burger",
    category: "Burgerler",
    description: "Izgara tavuk, cheddar, özel sos",
    price: 220,
    prepTime: "12 dk",
    isActive: true
  },
  {
    id: 2,
    name: "Margherita Pizza",
    category: "Pizzalar",
    description: "Domates sos, mozzarella, fesleğen",
    price: 280,
    prepTime: "18 dk",
    isActive: true
  }
];
```

---

## 10. Önerilen Klasör Yapısı

```text
src/
  components/
    layout/
      Sidebar.jsx
      Topbar.jsx
      AppLayout.jsx
    ui/
      Button.jsx
      Card.jsx
      Badge.jsx
      Modal.jsx
      Drawer.jsx
      Input.jsx
      Select.jsx
      Tabs.jsx
    restaurant/
      TableCard.jsx
      TableDetailDrawer.jsx
      OrderCart.jsx
      ProductCard.jsx
      PaymentModal.jsx
      BillDetailModal.jsx
      StatCard.jsx
  data/
    mockTables.js
    mockProducts.js
    mockStats.js
  pages/
    TablesPage.jsx
    CreateOrderPage.jsx
    OpenBillsPage.jsx
    PaymentsPage.jsx
    StatisticsPage.jsx
    EndOfDayPage.jsx
    ProductsPage.jsx
    SettingsPage.jsx
  hooks/
    useMockRestaurantState.js
  App.jsx
  main.jsx
  index.css
```

---

## 11. UI Davranışları

### Sayfa Geçişleri

Sidebar menülerine basıldığında ilgili sayfa açılmalı.

### Masa Detayı

Masa kartına basıldığında drawer açılmalı.

### Ürün Ekleme

Ürün ekle butonuna basıldığında ürün seçme modalı veya sipariş ekranına yönlendirme yapılmalı.

### Ödeme

Ödeme al butonuna basıldığında ödeme modalı açılmalı.

### Adisyon

Adisyon yazdır butonu şimdilik sadece popup göstermeli:

```text
Adisyon yazdırma işlemi backend / Electron entegrasyonunda aktif edilecektir.
```

### Gün Sonu

Gün sonunu kapat butonu onay modalı açmalı.

### Toast / Bildirimler

Küçük bildirimler kullanılmalı:

- Sipariş masaya eklendi
- Ödeme tamamlandı
- Adisyon kapatıldı
- Ürün sepete eklendi

---

## 12. Electron Uyum Notları

Uygulama ileride Electron ile desktop app olarak çalışacak.

Bu yüzden:

- Browser-specific responsive mobile yaklaşımına gerek yok
- Desktop-first layout kullanılmalı
- Window minimum width düşünülmeli
- Yazıcı entegrasyonu için UI alanları hazır bırakılmalı
- Offline çalışma ihtimali için tasarım sade tutulmalı
- Üst sistem barı gereksiz kalabalık olmamalı
- Klavye ve mouse ile hızlı kullanım desteklenmeli
- Dokunmatik POS ekranında da kullanılabilecek kadar büyük click alanları olmalı

---

## 13. Kullanıcı Deneyimi İlkeleri

### Hızlı işlem

Garson veya kasiyer 2-3 tıklamada işlem yapabilmeli.

Örnek:
Masaya tıkla → Ürün ekle → Siparişi gönder

### Net durum bilgisi

Masanın boş mu, dolu mu, ödeme mi beklediği hemen anlaşılmalı.

### Gereksiz detay yok

Ana ekranda sadece gerekli bilgi gösterilmeli. Detaylar drawer veya modalda açılmalı.

### Hata riski azaltılmalı

Kritik işlemler onay modalı istemeli:

- Masayı kapat
- Ürün iptal et
- Gün sonunu kapat
- Ödemeyi tamamla

---

## 14. Örnek Ana Kullanım Senaryosu

### Senaryo 1: Yeni sipariş oluşturma

1. Kullanıcı “Masalar” ekranına girer
2. Boş masa seçer
3. “Yeni Sipariş Başlat” butonuna basar
4. Kişi sayısı seçer
5. Sipariş oluşturma ekranında ürünleri sepete ekler
6. “Siparişi Masaya Ekle” butonuna basar
7. Masa durumu “Dolu” olur
8. Kullanıcı masalar ekranına döner

### Senaryo 2: Dolu masaya ürün ekleme

1. Kullanıcı dolu masaya tıklar
2. Sağ drawer açılır
3. Mevcut siparişleri görür
4. “Ürün Ekle” butonuna basar
5. Ürün seçer
6. Sipariş masaya eklenir
7. Toplam tutar güncellenir

### Senaryo 3: Ödeme alma

1. Kullanıcı masaya tıklar
2. “Ödeme Al” butonuna basar
3. Ödeme modalı açılır
4. Ödeme yöntemi seçilir
5. Tutar girilir
6. Ödeme tamamlanır
7. Masa kapatılır
8. Başarılı işlem popup’ı gösterilir

### Senaryo 4: Gün sonu kapatma

1. Kullanıcı Gün Sonu Özeti ekranına gider
2. Günlük ciro ve ödeme dağılımını kontrol eder
3. “Gün Sonunu Kapat” butonuna basar
4. Onay modalı açılır
5. Kullanıcı onaylar
6. Başarı mesajı gösterilir

---

## 15. Görsel Stil Detayları

### Border radius

- Küçük elementler: 8px
- Kartlar: 16px
- Büyük paneller: 20px
- Modal: 24px

### Shadow

Gölge çok abartılı olmamalı.

```css
box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
```

### Spacing

Genel spacing sistemi:

```text
4px
8px
12px
16px
24px
32px
```

Ana içerik padding:
- 24px veya 32px

### İkonlar

Lucide ikonları kullanılabilir:

- LayoutDashboard
- Utensils
- Receipt
- CreditCard
- BarChart3
- CalendarCheck
- Settings
- Plus
- Search
- Printer
- X
- Check
- Trash2
- Clock
- Users

---

## 16. Uygulama İsmi ve Branding

Şimdilik uygulama ismi geçici olabilir:

- Rafa POS
- Restaurant Desk
- MasaPOS
- Restora Panel

Sidebar üstünde sade logo alanı:

```text
Rafa POS
Restaurant Management
```

Logo yerine şimdilik yuvarlatılmış kare içinde çatal-bıçak ikonu kullanılabilir.

---

## 17. Codex İçin Net Görev

Bu tasarım dokümanına göre React tabanlı, light temalı, desktop-first bir restoran POS arayüz prototipi oluştur.

Backend entegrasyonu yapma. API çağrısı ekleme. Tüm verileri mock data ile yönet.

Uygulamada şu ekranlar çalışır durumda olmalı:

1. Masalar
2. Sipariş Oluştur
3. Açık Adisyonlar
4. Ödemeler
5. İstatistikler
6. Gün Sonu Özeti
7. Ürünler / Menü
8. Ayarlar

Butonlara basıldığında ilgili modal, drawer veya ekran geçişleri çalışmalı. Gerçek ödeme, yazdırma veya backend işlemi yapılmayacak. Bu işlemler için mock success popup veya bilgilendirme mesajı gösterilecek.

Tasarım basit, anlaşılır, profesyonel ve restoran personelinin hızlı kullanabileceği şekilde olmalı.
