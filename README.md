# lab6-tournaments-esm

Полный проект "Платформа для организации турниров".

**Запуск (разработка)**
1. Установите зависимости backend: `npm install`
2. В одной вкладке терминала запустите сервер: `npm start` (порт 3000)
3. В другом терминале перейдите в client: `cd client` и выполните `npm install` и `npm run dev` для запуска Vite (обычно на порту 5173).

**Запуск (production-like)**
1. В клиенте: `cd client` -> `npm install` -> `npm run build`
2. Вернуться в корень и `npm start` — сервер раздаст сборку из client/dist.

API endpoints:
- GET /tournaments
- GET /teams
- GET /matches
- POST /register
- POST /match-result
- DELETE /match/:id
- GET /export (Accept header aware)
- GET /download?format=json|xml|html
