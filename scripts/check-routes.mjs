/* Сторож: каждая внутренняя ссылка должна вести на существующий маршрут.
   Без него опечатка в пути молча доезжает до прода и даёт 404. */
import { readFileSync, globSync } from "node:fs";

const routesSrc = readFileSync("src/app/routes.ts", "utf8");
const routes = new Set(["/", "/auth", "/app"]);
for (const m of routesSrc.matchAll(/path: "([^"]*)"/g)) {
  const p = m[1];
  if (p === "*" || p === "/") continue;
  routes.add(p.startsWith("/") ? p : "/app/" + p);
}

const problems = [];
for (const file of [...globSync("src/**/*.tsx"), ...globSync("src/**/*.ts")]) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/navigate\("(\/[^"]*)"\)/g)) {
    const target = m[1].split("?")[0];
    if (routes.has(target)) continue;
    problems.push(`${file}:${src.slice(0, m.index).split("\n").length}  →  ${m[1]}`);
  }
}

if (problems.length) {
  console.error("\nСсылка на несуществующий маршрут:\n" + problems.map((p) => "  " + p).join("\n") + "\n");
  process.exit(1);
}
console.log("Проверка маршрутов: чисто");
