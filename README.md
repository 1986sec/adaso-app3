# ADASO Firma Takip Sistemi

Bu proje, ADASO için geliştirilmiş modern bir firma takip sistemidir.

## 🚀 Özellikler

- **Kullanıcı Kayıt Sistemi**: Güvenli kullanıcı kaydı
- **Giriş Sistemi**: JWT tabanlı authentication
- **Şifremi Unuttum**: Güvenli şifre sıfırlama
- **Firma Yönetimi**: Firma ekleme, düzenleme, silme
- **Ziyaret Takibi**: Müşteri ziyaretlerini kaydetme
- **Gelir-Gider Takibi**: Finansal raporlama
- **Raporlama**: Detaylı analiz ve raporlar

## 🔧 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm (v8 veya üzeri)

### Adımlar

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Server'ı başlatın:**
   ```bash
   npm start
   ```

3. **Geliştirme modunda çalıştırın:**
   ```bash
   npm run dev
   ```

## 🌐 Kullanım

### Kullanıcı Kaydı
1. Ana sayfada "Kayıt Ol" sekmesine tıklayın
2. Gerekli bilgileri doldurun:
   - Ad Soyad
   - E-posta
   - Kullanıcı Adı
   - Şifre (en az 6 karakter)
3. "Kayıt Ol" butonuna tıklayın

### Giriş Yapma
1. Ana sayfada "Giriş" sekmesine tıklayın
2. Kullanıcı adı/email ve şifrenizi girin
3. "Giriş Yap" butonuna tıklayın

### Şifremi Unuttum
1. Giriş formunda "Şifremi Unuttum?" linkine tıklayın
2. Kullanıcı adı veya e-posta adresinizi girin
3. "Devam Et" butonuna tıklayın
4. Yeni şifrenizi belirleyin
5. "Şifreyi Güncelle" butonuna tıklayın

## 🧪 Test Sayfaları

### 1. API Test Sayfası (`/test.html`)
- İngilizce field isimleri ile test
- Tüm authentication işlemlerini test edin
- Server durumunu kontrol edin

### 2. Türkçe Test Sayfası (`/test-turkce.html`)
- Türkçe field isimleri ile test
- Production API'ler ile test
- Hem local hem production ortamları test edin

## ✅ Çözülen Sorunlar

### **Authentication Sistemi**
- ✅ **Kayıt olma** - Hem İngilizce hem Türkçe field isimleri destekleniyor
- ✅ **Giriş yapma** - JWT token tabanlı güvenli authentication
- ✅ **Şifremi unuttum** - Reset token sistemi ile güvenli şifre sıfırlama
- ✅ **Şifre güncelleme** - Token expiration ile güvenli şifre değiştirme

### **Field İsim Desteği**
- ✅ **İngilizce**: `username`, `password`, `fullName`, `email`
- ✅ **Türkçe**: `kullaniciAdi`, `sifre`, `adSoyad`, `eposta`
- ✅ **Alternatif**: `kullanici`, `ad`, `sifirlaToken`, `yeniSifre`

### **Production Uyumluluğu**
- ✅ Eski production kodları ile uyumlu
- ✅ Hem local hem production API'ler destekleniyor
- ✅ Backward compatibility sağlandı

## 🔐 Güvenlik

- **Şifre Hashleme**: bcryptjs ile güvenli şifre saklama
- **JWT Tokens**: Güvenli authentication
- **Input Validation**: Tüm kullanıcı girdileri doğrulanır
- **CORS Protection**: Cross-origin request koruması

## 📁 Proje Yapısı

```
adaso-frontend/
├── css/                 # Stil dosyaları
├── html/                # HTML sayfaları
├── js/                  # JavaScript dosyaları
├── server.js            # Express server
├── config.js            # Konfigürasyon
├── package.json         # Bağımlılıklar
└── README.md           # Bu dosya
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/forgot-password` - Şifre sıfırlama
- `POST /api/auth/reset-password` - Şifre güncelleme
- `GET /api/user/profile` - Kullanıcı profili

### Sistem
- `GET /api/health` - Server durumu
- `GET /api/database/test` - Database bağlantı testi

## 🔧 Konfigürasyon

`config.js` dosyasında aşağıdaki ayarları yapabilirsiniz:

- **Port**: Server port numarası
- **JWT Secret**: JWT token imzalama anahtarı
- **CORS**: İzin verilen origin'ler
- **Database**: Database bağlantı bilgileri

## 🚨 Önemli Notlar

- **Production**: Bu sistem development amaçlıdır. Production'da database kullanılmalıdır
- **Veri Saklama**: Kullanıcı verileri şu anda memory'de saklanmaktadır
- **Güvenlik**: JWT secret key'i production'da değiştirilmelidir

## 📞 Destek

Herhangi bir sorun yaşarsanız veya öneriniz varsa, lütfen iletişime geçin.

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

---

**Geliştirici:** 1986sec  
**Versiyon:** 1.0.0  
**Son Güncelleme:** Eylül 2024
