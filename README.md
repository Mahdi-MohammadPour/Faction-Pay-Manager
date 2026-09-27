# سامانه مدیریت حقوق پلیرها

یک سایت ساده برای مدیریت **فکشن‌ها، پلیرها، فعالیت‌ها و حقوق** که با HTML، CSS و JavaScript ساخته شده است.

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


## Payroll additions

- Each player can be configured as **Member** or **Subleader**.
- Subleaders use a fixed salary and are excluded from Activity Bonus rankings.
- Four FW slots are available per player. Each selected FW deducts 10% of that player's salary basis.
- Activity Bonus ranks only regular members by activity earnings. Default rewards are 3,000,000 / 2,000,000 / 1,000,000 for ranks 1–3 and can be edited in the UI.
- The final salary shown by the app is: salary basis - FW deduction + Activity Bonus.
