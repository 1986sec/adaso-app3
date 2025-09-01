# ADASO Firma Takip Sistemi

ADASO Firma Takip Sistemi, firmaların ziyaretlerini, gelir-gider takibini ve raporlarını yönetmek için geliştirilmiş modern bir web uygulamasıdır.

## 🚀 Özellikler

- **Kullanıcı Yönetimi**: Giriş, kayıt ve şifre sıfırlama
- **Firma Yönetimi**: Firma ekleme, düzenleme ve listeleme
- **Ziyaret Takibi**: Ziyaret planlama ve takibi
- **Gelir-Gider**: Finansal kayıtların yönetimi
- **Raporlama**: Detaylı analiz ve raporlar
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu

## 🛠️ Teknolojiler

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Netlify, Render

## 📁 Proje Yapısı

```
adaso-app3/
├── css/                 # CSS dosyaları
├── html/                # HTML sayfaları
├── js/                  # JavaScript dosyaları
├── server.js            # Express server
├── config.js            # Konfigürasyon
├── package.json         # Node.js dependencies
├── _redirects           # Netlify routing
└── README.md            # Dokümantasyon
```

## 🔧 Kurulum

### Gereksinimler
- Node.js (v16+)
- npm veya yarn

### Adımlar
1. Repository'yi klonlayın:
```bash
git clone https://github.com/1986sec/adaso-app3.git
cd adaso-app3
```

2. Dependencies'leri yükleyin:
```bash
npm install
```

3. Uygulamayı başlatın:
```bash
npm start
```

4. Tarayıcıda açın: `http://localhost:3000`

## 🌐 Deployment

### Netlify (Frontend)
- Repository'yi Netlify'a bağlayın
- Build command: `(boş)`
- Publish directory: `.`

### Render (Backend)
- Repository'yi Render'a bağlayın
- Build command: `npm install`
- Start command: `npm start`

## 🔗 API Endpoints

- `GET /api/health` - Server durumu
- `GET /api/database/test` - Database bağlantı testi
- `POST /api/backend/*` - Backend API proxy

## 📊 Konfigürasyon

`config.js` dosyasında aşağıdaki ayarları yapabilirsiniz:

- Database URL
- Backend API URL
- Frontend URL
- Server port
- CORS ayarları

## 👨‍💻 Geliştirici

**1986sec** - [GitHub](https://github.com/1986sec)

## 📄 Lisans

MIT License

## 🆘 Destek

Herhangi bir sorun yaşarsanız GitHub Issues'da bildirebilirsiniz.
