# IDS — Ag Saldiri Tespit Sistemi

Makine ogrenmesi kullanarak ag trafikini siniflandiran ve siber saldirilari tespit eden full-stack bir saldiri tespit sistemi. Mikroservis mimarisiyle tasarlandi: React frontend, Node.js API gateway, Python ML cikarim servisi ve MongoDB — tumunu Docker Compose ile orkestre ediyor.

CIC-IDS 2017 veri seti uzerinde egitilmis (1.7M+ ornek) sistem, trafigi 5 kategoride siniflandirmak icin uc farkli ML modeli kullaniyor ve SHAP analizi ile modelin karar surecini acikliyor.

---

## Mimari

```
                     +------------------+
                     |     Nginx        |
                     |   Reverse Proxy  |
                     |     :80          |
                     +--------+---------+
                              |
              +---------------+---------------+
              |                               |
    +---------v----------+          +---------v----------+
    |   React + TS       |          |   Node.js/Express  |
    |   Frontend         |          |   API Gateway      |
    |   Tailwind CSS     |          |   :5000            |
    |   Recharts         |          |                    |
    |   Zustand          |          |   JWT Auth + RBAC  |
    +--------------------+          |   Rate Limiting    |
                                    |   Input Validation |
                                    +---------+----------+
                                              |
                            +-----------------+-----------------+
                            |                                   |
                  +---------v----------+              +---------v----------+
                  |   Python/FastAPI   |              |     MongoDB 7      |
                  |   ML Servisi       |              |     :27017         |
                  |   :8000            |              |                    |
                  |                    |              |   Users            |
                  |   1D-CNN           |              |   Predictions      |
                  |   Random Forest    |              |   BlockedIPs       |
                  |   XGBoost          |              |   Alerts           |
                  |   SHAP             |              +--------------------+
                  +--------------------+
```

Frontend, Node.js backend ile REST API uzerinden haberlesir. Backend kimlik dogrulama, yetkilendirme, loglama ve IP engelleme islemlerini yonetir, ML cikarim isteklerini Python servisine yonlendirir. Her servis kendi Docker container'inda calisir.

---

## Ne Yapar

**Trafik Analizi** — Bir ag trafigi senaryosu sec (BENIGN, DoS, PortScan, BruteForce, WebAttack), uc ML modelinden birini sec ve guven skorlari ile risk degerlendirmesi iceren bir siniflandirma sonucu al.

**Toplu CSV Analizi** — Ag akis ozelliklerini iceren bir CSV dosyasi yukle, her satir icin tahmin al. Sinif dagilimlarini, saldiri oranlarini ve satir bazli tahmin loglarini gor.

**Rastgele Simulasyon** — Bilinen saldiri profillerine dayanan rastgele trafik kaliplari olustur ve modellerin varyasyonlara nasil tepki verdigini test et.

**SHAP Aciklanabilirlik** — Bir tahminden sonra, modelin neden bu karari verdigini sor. SHAP, siniflandirmaya en cok katkida bulunan ag ozelliklerini parcalayarak gosterir.

**Otomatik IP Engelleme** — Yuksek guvenle bir saldiri tespit edildiginde, kaynak IP veritabaninda engellenmis olarak kaydedilir. Yoneticiler dashboard uzerinden IP'leri inceleyebilir ve engelini kaldirabilir.

**Alarm Sistemi** — Tespit edilen her saldiri, ciddiyet seviyesiyle birlikte bir alarm uretir (kritik/yuksek/orta). Alarmlar MongoDB'de saklanir ve frontend'de okundu/okunmadi durumuyla goruntulenir.

**Rol Tabanli Erisim** — Farkli yetkilere sahip uc kullanici rolu:
- **Viewer** — analiz yapabilir ve loglari gorebilir
- **Analyst** — toplu analiz yapabilir ve IP engelleyebilir
- **Admin** — log temizleme ve IP engeli kaldirma dahil tam erisim

---

## Teknoloji Yigini

**Frontend**
- React 18, TypeScript
- Tailwind CSS (siber guvenlik temali karanlik tasarim)
- Zustand ile state yonetimi
- Recharts ile veri gorsellestirme
- Axios, JWT interceptor ve otomatik token yenileme
- React Router v6 ile korunmus rotalar

**Backend (API Gateway)**
- Node.js 20, Express 4
- Mongoose ile MongoDB (4 koleksiyon, bilesik indeksler)
- JWT kimlik dogrulama, access/refresh token rotasyonu
- RBAC (Rol Tabanli Erisim Kontrolu) middleware
- express-validator ile girdi dogrulama
- Helmet guvenlik basliklari
- Rate limiting (genel + endpoint bazli)
- Winston ile yapilandirilmis loglama

**ML Servisi**
- Python 3.11, FastAPI
- TensorFlow/Keras (1D-CNN modeli)
- scikit-learn (Random Forest)
- XGBoost
- SHAP (CNN icin DeepExplainer)
- Sliding window ozellik muhendisligi

**Altyapi**
- Docker Compose (4 container)
- Nginx reverse proxy
- GitHub Actions CI/CD pipeline
- Multi-stage Docker build

---

## ML Modelleri

Tum modeller CIC-IDS 2017 veri seti uzerinde 5 sinifli siniflandirma ile egitildi:

| Model | Dogruluk | Mimari |
|-------|----------|--------|
| 1D-CNN | %98.25 | 3x Conv1D + BatchNorm + GlobalAvgPool |
| Random Forest | %99.60 | 200 agac |
| XGBoost | %99.74 | Gradient boosted trees |

Ozellik muhendisligi, 12 temel ag akis ozelligi uzerinden hesaplanan sliding window istatistiklerini (ortalama, standart sapma, maksimum) icerir. Temel 45 ozellik ~81 girdi boyutuna genisletilir.

SHAP entegrasyonu, CNN modeli uzerinde DeepExplainer kullanarak bireysel tahminler icin ozellik onem siralamalari uretir.

---

## Kurulum

### Gereksinimler
- Docker ve Docker Compose

### Hizli Baslangic

```bash
git clone https://github.com/KULLANICI_ADINIZ/ids-fullstack.git
cd ids-fullstack

# Tum servisleri baslat
docker compose up -d

# Servislerin hazir olmasini bekle, veritabanini hazirla
docker exec ids-backend node src/utils/seed.js

# Tarayicida ac
# http://localhost
```

### Varsayilan Kullanicilar

| Rol | E-posta | Sifre |
|-----|---------|-------|
| Admin | admin@ids.local | Admin1234 |
| Analyst | analyst@ids.local | Analyst1234 |

### ML Model Dosyalari

Model dosyalari boyutlari nedeniyle repo'ya dahil edilmemistir. Asagidakileri `ml-service/models/` klasorune yerlestirin:
- `cnn_model.keras` — egitilmis 1D-CNN modeli
- `rf_model.pkl` — egitilmis Random Forest
- `xgb_model.pkl` — egitilmis XGBoost
- `scaler.pkl` — egitim verisine fit edilmis StandardScaler
- `label_encoder.pkl` — sinif isimleri icin label encoder
- `feature_columns.pkl` — sirali ozellik sutun listesi

---

## API Referansi

Tum endpoint'ler `/api/v1` on ekiyle baslar. Korumali endpoint'ler `Authorization` basliginda `Bearer` token gerektirir.

### Kimlik Dogrulama

```
POST   /auth/register        Yeni kullanici kaydi
POST   /auth/login           Giris yap, JWT token al
POST   /auth/refresh-token   Access token yenile
POST   /auth/logout          Refresh token'i gecersiz kil
GET    /auth/profile         Mevcut kullanici profili
```

### Tahminler

```
POST   /predictions          Tekli tahmin (tum roller)
POST   /predictions/batch    Toplu CSV analizi (analyst+)
POST   /predictions/explain  SHAP aciklamasi (tum roller)
GET    /predictions/logs     Sayfalandirilmis tahmin gecmisi
GET    /predictions/statistics   Dashboard istatistikleri
GET    /predictions/trend    Saatlik trafik trendi
DELETE /predictions/logs     Tum loglari temizle (sadece admin)
```

### Engelli IP'ler

```
GET    /blocked-ips          Engelli IP listesi
POST   /blocked-ips          IP engelle (analyst+)
DELETE /blocked-ips/:ip      IP engelini kaldir (sadece admin)
```

### Alarmlar

```
GET    /alerts               Filtreli alarm listesi
PATCH  /alerts/:id/read      Tek alarmi okundu isaretle
PATCH  /alerts/read-all      Tum alarmlari okundu isaretle
```

### Saglik Kontrolu

```
GET    /health               Sistem ve ML servisi durumu
```

---

## Proje Yapisi

```
ids-fullstack/
├── frontend/                   React + TypeScript
│   ├── src/
│   │   ├── components/         Tekrar kullanilabilir UI bilesenleri
│   │   │   ├── common/         MetricCard, LoadingSpinner, ProtectedRoute
│   │   │   └── layout/         Sidebar, Header, Layout
│   │   ├── pages/              LoginPage, DashboardPage, AnalysisPage,
│   │   │                       BatchAnalysisPage, LogsPage, AlertsPage,
│   │   │                       BlockedIPsPage
│   │   ├── services/           JWT interceptor ile Axios API istemcisi
│   │   ├── store/              Zustand auth store
│   │   ├── hooks/              Ozel veri cekme hook'lari
│   │   ├── types/              TypeScript arayuzleri
│   │   └── utils/              Yardimci fonksiyonlar
│   ├── Dockerfile              Multi-stage build (Node -> Nginx)
│   └── nginx.conf              SPA yonlendirme + API proxy
│
├── backend/                    Node.js + Express
│   ├── src/
│   │   ├── config/             Ortam yapilandirmasi, DB baglantisi
│   │   ├── controllers/        Rota isleyicileri
│   │   ├── middleware/         Auth (JWT+RBAC), dogrulama, hata yonetimi,
│   │   │                       rate limiting
│   │   ├── models/             Mongoose semalari (User, Prediction,
│   │   │                       BlockedIP, Alert)
│   │   ├── routes/             Express rota tanimlari
│   │   ├── services/           Is mantigi (auth, tahmin, ML proxy, email)
│   │   ├── utils/              Logger, DB seed scripti
│   │   └── validators/         Girdi dogrulama kurallari
│   ├── tests/                  Jest + Supertest API testleri
│   └── Dockerfile
│
├── ml-service/                 Python + FastAPI
│   ├── app.py                  ML cikarim endpoint'leri
│   ├── models/                 Egitilmis model dosyalari (git'te yok)
│   ├── tests/                  pytest API testleri
│   └── Dockerfile
│
├── docker-compose.yml          4 servisli orkestrasyon
├── .github/workflows/ci.yml    CI/CD pipeline
└── .env.example                Ortam degiskeni sablonu
```

---

## Guvenlik

- bcrypt ile sifre hashleme (12 round), JWT kimlik dogrulama
- Access ve refresh token rotasyonu
- Tum korumali endpoint'lerde rol tabanli erisim kontrolu
- Helmet guvenlik basliklari (X-Frame-Options, CSP, HSTS)
- Rate limiting: 15 dakikada 100 istek (genel), auth icin 10, tahmin icin dakikada 60
- Her endpoint'te express-validator ile girdi dogrulama
- CORS yapilandirilmis origin ile sinirli
- Ortam degiskenleri ile gizli bilgi yonetimi (asla commit edilmez)
- Kimlik dogrulamali MongoDB baglantisi

---

## Gelistirme

### Docker Olmadan Calistirma

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — ML Servisi
cd ml-service
pip install -r requirements.txt
uvicorn app:app --port 8000 --reload

# Terminal 3 — Backend
cd backend
npm install
npm run seed
npm run dev

# Terminal 4 — Frontend
cd frontend
npm install
npm run dev
```

### Testleri Calistirma

```bash
# Backend
cd backend && npm test

# ML Servisi
cd ml-service && pytest tests/ -v
```

---

## Veri Seti

Bu proje, Kanada Siber Guvenlik Enstitusu tarafindan olusturulan CIC-IDS 2017 veri setini kullanmaktadir. Veri seti, kontrolllu bir ortamda hem normal hem de saldiri trafiklerini iceren ag trafigi kayitlarindan olusmaktadir.

**Siniflar:** BENIGN, DoS, BruteForce, PortScan, WebAttack

**Not:** Bu sistem, onceden hesaplanmis ag akis ozellikleriyle calisan bir trafik siniflandirma motorudur. Canli ag paketlerini yakalamaz. Uretim ortamindaki bir IDS, ek olarak paket yakalama (scapy/tshark) ve akis birlestirme (CICFlowMeter) bilesenlerine ihtiyac duyar.

---

## Lisans

MIT