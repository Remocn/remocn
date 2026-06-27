# @remocn/render-sdk

OSS engine-библиотека для рендера [Remotion](https://remotion.dev) с адаптерами по бэкенду
исполнения. По духу — как [files-sdk](https://github.com/haydenbleasel/files-sdk): один
маленький честный API, swappable-адаптеры за единым контрактом, нативный SDK как escape hatch.

Отдельный проект в отдельном репозитории. Лицензия — MIT.

---

## 1. Зачем

Механизм рендера в remocn уже **дублируется**: `lib/server/render-queue.ts` +
`app/api/render/*` (github-stars), и его copy-paste в `lib/server/site-video/*` +
`app/api/site-video/render/*` на ветке `feat/site-to-video` (два независимых `p-limit`
в одном процессе). На подходе третий потребитель — **studio** (`studio.remocn.dev`,
отдельный деплой). Один render-движок нужен всем трём.

SDK решает: создать render-job, узнать состояние/прогресс, получить результат (url/поток) —
единым контрактом поверх разных бэкендов (self-hosted server, AWS Lambda).

## 2. Граница ответственности

> **«Ты даёшь нам `serveUrl` (+ `functionName` для lambda) — мы владеем всем от `start()` и дальше.»**

- **Где кончается Remotion-провижининг (`bundle` / `deploySite` / `deployFunction`) — там начинаемся мы.** Провижининг остаётся на пользователе/CI; SDK его не оборачивает (обёртки были бы pass-through-зеркалами Remotion-API, ломкими при смене версий).
- **SDK не поставляет HTTP** (ни handler, ни браузерный клиент). Транспорт — рецепты в доках.
- **SDK не валидирует `inputProps`** — их форму знает только consumer (он знает свою композицию). Domain-валидация (например, лимит стэйгейзеров, hex-цвет, SSRF) живёт в приложении.
- **SDK не владеет каталогом результатов** — список готовых видео это забота БД consumer'а (studio/drizzle) или files-sdk поверх того же бакета.

## 3. Упаковка

Один пакет + subpath exports, `@remotion/*` — **optional peer deps** (ставишь только нужный бэкенд).

```
@remocn/render-sdk          → RenderSdk, типы, InMemoryStore, waitForCompletion, RenderError
@remocn/render-sdk/server   → RenderServer   (peer: @remotion/renderer)
@remocn/render-sdk/lambda   → RenderLambda   (peer: @remotion/lambda)
```

```ts
import { RenderSdk } from "@remocn/render-sdk";
import { RenderServer } from "@remocn/render-sdk/server";
import { RenderLambda } from "@remocn/render-sdk/lambda";
```

`@remotion/bundler` **не peer-dep SDK** — он нужен только в build-скрипте пользователя.

Адаптеры `server`/`lambda` должны идти на **одной** версии Remotion (lambda-функция и
бандл обязаны совпадать). SDK делает рантайм-ассершн совпадения версий
(бандл ↔ функция ↔ renderer) и кидает `RenderError`, если они разъехались.

## 4. Публичная поверхность (v1)

Вся серверная. HTTP-слой — на стороне consumer'а.

```ts
start(input: RenderInput, options?: OptionsOf<A>): Promise<RenderHandle>
getState(handle: RenderHandle): Promise<RenderState>
getUrl(handle: RenderHandle): Promise<string>
download(handle: RenderHandle): Promise<ReadableStream>
waitForCompletion(handle: RenderHandle, opts?: WaitOptions): Promise<RenderState>
```

| Метод | Делает |
|---|---|
| `start` | Создаёт render-job, возвращает сериализуемый `handle`. server — кладёт в лимитер; lambda — стреляет сразу. |
| `getState` | Pull-состояние. server — из state-store; lambda — `getRenderProgress` из AWS. |
| `getUrl` | Единый url у всех адаптеров (см. §7). Детерминирован, валиден при `status === "done"`. |
| `download` | Поток результата. server — чтение с диска; lambda — фетч S3. |
| `waitForCompletion` | Серверный «запусти и жди» — цикл над `getState` до `done`/`error`. Для CLI/cron/webhook и lambda-поллинга. |

## 5. Типы

```ts
type RenderStatus = "queued" | "rendering" | "done" | "error";

// Сериализуемый opaque-токен. Один тип у всех адаптеров.
type RenderHandle = string & { readonly __brand: unique symbol };

type RenderState = {
  status: RenderStatus;
  progress: number;        // 0..1
  error?: string;          // только при status === "error"
};

type RenderInput = {
  compositionId: string;                  // единственное required
  inputProps?: Record<string, unknown>;   // форму валидирует consumer
  serveUrl?: string;                       // override дефолта из конфига адаптера
  codec?: Codec;                           // дефолт "h264"
  frameRange?: [number, number];
  scale?: number;
  width?: number;
  height?: number;                         // override размеров (как stars делает per-orientation)
  jpegQuality?: number;
  pixelFormat?: PixelFormat;
};

type WaitOptions = {
  onProgress?: (progress: number) => void;
  intervalMs?: number;                     // дефолт ~1000
  signal?: AbortSignal;
  timeoutMs?: number;
};

class RenderError extends Error {
  code:
    | "invalid_input"
    | "render_failed"
    | "timeout"
    | "not_found"
    | "version_mismatch"
    | "adapter_error";
}
```

### Жёсткое требование по типизации

Всё **выводится автоматически из переданного адаптера** — пользователь **не пишет `as Type`**.

```ts
interface RenderAdapter<TOptions> {
  start(input: RenderInput, options?: TOptions): Promise<RenderHandle>;
  getState(handle: RenderHandle): Promise<RenderState>;
  getUrl(handle: RenderHandle): Promise<string>;
  download(handle: RenderHandle): Promise<ReadableStream>;
}

function RenderServer(config: ServerConfig): RenderAdapter<ServerOptions>;
function RenderLambda(config: LambdaConfig): RenderAdapter<LambdaOptions>;

class RenderSdk<A extends RenderAdapter<any>> {
  constructor(config: { adapter: A; store?: StateStore }) {}
  start(input: RenderInput, options?: OptionsOf<A>): Promise<RenderHandle> { /* ... */ }
}
```

```ts
const render = new RenderSdk({ adapter: RenderLambda({ region, functionName, serveUrl }) });
render.start({ compositionId: "x" }, { framesPerLambda: 20 }); // options авто-типизирован как LambdaOptions
render.start({ compositionId: "x" }, { chromiumOptions: {} }); // ❌ ошибка компиляции: нет у lambda
```

## 6. Конфиги адаптеров

```ts
// SERVER
RenderServer({
  serveUrl: "./.remotion-bundle",          // ВХОД: бандл (даёт пользователь/CI)
  workDir: "/srv/renders",                 // ВЫХОД-ЗАПИСЬ: локальный путь (обязателен)
  publicUrl?: "https://remocn.dev/renders",// ОПЦ: http-база, на которой ТЫ раздаёшь workDir
  concurrency?: 2,                          // лимитер (per-process)
});

// LAMBDA
RenderLambda({
  region: "us-east-1",
  functionName: "remotion-render-4-0-xxx", // из deployFunction
  serveUrl: "https://....s3.../sites/app/index.html", // из deploySite
});

// SDK
new RenderSdk({
  adapter: RenderServer({ /* ... */ }),
  store?: InMemoryStore(),                  // дефолт; подменяется на Redis/SQL
});
```

`serveUrl` (вход — бандл) и `workDir`/`publicUrl` (выход) — **разные оси**, не путаются.

### Adapter-specific options (escape hatch, второй аргумент `start`)

```ts
type ServerOptions = {
  concurrency?: number;            // override лимитера на джоб
  chromiumOptions?: ChromiumOptions;
  timeoutInMilliseconds?: number;
};

type LambdaOptions = {
  framesPerLambda?: number;
  webhook?: WebhookConfig;         // нативный webhook лямбды
  privacy?: "public" | "private";
  outName?: string;
  maxRetries?: number;
};
```

## 7. Единый `getUrl`

Тип всегда `Promise<string>`, инстанс не блокируется отсутствием `publicUrl`.

| Адаптер / конфиг | `getUrl(handle)` |
|---|---|
| Server c `publicUrl` | `${publicUrl}/${handle}.${ext}` |
| Server без `publicUrl` | `${handle}.${ext}` (просто имя файла — конкатенируешь сам) |
| Lambda | S3 url (signed при приватном бакете) |

- Файл создаёт и именует **сам** server-адаптер: `${workDir}/${handle}.${ext}`.
- `ext` зависит от `codec` (per-render): server берёт из state-store, lambda — из закодированного в `handle`.
- `publicUrl` **сам по себе ничего не раздаёт** — доступность файла обеспечивает пользователь (nginx/CDN/volume, раздающий `workDir`); SDK лишь конкатенирует строку.

## 8. Жизненный цикл (браузерный сценарий)

```
БРАУЗЕР                              CONSUMER (свои роуты)            @remocn/render-sdk
  │ POST /api/render {inputProps} ──► POST-роут (валидация/auth) ───► start()
  │ ◄──────────────────────────────── { handle } ◄───────────────── handle
  │
  │ poll каждые ~700мс:
  │ GET /api/render/{handle} ───────► GET-роут ───────────────────► getState(handle)
  │ ◄──────────────────────────────── { status, progress }
  │ ... обновляет прогресс-бар ...
  │ ◄──────────────────────────────── { status: "done" }
  │
  │ GET <getUrl(handle)> ───────────► (статик-раздача ИЛИ роут → download(handle)) ─► поток
  │ ◄═══════════════════ mp4 ════════════════════════════════════
```

Сервер-сценарий (CLI/cron/webhook): `const h = await render.start(...); await render.waitForCompletion(h, { onProgress })`.

## 9. State-store SPI

```ts
interface StateStore {
  create(handle: RenderHandle, initial: RenderRecord): Promise<void>;
  get(handle: RenderHandle): Promise<RenderRecord | null>;
  update(handle: RenderHandle, patch: Partial<RenderRecord>): Promise<void>;
  delete(handle: RenderHandle): Promise<void>;
}

type RenderRecord = {
  status: RenderStatus;
  progress: number;
  error?: string;
  codec: Codec;            // → ext для getUrl/download
  createdAt: number;
  meta?: Record<string, unknown>; // consumer-данные (repo/имя/превью), SDK домена не знает
};
```

- **server** опирается на store как на source-of-truth прогресса (пишет `onProgress` → читает `getState`).
- **lambda** store не использует — состояние в AWS.
- Дефолт — `InMemoryStore`. Для multi-instance/persist подменяется на Redis/SQL.

## 10. Семантика server vs lambda

| | server | lambda |
|---|---|---|
| Исполнение | `@remotion/renderer` в процессе | distributed на AWS |
| Состояние | state-store | `getRenderProgress` из AWS |
| Очередь | лимитер `concurrency` (per-process) | нет, AWS масштабирует сам |
| `getUrl` | `publicUrl`/имя файла + `${handle}.${ext}` | S3 url |
| `download` | чтение с диска `workDir` | фетч S3 |
| handle кодирует | jobId (+ext из стора) | renderId + bucket + region + ext |
| Заливка результата | нет (локальный файл) | обязательно в S3 (так устроена лямбда) |

## 11. Рецепты транспорта (раздел «client» в доках)

### Next.js — POST (твой) + два GET

```ts
// app/api/render/route.ts  — твоя валидация/rate-limit/auth здесь
export async function POST(req: Request) {
  const input = parseRenderInput(await req.json());       // твоя domain-валидация
  const handle = await render.start({ compositionId: "github-stars", inputProps: input });
  return Response.json({ handle });
}
```
```ts
// app/api/render/[handle]/route.ts  — поллинг
export async function GET(_req, { params }) {
  const { handle } = await params;
  return Response.json(await render.getState(handle));
}
```
```ts
// app/api/render/[handle]/download/route.ts  — если workDir НЕ раздаётся статикой
export async function GET(_req, { params }) {
  const { handle } = await params;
  const stream = await render.download(handle);
  return new Response(stream, { headers: { "Content-Type": "video/mp4" } });
}
```

### Браузерный poll-loop

```ts
const { handle } = await (await fetch("/api/render", { method: "POST", body })).json();
const tick = async () => {
  const s = await (await fetch(`/api/render/${handle}`)).json();
  setProgress(s.progress);
  if (s.status === "done") return downloadFrom(await getUrlSomehow(handle));
  if (s.status === "error") throw new Error(s.error);
  setTimeout(tick, 700);
};
```

## 12. Рецепты провижининга (на стороне пользователя)

### Server — бандл (build-шаг)

```ts
import { bundle } from "@remotion/bundler";
const serveUrl = await bundle({ entryPoint, webpackOverride });
// → передать serveUrl в RenderServer({ serveUrl })
```

### Lambda — деплой (CI)

```ts
import { deploySite, deployFunction } from "@remotion/lambda";
const { functionName } = await deployFunction({ region, /* ... */ });
const { serveUrl } = await deploySite({ region, entryPoint, /* ... */ });
// → передать в RenderLambda({ region, functionName, serveUrl })
```

## 13. Интеграции

- **stars (remocn.dev):** заменяет `lib/server/render-queue.ts` + `render.ts` на `RenderServer`; `validate-input.ts` остаётся в приложении; `use-mp4-export.ts` поллит свои роуты.
- **site-video:** убирает дубль `lib/server/site-video/*` — **stars и site-video шарят один инстанс `RenderSdk`** (один лимитер на процесс, чинит баг с двумя `p-limit`).
- **studio (studio.remocn.dev):** свой инстанс SDK (отдельный деплой/процесс); записывает каждый рендер в **свою drizzle-БД** `(project_id, user_id, handle, url, created_at)` → «получать готовые видео» = запрос к своей БД. Одна generic-композиция + JSON-spine в `inputProps`.

## 14. Вне scope v1 (осознанно)

- **cancel** — у lambda нет нативной отмены; running-отмена server кросс-процессно тоже нетривиальна. Убрано целиком.
- **list / delete** — каталог результатов это БД consumer'а или files-sdk.
- **авто-очистка** (TTL-sweep, delete-after-download) — пользователь чистит сам как хочет.
- **storage-адаптер / upload** — нет внутреннего потребителя; нужно залить в своё место → `download` → свой инструмент (рецепт в доках).
- **провижининг-обёртки** — pass-through-зеркала Remotion, не делаем.
- **браузерный клиент / HTTP-handler** — транспорт это рецепты в доках.

## 15. Известные ограничения v1

- **State / лимитер / url — per-process.** Multi-instance → нужен общий store (Redis) и sticky-routing / shared volume для статик-раздачи `workDir`. Single-process деплой (как remocn на Coolify) работает из коробки.
- **`getUrl` валиден только при `status === "done"`** (до этого файл/объект не готов → 404).
- **Cloud Run / Vercel Sandbox / WebCodecs** — не в v1 (Cloud Run у Remotion в alpha и не развивается; остальное — кандидаты на будущие адаптеры).

## 16. Будущее (v1.1+)

- Redis/SQL `StateStore` (durable, multi-instance).
- Тонкий браузерный клиент (`@remocn/render-sdk/client`) — убрать дублирование poll-loop.
- `cancel` (hard для server, soft для lambda + `capabilities`).
- Адаптеры: Vercel Sandbox, Cloud Run (после порта lambda-рантайма).
```
