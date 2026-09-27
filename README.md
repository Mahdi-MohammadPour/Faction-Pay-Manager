# سامانه مدیریت حقوق پلیرها

یک سایت ساده برای مدیریت **فکشن‌ها، پلیرها، فعالیت‌ها و حقوق** که با HTML، CSS و JavaScript ساخته شده است.

این پروژه برای اجرا روی **GitHub Pages** آماده است و به خرید هاست یا دامنه نیاز ندارد.

## امکانات

- ساخت فکشن
- اضافه کردن پلیر و تعیین فکشن
- ساخت آیتم یا فعالیت با مبلغ دلخواه
- ثبت تعداد انجام هر فعالیت
- محاسبه خودکار مبلغ هر فعالیت
- محاسبه مجموع حقوق هر پلیر
- نمایش جمع کل همه پلیرها
- جستجوی پلیر
- فیلتر بر اساس فکشن
- حذف پلیر، فکشن، آیتم و رکورد پرداخت
- ذخیره اطلاعات در `localStorage` مرورگر

## ساختار فایل‌ها

```text
player-pay-calculator/
├── index.html
├── style.css
├── app.js
└── README.md
```

## نکته مهم درباره ذخیره اطلاعات

نسخه فعلی از `localStorage` استفاده می‌کند.

یعنی اطلاعات داخل مرورگری که سایت را با آن باز می‌کنی ذخیره می‌شوند. بنابراین اگر سایت را روی یک کامپیوتر باز کنی و بعد با یک گوشی یا کامپیوتر دیگر وارد شوی، اطلاعات قبلی به‌صورت خودکار مشترک نخواهند بود.

برای نسخه چندکاربره و واقعی باید در مرحله بعد یک دیتابیس و سیستم ورود اضافه شود.

## انتشار روی GitHub Pages

### ۱. ساخت Repository

در GitHub یک Repository عمومی بساز.

پیشنهاد:

```text
player-pay-calculator
```

Repository را روی `Public` بگذار.

### ۲. قرار دادن فایل‌ها

داخل Repository این فایل‌ها را در ریشه پروژه قرار بده:

```text
index.html
style.css
app.js
README.md
```

یعنی `index.html` باید مستقیماً در صفحه اصلی Repository باشد، نه داخل یک پوشه اضافی.

### ۳. فعال کردن GitHub Pages

داخل Repository برو به:

```text
Settings
→ Pages
```

در بخش:

```text
Build and deployment
```

گزینه زیر را انتخاب کن:

```text
Source: Deploy from a branch
```

بعد:

```text
Branch: main
Folder: /(root)
```

و روی `Save` بزن.

### ۴. آدرس سایت

اگر نام کاربری GitHub تو مثلاً:

```text
example-user
```

و نام Repository این باشد:

```text
player-pay-calculator
```

آدرس سایت می‌شود:

```text
https://example-user.github.io/player-pay-calculator/
```

به خرید هاست و دامنه نیاز نداری؛ GitHub Pages سایت را روی دامنه `github.io` منتشر می‌کند.

## تغییرات بعدی

هر بار که فایل‌های `index.html`، `style.css` یا `app.js` را در Branch اصلی تغییر بدهی و Commit کنی، نسخه جدید سایت منتشر می‌شود.

## این پروژه سرور محلی نمی‌خواهد

برای نسخه آنلاین GitHub Pages لازم نیست `python -m http.server` یا `http://localhost:8000` اجرا کنی.

`index.html` مستقیماً توسط GitHub Pages منتشر می‌شود.
