/**
 * Оплата через ЮKassa временно отключена: магазин не активен.
 * Пока false — всем авторизованным пользователям открыт полный доступ,
 * блок тарифа и кнопки оплаты скрыты. Чтобы включить оплату обратно — поставить true
 * и задать секреты YOOKASSA_SHOP_ID_RUTINA / YOOKASSA_SECRET_KEY_RUTINA / SITE_URL_RUTINA в Supabase.
 */
export const PAYMENTS_ENABLED = false;
