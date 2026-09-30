OFFLINE CHESS v2.0

Fayllar:
- index.html
- css/style.css
- js/chess.js
- js/bot.js
- js/ui.js
- js/app.js

Yangiliklar:
1. Profil sahifasi: ism localStorage orqali shu qurilmada saqlanadi.
2. Shaxmat donalari: SVG ko'rinishidagi RhosGFX/Lichess uslubidagi donalar; internet bo'lmasa Unicode fallback ishlaydi.
3. Bot: Easy, Medium, Hard, Expert, Master, Champion.
4. Botda alpha-beta qidiruv, move ordering, positional evaluation, quiescence va transposition table qo'shildi.
5. Shaxmat qoidalari uchun allLegalMoves(color) muammosi tuzatildi; endi bot oq/qora yurishlarni to'g'ri hisoblaydi.

Ishga tushirish:
index.html faylini brauzerda oching.

Eslatma:
Dona SVG URL'lari internet mavjud bo'lsa tashqi ikonalarni yuklaydi. Internet bo'lmasa avtomatik ravishda ichki Unicode fallback ko'rsatiladi, shuning uchun o'yin ishlashda davom etadi.
