/**
 * Рукотворные элементы: след руки вместо геометрии.
 * Сдержанно — только галочка и фактура бумаги, иначе превращается в скевоморфизм.
 */

/** Галочка, нарисованная пером: неровная, с переменной толщиной линии. */
export function InkCheck({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 13.2c1.6 1.1 3.3 2.9 4.6 4.7 1.4-3.6 5-8.9 10.2-12.4"
        stroke={color}
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Подчёркивание от руки — для акцентов в заголовках. */
export function InkUnderline({ width = 120, color = "#5B8A64" }: { width?: number; color?: string }) {
  return (
    <svg width={width} height="7" viewBox="0 0 120 7" fill="none" preserveAspectRatio="none" aria-hidden>
      <path d="M2 4.6C22 2.3 46 1.6 70 2.4c16 .5 34 1.8 48 2.9" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Разделитель с лёгкой неровностью вместо линейки в 1 пиксель. */
export function InkDivider({ color = "#D8D1C6" }: { color?: string }) {
  return (
    <svg width="100%" height="5" viewBox="0 0 300 5" fill="none" preserveAspectRatio="none" aria-hidden>
      <path d="M1 3.1C48 1.9 96 1.6 150 2.2c42 .5 84 1.2 149 1.6" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
