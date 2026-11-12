/* Сторож: ловит ссылки на переменную темы, которой нет в файле.
   Vite не проверяет типы, поэтому такая ошибка доезжает до прода
   и падает только когда пользователь откроет именно этот экран. */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const TOKENS = /\b(t|th|theme|colors)\.(onInk|ink|field|onField|accent|attention|control|text|textSecondary|textMuted|textFaint|card|bg|border|borderLight)\b/g;
const files = globSync("src/**/*.tsx");
const problems = [];

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const seen = new Set();
  for (const m of src.matchAll(TOKENS)) seen.add(m[1]);
  for (const v of seen) {
    const declared = new RegExp(
      `(?:const|let|var)\\s+${v}\\b|\\(\\s*\\{[^}]*\\b${v}\\b[^}]*\\}\\s*\\)|\\(\\s*${v}\\s*[,)]|\\b${v}\\s*:`
    ).test(src);
    if (!declared) problems.push(`${file}: используется «${v}», но переменная не объявлена`);
  }
}

if (problems.length) {
  console.error("\nПеременная темы не объявлена:\n" + problems.map((p) => "  " + p).join("\n") + "\n");
  process.exit(1);
}
console.log("Проверка переменных темы: чисто");
