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
- `registry/` — исходники компонентов: `remocn/` (анимации, переходы, backgrounds), `remocn-ui/` (UI-примитивы), `remocn-icons/` (иконки). У каждого неймспейса свой `registry.json`; `registry/__index__.tsx` — отдельный реестр превью для сайта
- `registry-artifacts/` — собранный shadcn-registry (`bun run registry:build`), коммитится в репозиторий
- `components/`, `lib/`, `config/`, `hooks/` — код сайта

## Два уровня компонентов

- **Primitives** — отдельные анимации, переходы, backgrounds
- **Compositions** — готовые сцены, собранные из primitives

## Ключевые решения

- Плоский namespace: `remocn/fade-in`, `remocn/intro-scene`
- Remotion — prerequisite, не bootstrap'им его
- Own your code (shadcn philosophy) — файлы копируются в проект пользователя
- Все компоненты пишутся с нуля на Remotion API (`useCurrentFrame()`, `interpolate()`, `spring()`)
- Вдохновляемся reactbits.dev идеями, но НЕ копируем код (их лицензия MIT + Commons Clause запрещает порт)
- Превью на сайте через `@remotion/player` — интерактивный плеер в браузере
- Лицензия: MIT

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
