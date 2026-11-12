# Рутина («Листик»)

Приложение для рутины, привычек и трекинга настроения. Экспорт из Figma Make: [макет](https://www.figma.com/design/68IKsoVj1gIQAhEmPidj1t/%D0%A0%D1%83%D1%82%D0%B8%D0%BD%D0%B0).

## Стек
- Фронт: React + Vite + Tailwind (`src/`)
- Бэкенд: Supabase, проект `rutina` (`oqucupnybysgiekdagzu`, eu-central-1)
  - Edge Functions: `make-server-ff738703` (основной API), `create-payment-rutina`, `yookassa-webhook-rutina`
  - Таблицы: `kv_store_ff738703`, `kv_store_a5927615`, `user_access` — см. `supabase/migrations/`

## Запуск
```
npm i
npm run dev
```

## Деплой фронта
`.github/workflows/deploy.yml` — на push в `main` собирает и заливает `dist/` в Yandex Object Storage.
Нужны секреты репозитория: `YC_ACCESS_KEY_ID`, `YC_SECRET_ACCESS_KEY`, `YC_BUCKET`. Без них шаг деплоя пропускается.

## Секреты Edge Functions (Supabase → Edge Functions → Secrets)
- `OPENAI_API_KEY` — чат с Листиком и озвучка медитаций
- `ADMIN_SECRET_KEY` — админ-панель

## Оплата (ЮKassa) — отключена
Магазин не активен. Флаг `PAYMENTS_ENABLED` в `src/app/components/payments-config.ts` = `false`: всем авторизованным открыт полный доступ, тариф и кнопки оплаты скрыты. Платёжные функции отвечают 503.

Чтобы включить: поставить флаг в `true` и задать в Supabase секреты `PAYMENTS_ENABLED=true`, `YOOKASSA_SHOP_ID_RUTINA`, `YOOKASSA_SECRET_KEY_RUTINA`, `SITE_URL_RUTINA`; в кабинете ЮKassa указать вебхук `https://oqucupnybysgiekdagzu.supabase.co/functions/v1/yookassa-webhook-rutina`.
