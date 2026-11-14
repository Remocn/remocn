# remocn

shadcn registry с готовыми анимациями, переходами и backgrounds для Remotion.

## Что это

Набор production-ready компонентов для создания видео в Remotion. Пользователи устанавливают компоненты через `npx shadcn add remocn/<component>` и собирают видео из готовых блоков.

## Целевая аудитория

Solo builders и маленькие команды (1-2 чел), фронтендер знакомый с экосистемой shadcn. Типичный сценарий: сделали продукт → нужно demo video → берут remocn.

## Архитектура

Плоское Next.js приложение в корне репозитория, пакетный менеджер — bun. Никакого монорепо, workspaces и turborepo.

- `app/` — Next.js App Router. `app/(home)/` — landing и standalone-страницы (`sponsors`, `changelog`), `app/docs/` — Fumadocs, `app/r/` — раздача registry-артефактов, `app/api/` — рендер и прочие endpoints
- `content/docs/` — MDX документации (fumadocs collection `docs`), `content/changelog/` — записи ченджлога (flat collection `changelog`)
- `registry/` — исходники компонентов: `remocn/` (анимации, переходы, backgrounds), `remocn-ui/` (UI-примитивы), `remocn-icons/` (иконки), `remocn-templates/` (готовые видео). У каждого неймспейса свой `registry.json`; `registry/__index__.tsx` — отдельный реестр превью для сайта
- `registry-artifacts/` — собранный shadcn-registry (`bun run registry:build`), коммитится в репозиторий
- `components/`, `lib/`, `config/`, `hooks/` — код сайта

## Уровни компонентов

- **Primitives** — отдельные анимации, переходы, backgrounds
- **Compositions** — готовые сцены, собранные из primitives
- **Templates** — полные видео, которые можно установить и использовать as-is

## Ключевые решения

- Плоский namespace: `remocn/fade-in`, `remocn/intro-scene`
- Remotion — prerequisite, не bootstrap'им его
- Own your code (shadcn philosophy) — файлы копируются в проект пользователя
- Все компоненты пишутся с нуля на Remotion API (`useCurrentFrame()`, `interpolate()`, `spring()`)
- Вдохновляемся reactbits.dev идеями, но НЕ копируем код (их лицензия MIT + Commons Clause запрещает порт)
- Превью на сайте через `@remotion/player` — интерактивный плеер в браузере
- Лицензия: MIT

## Документация — источник правды для агентов

Доки описывают компоненты и для людей, и для AI-агентов. Скилл `remocn` не хранит свою копию каталога, а читает документацию по URL, поэтому страница компонента — единственное место, где живут его пропсы, пример и сигнал выбора.

- Каждый item из registry обязан иметь страницу с `component: <name>` во frontmatter. Исключения перечислены в `UNDOCUMENTED` в `lib/docs-meta.test.ts` и требуют причины — это либы, внутренние примитивы и sub-item'ы, свёрнутые в страницу контейнера. Иконки документируются галереей, а не страницей на штуку
- Frontmatter компонента: `component`, `vibe` (одно из семи значений в `lib/docs-schema.ts`), `length`, `useWhen`, `avoidWhen` и `askedAs` — списки строк в двойных кавычках. Поля машинные, на странице не рендерятся
- `askedAs` — 5–8 формулировок, которыми компонент попросит человек, не видевший каталога: пара коротких запросов в 2–5 слов, пара фраз «хочу…», пара про задачу сцены. Без имени компонента и без слов из `description` там, где есть бытовой синоним («subtitles», а не «captions») — поле ценно именно словарём, которого в описании нет. На английском, до 90 символов, без двойных кавычек внутри. По этим строкам работает поиск, см. «Поиск компонентов»
- `length` — кадры **собственного движения** компонента при 30fps: у перехода это значение для `linearTiming`/`springTiming`, у остальных — момент, когда анимация закончилась. Это нижняя граница `Sequence`, а не длина бита: холд сверху добавляется отдельно. Поэтому `length` намеренно расходится с `durationInFrames` в `config.ts` — там длина демо-композиции вместе с холдом. `"state-driven"` — компонент рендерится из пропа `state` и своей длительности не имеет
- В `avoidWhen` называй компонент-замену в бэктиках. Тест валит сборку, если такого имени нет в registry
- `bun test lib/docs-meta.test.ts` — блокирующий шаг CI, отдельный от основного прогона тестов (тот пока `continue-on-error`)
- Агентские артефакты генерируются из этого frontmatter: `/llms-components.txt` (роутер по всем компонентам) и `/docs/**.md` (страница как чистый markdown, см. `lib/mdx-to-markdown.ts`)

## Поиск компонентов

Один поиск на два входа: `searchCatalog` в `lib/search/components.ts` обслуживает и MCP-тул `search_components`, и `/api/search` (диалог ⌘K в доках). Запрос — описание потребности на любом языке, а не только имя.

- Ранжирование гибридное (`lib/search/hybrid.ts`): лексический скор по `name`/`title`/`description`/`useWhen`/`askedAs` и семантика, слитые через reciprocal rank fusion. Слова держат точные имена, смысл — запросы, у которых с каталогом нет общих слов
- Семантика — локальная модель `multilingual-e5-small` в процессе сервера (`@huggingface/transformers`), без API-ключей и платы за запрос. Модель и размерность зашиты в `lib/search/model.ts`
- `bun run search:build` считает векторы (описание + каждая строка `askedAs`) в `.search/` и туда же кладёт модель. Каталог в git не попадает; Dockerfile собирает его перед `next build`. Нет индекса или модель не загрузилась — поиск молча работает по словам, поэтому в dev запускать сборку индекса не обязательно
- `/api/search` отдаёт результат в формате fumadocs: сначала гайды, которые запрос называет целиком (и только пара их строк), потом компоненты, потом остальные полнотекстовые совпадения (`lib/search/docs-merge.ts`)
- Аналитика поиска идёт в OpenPanel одним событием `search_performed` для всех, со свойствами `actor` (`human` / `agent`) и `surface` (`docs_dialog` / `mcp` / `api`). Человек: диалог (`components/docs/search-dialog.tsx`) шлёт события из браузера — запрос считается, когда на нём остановились (правила в `lib/search/dialog-session.ts`), плюс `search_result_selected` и `search_abandoned`. Агент: сервер шлёт `search_performed` из MCP-тула и из `/api/search` (всё, что пришло не из диалога) и `component_fetched` на `get_component` / `preview_component` — это аналог клика
- Текст поискового запроса агента пишется в аналитику (до 200 символов) — политика конфиденциальности (`app/(home)/legal/content.tsx`, «MCP server») это описывает. Брифы `plan_video` и пропсы `preview_component` не пишутся: расширять запись можно только вместе с правкой политики
- `bun run search:eval` меряет поиск на `evals/search/golden.json` (топ-1/5/10 для слов и для гибрида). Меняешь ранжирование, модель или правила `askedAs` — сверяйся с ним; новые запросы в эталон приветствуются

## Changelog

Любая ветка, которая добавляет или заметно меняет компоненты registry, обязана содержать запись ченджлога — в том же PR, что и сама фича.

- Одна запись = один файл `content/changelog/<YYYY-MM-DD>-<slug>.mdx`. Дата в имени файла — дата мержа
- Frontmatter: `title`, `date`, плюс опциональные `video` и `videoPoster` (без кавычек, без `: ` внутри значений). `date` парсится в JS `Date`; `video`/`videoPoster` — полные URL на внешний видео-хостинг (`https://` не ломает YAML, там нет `: `)
- Запись = веха, а не PR и не календарный день
- Заголовки: `h1` и `h2` принадлежат странице (`h2` рендерится из `title`). Внутри тела — только `h3` для групп `New components` / `Improvements` / `Fixes`
- Живое превью: `<ChangelogPreview name="component-name" />`, где `name` — ключ из `registry/__index__.tsx`. Опционально
- Ссылки на доки компонентов приветствуются: `[Zoom Blur](/docs/transitions/zoom-blur)`
- Весь текст — на английском
- Опубликованные записи не переименовываются: имя файла — это якорь (`/changelog#2026-07-08-transitions-revamp`), которым делятся

Два вида просмотра — `/changelog` (текст) и `/changelog/video` (лента роликов), обе строятся из одной коллекции.

- В ленту попадают только записи с полем `video`. Нет поля — записи в видео-ленте просто нет, сборка не падает
- Видео — готовый веб-файл mp4 по внешнему URL. Хранение, компрессия и постеры — на стороне видео-сервиса, сайт их не делает
- CDN-конвенция: `video: https://cdn.remocn.dev/videos/<name>.mp4`, `videoPoster: https://cdn.remocn.dev/posters/<name>.png`. `<name>` произвольный и не обязан совпадать со slug записи — маппинг живёт во frontmatter. Поля пишутся парой: есть `video` — есть и `videoPoster`
- Плеер: `muted` + `playsInline` + `loop`, автоплей только у самого видимого ролика, остальные с `preload="none"`. При `prefers-reduced-motion` автоплей глушится

## Бизнес-модель

Open core. Free примитивы и базовые compositions (MIT). В будущем — premium блоки и video builder.

## Команды

```bash
bun install              # установка зависимостей
bun dev                  # dev-сервер Next.js
bun run build            # production-сборка сайта
bun run typecheck        # tsc --noEmit
bun run lint             # biome check
bun run registry:build   # пересборка registry-artifacts из registry/
bun run search:build     # семантический индекс поиска + модель в .search/
bun run search:eval      # качество поиска на evals/search/golden.json

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
