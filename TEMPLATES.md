# remocn Templates — каталог сценариев и анимаций

Дизайн-спецификация нового верхнего уровня реестра — **templates**: цельные многосценовые видео, собранные из **типографики, примитивов и новых компонентов**. Для каждого шаблона — сценарий (по битам, с кадровыми диапазонами @30fps), хореография анимаций, переходы, фон и сокращённый config.

> Это design-документ (не код). Идентификаторы компонентов — реальные имена из `registry/remocn/`; компоненты, помеченные **New:**, — предложенные к созданию.

## Что такое template

```
primitive (одна анимация) + типографика + новый компонент → SCENE → TEMPLATE (полный ролик)
```

Template — **тонкий оркестратор**: `<TransitionSeries>` сшивает сцены. Каждая сцена собирается из текст-анимаций (герой кадра), числовых/датавиз-примитивов, фонов и новых лёгких компонентов. Свой код template почти не содержит — только последовательность сцен и проброс данных.

## Важно: отказ от уровня «compositions»

Прежний промежуточный уровень **compositions** (`hero-device-assemble`, `browser-flow`, `dashboard-populate`, `ai-generation-canvas`, `ecosystem-constellation`, `infinite-bento-pan`, `live-code-compilation`, `terminal-to-browser-deploy`, `pricing-tier-focus`) **не используется** и помечен к удалению. Templates строятся напрямую из примитивов; всё, что раньше давала composition (UI-кадр, дашборд, девайс, созвездие), переосмыслено как **новые лёгкие типографические компоненты** — они собраны в разделах **New:** под каждым шаблоном.

## Зафиксированные архитектурные решения

1. **Структура** — многосценовое видео через `@remotion/transitions` `<TransitionSeries>`.
2. **Источник сцен** — типографика + примитивы + новые компоненты (НЕ compositions). Тонкий оркестратор: общие сцены тянутся через `registryDependencies`, уникальные — доп. файлы в папке template.
3. **Контент API** — единый типизированный config-объект `{ meta, theme, scenes[] }`. Чистый сериализуемый JSON, без JSX в данных.
4. **Длительность** — у каждой сцены явный `durationInFrames`; общая = сумма минус overlap переходов. Каждый template экспортирует `getXDuration(config)`.
5. **Переходы** — брендовые presentation поверх `TransitionSeries` (`linearTiming` / `springTiming`), с первого дня.
6. **Glue/новые сцены** — живут как доп. файлы в папке template (`components/remocn/<template>/`), внутренние импорты относительные.
7. **Превью в доках** — `@remotion/player` с дефолтным `example.ts` config + chapter-навигация по сценам; без живого кастомайзера.
8. **Тема** — верхнеуровневый `theme` маппится оркестратором в пропсы дочерних сцен; акцент задаётся один раз.
9. **Монетизация** — все templates free (MIT); paywall на будущем studio/video-builder, не на контенте.
10. **Studio** — формат config проектируем под удобство templates сейчас, мост к studio-spine делаем позже.
11. **Размещение** — новая секция `Templates` в доках, таб Components; плоский namespace `remocn/<template>`.

## Глобальные конвенции

- **fps = 30**, формат по умолчанию **1920×1080** (16:9). `[9:16]` — вертикаль 1080×1920. `[N]` — переменная длина (зависит от количества элементов в контенте).
- **Типографика — герой.** Чистая, редакторская; кинетический текст несёт смысл, а не украшает.
- **Remotion-идиомы:** `useCurrentFrame()`, `interpolate(frame, [a,b], [x,y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })`, `spring({ frame, fps, config })`, `<Sequence from>`, `interpolateColors`.
- **Запрещено:** `mesh-gradient-bg` (плохой). Фоны — `volumetric-rays`, `dynamic-grid`, `spotlight-card`, `infinite-marquee` (как фон) или сплошной `theme.background`.
- **Анти-слоп:** никаких декоративных glow/blur-свечений, radial-gradient-блобов, decorative letter-spacing / uppercase / gradient-text.

## Два слоя результата

1. **Templates** — 43 готовых ролика (ниже).
2. **Новые компоненты (`New:`)** — каждый шаблон предлагает 1–3 новых лёгких компонента взамен удаляемых compositions. Сводный список новых компонентов — главный побочный продукт каталога: их строят один раз, дальше шаблоны собираются почти бесплатно.

Часто переиспользуемые новые сцены: `title-scene`, `cta-scene`, `stat-recap`, `quote-card`, `step-scene`, `changelog-list`, `countdown`, `ui-frame` (лёгкая рамка экрана), `version-badge`, `comparison-split`, `pricing-column`, `plan-table`, `stat-grid`, `speaker-card`, `role-card`, `digest-item`, `logo-sting`, `lower-third`, `bumper`, `command-line`.

## Индекс по families

- **A. Product & Launch** — Product Demo, Feature Announcement, Launch/Coming Soon, App Store Preview, Waitlist, Brand Sizzle
- **B. Release & Updates** — Changelog, Version Bump, Patch Notes, Roadmap Reveal, Migration Guide
- **C. Growth & Social Proof** — Testimonial Reel, Tweet Wall, Milestone, Social Proof Stats, Review Spotlight
- **D. Developer / OSS** — OSS Repo Showcase, CLI/Tool Demo, Code Walkthrough, API/SDK Intro, Integration Announcement, Deploy Story
- **E. Data & Metrics** — Year in Review, Dashboard Tour, Metrics Report, Funnel/Growth Story, Comparison/Before–After
- **F. Onboarding & Education** — App Walkthrough, Tutorial/How-To, Empty→Populated, Tooltip Tour
- **G. Marketing & Events** — Webinar Promo, Sale/Discount, Newsletter Digest, Hiring, Podcast Promo
- **H. Brand & Identity** — Logo Reveal Pack, Lower-Third, Intro/Outro Bumper
- **I. Sales & Conversion** — Pricing Reveal, Plan Comparison, Case Study, ROI/Savings

---
## A. Product & Launch

Семейство роликов «продукт и запуск»: от полноценного демо до 6-секундного стинга. Везде герой — типографика (kinetic type, editorial), а «сцены» собираются из примитивов и новых придуманных компонентов. Composition-уровень не используется.

---

### A1. Product Demo `[N]`
**Повод:** solo builder выкатил MVP и записывает ~30-секундный обзор для лендинга и Product Hunt: что это, какие N фич, куда нажать.
**Длительность:** ~24–34 сек (720–1020 кадров) при N=3–5. Формула: `total = 150 (hero) + N·180 (feature) + 120 (CTA) − (N+1)·15 overlap`.
**Фон:** `dynamic-grid` на hero и CTA (техно-каркас продукта), solid `theme.background` под feature-кадрами, чтобы UI-кадр читался.
**Сценарий (beats):**
1. **0–150f · ProductHero** — на чистом фоне крупное имя продукта собирается из символов, под ним одностроковый pitch; уверенно, спокойно.
2. **150–330f · Feature #1** — слева feature-кадр (новый UI-frame), справа заголовок фичи + короткий буллет; «вот что внутри».
3. **330–510f · Feature #2** — кадр и текст меняются местами (зеркало), ритм держит внимание.
4. **510–690f · Feature #3..N** — повтор паттерна, каждая фича — отдельный editorial-разворот.
5. **690–810f · CTA** — призыв и домен, фокус на действии.
**Анимации:**
- *ProductHero*: имя — `kinetic-center-build` (символы слетаются к центру, spring damping 14, stagger 3f), pitch — `soft-blur-in` за 18f; exit — `blur-out-up`.
- *Feature*: заголовок — `per-word-crossfade` (stagger 5f), буллет — `staggered-fade-up` (stagger 4f, y 24→0); UI-frame оживляется через `marker-highlight` на ключевой строке; emphasis — `micro-scale-fade` на иконке фичи.
- *CTA*: `mask-reveal-up` для строки призыва, домен — `tracking-in` (только лёгкое схождение букв, без декоративного разгона после стопа).
**Переходы:** hero→feature — `shared-axis-z` (продукт «вдавливается», фича выезжает вперёд, springTiming ~22f); feature↔feature — `spatial-push` по горизонтали в сторону зеркала (linearTiming 18f); feature→CTA — `zoom-through-transition` (springTiming ~20f).
**Config (сокращённо):**
```ts
{
  meta: { fps: 30, width: 1920, height: 1080 },
  theme: { accent: "#6366F1", background: "#0B0B0F", fontFamily: "Geist" },
  scenes: [
    { type: "product-hero", durationInFrames: 150, content: { name: "Switchboard", pitch: "Один инбокс для всех каналов" }, transition: { type: "shared-axis-z", timing: { kind: "spring", durationInFrames: 22 } } },
    { type: "feature-frame", durationInFrames: 180, content: { title: "Единый инбокс", bullet: "Email, чат и SMS в одном потоке", side: "left" }, transition: { type: "spatial-push", direction: "left" } },
    { type: "feature-frame", durationInFrames: 180, content: { title: "Авто-маршрутизация", bullet: "Письма уходят нужному человеку", side: "right" }, transition: { type: "zoom-through-transition" } },
    { type: "cta-scene", durationInFrames: 120, content: { line: "Попробуй бесплатно", domain: "switchboard.app" } },
  ],
}
```
**Reuse:** `kinetic-center-build`, `soft-blur-in`, `blur-out-up`, `per-word-crossfade`, `staggered-fade-up`, `marker-highlight`, `micro-scale-fade`, `mask-reveal-up`, `tracking-in`, `dynamic-grid`, `cta-scene`, переходы `shared-axis-z` / `spatial-push` / `zoom-through-transition`.
**New:**
- `feature-frame` — editorial-разворот фичи: с одной стороны компонент-кадр UI, с другой колонка «заголовок + буллет»; пропсы `title`, `bullet`, `side: 'left'|'right'`, `frame: ReactNode`, `accent`.
- `ui-snapshot-card` — чистая бесфоновая карточка-кадр интерфейса (скруглённый контейнер, строка-«браузерный» хедер из точек, контент-слот), вписывается в `feature-frame`; пропсы `header?`, `children`, `radius`, `borderColor`.
- `product-hero` — hero-сцена имени продукта: крупный wordmark + pitch с пресетной типо-анимацией; пропсы `name`, `pitch`, `entrance: 'kinetic-center-build'|'per-character-rise'`.

---

### A2. Feature Announcement
**Повод:** в продукт завезли одну заметную фичу, нужен ролик «Introducing X» для твита и changelog-баннера.
**Длительность:** ~12 сек (360 кадров).
**Фон:** `spotlight-card` — мягкий направленный свет ведёт взгляд к названию фичи (без glow-блобов, чисто spotlight-маска).
**Сценарий (beats):**
1. **0–90f · Kicker** — мелкий kicker «Introducing» проявляется первым, задаёт ожидание.
2. **90–240f · FeatureName** — крупное имя фичи врывается в центр, спотлайт «зажигается» под ним; пик внимания.
3. **240–360f · Payoff** — одностроковое объяснение пользы + accent-подчёркивание ключевого слова.
**Анимации:**
- *Kicker*: `short-slide-down` (y −20→0 за 12f) + `tracking-in`; держится статично.
- *FeatureName*: `per-character-rise` (буквы выезжают снизу, spring damping 12, stagger 4f); спотлайт — анимированная позиция света в `spotlight-card` `interpolate` за 24f; emphasis — лёгкий `spring-scale-in` (1.0→1.04→1.0).
- *Payoff*: `line-by-line-slide`, ключевое слово — `inline-highlight` (accent-плашка вырастает за 10f); exit всей сцены — `scale-down-fade`.
**Переходы:** kicker→name — `fade-through` (kicker уходит в нейтраль, name приходит, linearTiming 12f); name→payoff — `shared-axis-y` вниз (springTiming ~18f).
**Config (сокращённо):**
```ts
{
  meta: { fps: 30, width: 1920, height: 1080 },
  theme: { accent: "#22D3EE", background: "#0A0E12", fontFamily: "Inter" },
  scenes: [
    { type: "kicker-eyebrow", durationInFrames: 90, content: { text: "Introducing" }, transition: { type: "fade-through", timing: { kind: "linear", durationInFrames: 12 } } },
    { type: "feature-name", durationInFrames: 150, content: { name: "Smart Replies", spotlight: true }, transition: { type: "shared-axis-y", direction: "down" } },
    { type: "title-scene", durationInFrames: 120, content: { line: "Отвечай в один тап — черновик уже готов", highlight: "один тап" } },
  ],
}
```
**Reuse:** `short-slide-down`, `tracking-in`, `per-character-rise`, `spring-scale-in`, `line-by-line-slide`, `inline-highlight`, `scale-down-fade`, `spotlight-card`, `title-scene`, переходы `fade-through` / `shared-axis-y`.
**New:**
- `feature-name` — коротко-фразовый спотлайт-кадр имени фичи; буквенная entrance-анимация + синхронный сдвиг светового пятна; пропсы `name`, `spotlight: boolean`, `entrance`, `emphasis?`.
- `kicker-eyebrow` — мелкая надстрочная метка-«глаз» над заголовком (clean, без uppercase-слопа); пропсы `text`, `align`, `delayInFrames`.

---

### A3. Launch / Coming Soon
**Повод:** дата релиза назначена, нужен тизер на пару дней до запуска — интрига плюс каунтдаун до даты.
**Длительность:** ~14 сек (420 кадров).
**Фон:** `volumetric-rays` — медленные лучи создают ощущение «вот-вот рассветёт», солидный тёмный base.
**Сценарий (beats):**
1. **0–120f · Teaser** — на тёмном крупная фраза «Скоро» собирается из размытия; загадочно.
2. **120–270f · Countdown** — выезжает блок таймера/даты, цифры «дотикивают» до релиза; нарастающее ожидание.
3. **270–420f · DateReveal** — точная дата запуска фиксируется, под ней имя продукта; обещание дано.
**Анимации:**
- *Teaser*: «Скоро» — `focus-blur-resolve` (из размытия в резкость за 24f) + лёгкий `top-down-letters` stagger 3f.
- *Countdown*: блок `countdown` с `number-wheel` на разрядах (барабан прокручивается до целевого значения, spring damping 16); подпись «до запуска» — `staggered-fade-up`.
- *DateReveal*: дата — `bottom-up-letters` (stagger 4f), имя продукта — `soft-blur-in`; лучи `volumetric-rays` ускоряются на reveal `interpolate` за 30f; exit — `blur-out-up`.
**Переходы:** teaser→countdown — `frosted-glass-wipe` (матовое стекло сметает тизер, springTiming ~20f); countdown→date — `image-expand-to-fullscreen` (дата «распахивается» из центра таймера, springTiming ~24f).
**Config (сокращённо):**
```ts
{
  meta: { fps: 30, width: 1920, height: 1080 },
  theme: { accent: "#F59E0B", background: "#08070A", fontFamily: "Geist" },
  scenes: [
    { type: "teaser-line", durationInFrames: 120, content: { text: "Скоро" }, transition: { type: "frosted-glass-wipe", timing: { kind: "spring", durationInFrames: 20 } } },
    { type: "countdown", durationInFrames: 150, content: { targetDate: "2026-07-15", label: "до запуска", style: "number-wheel" }, transition: { type: "image-expand-to-fullscreen" } },
    { type: "date-reveal", durationInFrames: 150, content: { date: "15 июля", product: "Switchboard" } },
  ],
}
```
**Reuse:** `focus-blur-resolve`, `top-down-letters`, `number-wheel`, `staggered-fade-up`, `bottom-up-letters`, `soft-blur-in`, `blur-out-up`, `volumetric-rays`, `countdown`, переходы `frosted-glass-wipe` / `image-expand-to-fullscreen`.
**New:**
- `teaser-line` — одна интригующая фраза из размытия по центру кадра; пропсы `text`, `resolveInFrames`, `letterStagger`.
- `date-reveal` — финальный кадр «дата + продукт»: крупная дата буквенной анимацией, подпись-имя ниже; пропсы `date`, `product`, `entrance: 'bottom-up-letters'|'mask-reveal-up'`.

---

### A4. App Store Preview `[9:16]`
**Повод:** релиз мобильного приложения; нужен вертикальный промо-ролик для App Store, сторис и рилсов.
**Длительность:** ~16 сек (480 кадров), формат 1080×1920.
**Фон:** solid `theme.background` с `shimmer-sweep`, проходящим по экрану на стыках сцен (лёгкий блик, не glow).
**Сценарий (beats):**
1. **0–120f · Hook** — крупная вертикальная фраза-крючок сверху, телефон выезжает снизу пустой; «смотри».
2. **120–240f · ScreenA** — на экране телефона первый ключевой скрин приложения, рядом короткий лейбл-фича.
3. **240–360f · ScreenB** — экран телефона «перелистывается» на второй скрин, лейбл меняется; ритм свайпа.
4. **360–480f · StoreCTA** — телефон уезжает, остаётся «Download on the App Store» + рейтинг звёзд.
**Анимации:**
- *Hook*: фраза — `bottom-up-letters` (вертикальный стек строк, stagger 4f); телефон-рамка въезжает `short-slide-down` снизу (y 200→0, spring damping 18).
- *ScreenA/B*: лейбл-фича — `per-word-crossfade`; смена скринов внутри рамки — `mask-reveal-up` контента; emphasis на тапе — `micro-scale-fade` точки-касания.
- *StoreCTA*: бейдж стора — `spring-scale-in`, звёзды рейтинга — `staggered-fade-up` (stagger 3f по звезде), число оценки — `rolling-number`.
**Переходы:** hook→screenA — `spatial-push` вверх (springTiming ~18f); screenA→screenB — `shared-axis-z` (имитирует свайп вглубь, springTiming ~18f); screenB→CTA — `zoom-through-transition` (linearTiming 16f).
**Config (сокращённо):**
```ts
{
  meta: { fps: 30, width: 1080, height: 1920 },
  theme: { accent: "#34D399", background: "#0C0F0E", fontFamily: "Inter" },
  scenes: [
    { type: "vertical-hook", durationInFrames: 120, content: { lines: ["Твой день", "в одном экране"] }, transition: { type: "spatial-push", direction: "up" } },
    { type: "phone-screen", durationInFrames: 120, content: { screen: "home", label: "Всё за сегодня" }, transition: { type: "shared-axis-z" } },
    { type: "phone-screen", durationInFrames: 120, content: { screen: "focus", label: "Режим фокуса" }, transition: { type: "zoom-through-transition" } },
    { type: "store-cta", durationInFrames: 120, content: { badge: "app-store", rating: 4.9 } },
  ],
}
```
**Reuse:** `bottom-up-letters`, `short-slide-down`, `per-word-crossfade`, `mask-reveal-up`, `micro-scale-fade`, `spring-scale-in`, `staggered-fade-up`, `rolling-number`, `shimmer-sweep`, переходы `spatial-push` / `shared-axis-z` / `zoom-through-transition`.
**New:**
- `phone-frame` — бесфоновая вертикальная рамка телефона (корпус, скруглённый экран-слот, динамик-вырез) для 9:16; контент экрана — слот, без хардкод-фона; пропсы `children`, `device: 'modern'|'classic'`, `entrance`, `screenRadius`.
- `phone-screen` — сцена «телефон + лейбл фичи»: оборачивает `phone-frame`, анимирует смену контента экрана и подпись сбоку/снизу; пропсы `screen`, `label`, `transitionIn: 'mask-reveal-up'|'shared-axis-z'`.
- `store-badge` — чистый бейдж «App Store / Google Play» с пресетной entrance-анимацией; пропсы `store: 'app-store'|'google-play'`, `entrance`.

---

### A5. Waitlist / Beta Invite
**Повод:** продукт ещё в закрытой бете, нужно собрать вейтлист — короткий ролик «вот зачем вписываться».
**Длительность:** ~15 сек (450 кадров).
**Фон:** `spotlight-card` на заголовке и CTA, solid `theme.background` под списком бенефитов.
**Сценарий (beats):**
1. **0–120f · Headline** — крупный заголовок «Get early access» собирается строками; приглашающе.
2. **120–330f · Benefits** — 2–3 бенефита появляются по очереди списком (иконка + строка), каждый — отдельный акцент.
3. **330–450f · JoinCTA** — «Join the waitlist» + поле-плейсхолдер email/домен; призыв к действию.
**Анимации:**
- *Headline*: `line-by-line-slide` (строки въезжают снизу, stagger 12f), ключевое слово «early» — `marker-highlight` за 12f.
- *Benefits*: контейнер на базе `progress-steps`, каждый пункт — `staggered-fade-up` (stagger 8f между пунктами, y 20→0), иконка — `micro-scale-fade`; активный пункт держит accent-маркер.
- *JoinCTA*: строка призыва — `mask-reveal-up`, поле — `soft-blur-in`, плейсхолдер-курсор моргает; exit — `scale-down-fade`.
**Переходы:** headline→benefits — `shared-axis-y` вниз (springTiming ~18f); benefits→CTA — `fade-through` (linearTiming 14f).
**Config (сокращённо):**
```ts
{
  meta: { fps: 30, width: 1920, height: 1080 },
  theme: { accent: "#A78BFA", background: "#0A0910", fontFamily: "Geist" },
  scenes: [
    { type: "title-scene", durationInFrames: 120, content: { lines: ["Get early", "access"], highlight: "early" }, transition: { type: "shared-axis-y", direction: "down" } },
    { type: "benefit-list", durationInFrames: 210, content: { items: ["Бесплатно в бете", "Прямой канал с автором", "Лучшая цена навсегда"] }, transition: { type: "fade-through" } },
    { type: "join-cta", durationInFrames: 120, content: { line: "Join the waitlist", placeholder: "you@email.com" } },
  ],
}
```
**Reuse:** `line-by-line-slide`, `marker-highlight`, `staggered-fade-up`, `micro-scale-fade`, `mask-reveal-up`, `soft-blur-in`, `scale-down-fade`, `progress-steps`, `spotlight-card`, `title-scene`, переходы `shared-axis-y` / `fade-through`.
**New:**
- `benefit-list` — вертикальный список бенефитов с пер-пунктовым stagger-входом и accent-маркером активной строки; пропсы `items: string[]`, `icon?`, `stagger`, `marker: boolean`.
- `join-cta` — финальный кадр вейтлиста: строка призыва + декоративно-неактивное поле ввода с мигающим курсором; пропсы `line`, `placeholder`, `caret: boolean`.

---

### A6. Brand Sizzle / Intro
**Повод:** нужен короткий бренд-стинг — заставка перед видео, шапка канала, intro в начале демо; логотип плюс tagline за пару секунд.
**Длительность:** ~6 сек (180 кадров). Сжатый ритм, один акцент.
**Фон:** `volumetric-rays` на тёмном — лучи «расходятся» из точки появления логотипа, гасятся к концу.
**Сценарий (beats):**
1. **0–70f · LogoSting** — логотип собирается/въезжает в центр, лучи вспыхивают синхронно; мощный старт.
2. **70–140f · Tagline** — под логотипом одностроковый tagline проявляется чисто; смысл бренда.
3. **140–180f · Lockup** — логотип и tagline схлопываются в финальный lockup и замирают; точка.
**Анимации:**
- *LogoSting*: `logo-enter` (масштаб 0.8→1.0 + opacity, spring damping 13), лучи `volumetric-rays` стартуют из центра `interpolate` за 18f.
- *Tagline*: `tracking-in` по букве (settle без декоративного letter-spacing) либо `soft-blur-in` за 16f; короткий `shimmer-sweep` проходит по логотипу один раз.
- *Lockup*: лёгкий `micro-scale-fade` (1.0→0.98 settle), всё фиксируется; exit-стоп без motion (hold последние 12f).
**Переходы:** logo→tagline — `fade-through` (быстрый, 10f overlap); tagline→lockup — без полноценного перехода, компоненты живут в одном `<Sequence>` и сходятся.
**Config (сокращённо):**
```ts
{
  meta: { fps: 30, width: 1920, height: 1080 },
  theme: { accent: "#F43F5E", background: "#070708", fontFamily: "Geist" },
  scenes: [
    { type: "logo-sting", durationInFrames: 70, content: { logo: "switchboard-mark", rays: true }, transition: { type: "fade-through", timing: { kind: "linear", durationInFrames: 10 } } },
    { type: "brand-lockup", durationInFrames: 110, content: { tagline: "Каждый разговор — в одном месте", shimmer: true } },
  ],
}
```
**Reuse:** `logo-enter`, `tracking-in`, `soft-blur-in`, `micro-scale-fade`, `shimmer-sweep`, `volumetric-rays`, переход `fade-through`.
**New:**
- `logo-sting` — короткая ударная сцена входа логотипа с синхронной вспышкой лучей; пропсы `logo: ReactNode`, `rays: boolean`, `entrance: 'logo-enter'|'spring-scale-in'`, `holdInFrames`.
- `brand-lockup` — финальный замок «логотип + tagline» со схлопыванием в статичную композицию; пропсы `tagline`, `shimmer: boolean`, `align: 'center'|'left'`.

---

## B. Release & Updates

Семейство о выпусках: changelog, мажорные версии, патчи, roadmap, миграции. Опора — редакторская типографика: номер версии как герой кадра, список изменений как ритмическая вёрстка. Фоны спокойные (solid `theme.background`, `dynamic-grid`, изредка `volumetric-rays` на единственном акценте). Никаких glow, gradient-text, декоративного uppercase. Все шаблоны — `<TransitionSeries>`, fps=30, 1920×1080. Брендовые переходы — presentation-обёртки с `linearTiming`/`springTiming`.

Каждый `[N]` — количество элементов списка (изменений, фиксов, вех). Сцена-список рендерит ровно N строк со staggered-входом; её `durationInFrames` считается по формуле от N с зажимом (clamp) минимума и максимума, чтобы видео не распухало.

---

### B1. Changelog / Release Notes `[N]`
**Повод:** регулярный релиз — показать номер версии и человекочитаемый список изменений (Added / Fixed / Changed), закрыть футером со ссылкой и датой.
**Длительность:** ~9 сек (270 кадров) при `N=4`. Для `[N]`: `total = 60 (badge) + clamp(N*24, 96, 200) (list) + 70 (footer) − 2*overlap(12)`. При N=4 ≈ 270f; list-сцена растягивается линейно по N.
**Фон:** solid `theme.background` + статичный `dynamic-grid` низкой плотности (opacity ~0.06), без движения — список должен спокойно читаться.

**Сценарий (beats):**
1. **0–48f · VersionBadgeIn** — `version-badge` (v1.8.0) выезжает в левый верх, дата справа; заголовок «What's new» строится через `tracking-in`.
2. **48–60f · переход** — `shared-axis-y` к списку.
3. **60–160f · ChangeList** — N строк, каждая = категориальный тег (Added/Fixed/Changed) + текст; `staggered-fade-up`, stagger 9f.
4. **148–160f · переход** — `fade-through` к футеру.
5. **160–270f · Footer** — `version-badge` мелким кеглем, ссылка/CTA `soft-blur-in`, тонкая `progress-steps` как индикатор «релиз N из…» опционально.

**Анимации:**
- *VersionBadgeIn (entrance):* бейдж — `spring({frame,fps,config:{damping:18,stiffness:120}})` по translateX −40→0; заголовок `tracking-in`, letter-spacing 0.4em→0 за 24f, opacity clamp.
- *ChangeList (emphasis):* каждая строка `staggered-fade-up`, translateY 24→0, opacity 0→1 за 18f, задержка `i*9f`; категориальный тег появляется на 4f раньше текста (micro-stagger), сам тег `spring-scale-in` scale 0.8→1.
- *Footer (exit предыдущей сцены):* список уходит `blur-out-up` (translateY −20, blur 0→6px, opacity→0) за 12f синхронно с переходом; футер-бейдж `micro-scale-fade`.

**Переходы:** badge→list `shared-axis-y` (springTiming, 12f); list→footer `fade-through` (linearTiming 12f).

**Config (сокращённо):**
```ts
{
  meta: { id: "changelog", fps: 30, width: 1920, height: 1080, version: "1.8.0", date: "2026-06-29" },
  theme: { background: "#0B0B0F", accent: "#5B8CFF", fg: "#F4F4F5", fontFamily: "Geist" },
  scenes: [
    { type: "version-badge-title", durationInFrames: 60,
      content: { version: "v1.8.0", title: "What's new", date: "Jun 29" },
      transition: { presentation: "shared-axis-y", timing: "spring", durationInFrames: 12 } },
    { type: "change-list", durationInFrames: 100,
      content: { items: [
        { tag: "Added",   text: "Realtime collaboration" },
        { tag: "Fixed",   text: "Export crash on Safari" },
        { tag: "Changed", text: "New default theme" },
        { tag: "Added",   text: "Keyboard shortcuts" },
      ] },
      transition: { presentation: "fade-through", timing: "linear", durationInFrames: 12 } },
    { type: "cta-scene", durationInFrames: 110,
      content: { version: "v1.8.0", href: "remocn.dev/changelog", cta: "Read full notes" } },
  ],
}
```

**Reuse:** `version-badge`, `tracking-in`, `staggered-fade-up`, `spring-scale-in`, `blur-out-up`, `soft-blur-in`, `micro-scale-fade`, `dynamic-grid`, `progress-steps`, `cta-scene`.
**New:**
- **New:** `change-list` — типографический список изменений с категориальными тегами. Рендерит массив `{tag,text}`, держит цветовую карту тегов (Added=green, Fixed=amber, Changed=blue из theme), сам раскладывает stagger. Пропсы: `items: {tag:string,text:string}[]`, `staggerFrames?=9`, `tagColors?: Record<string,string>`, `align?: 'left'|'center'`, `maxRows?` (авто-усечение + «+M more»).
- **New:** `category-tag` — атом-чип категории фиксированной ширины, моноширинный кегль. Пропсы: `label`, `color`, `enter?: 'scale'|'fade'`. Живёт внутри `change-list`, переиспользуется в B3.

---

### B2. Version Bump Highlight
**Повод:** мажорный релиз — драматично объявить «v2.0», подсветить топ-3 изменения, увести в CTA «Upgrade now».
**Длительность:** ~8 сек (240 кадров). Фикс (не `[N]`, всегда 3 хайлайта): bump 80f → highlights 100f → cta 60f.
**Фон:** solid `theme.background`; на сцене версии — `volumetric-rays` за числом (единственное место с лучами во всём семействе, оправдано «событийностью»), затем гасится.

**Сценарий (beats):**
1. **0–68f · BigVersion** — гигантская «v2.0», разряды катятся через `slot-machine-roll` / `number-wheel` по центру (~40% высоты); `volumetric-rays` медленно проявляются за числом и затухают к концу сцены.
2. **68–80f · переход** — `zoom-through-transition` («влёт» в цифру) к хайлайтам.
3. **80–168f · TopThree** — три крупные строки-хайлайта, по одной, `per-word-crossfade`, между ними `short-slide-down`; слева порядковый номер 01/02/03 через `rolling-number`.
4. **168–180f · переход** — `spatial-push` к CTA.
5. **180–240f · UpgradeCTA** — «Upgrade now» `kinetic-center-build`, под ним команда установки `typewriter`.

**Анимации:**
- *BigVersion (entrance):* `slot-machine-roll` — каждый разряд останавливается с отскоком `spring({damping:12,stiffness:140})`, разряды стопаются stagger 6f слева-направо; лучи `interpolate(frame,[0,30,80],[0,0.5,0],{extrapolateRight:'clamp'})`; на settle — `micro-scale-fade` пульс 1.0→1.04→1.0.
- *TopThree (emphasis):* каждый хайлайт `per-word-crossfade` (слова сменяются с overlap 6f), номер `rolling-number` 0→i за 20f; вход строки `short-slide-down` translateY −30→0 spring damping 16.
- *UpgradeCTA (exit предыдущей):* хайлайты уходят `scale-down-fade` (scale 1→0.92, opacity→0) за 12f; CTA `kinetic-center-build` собирает буквы из центра, `typewriter` печатает `npm i pkg@2` со скоростью 2 кадра/символ.

**Переходы:** version→highlights `zoom-through-transition` (springTiming 14f); highlights→cta `spatial-push` (linearTiming 12f).

**Config (сокращённо):**
```ts
{
  meta: { id: "version-bump", fps: 30, width: 1920, height: 1080, version: "2.0" },
  theme: { background: "#07070A", accent: "#7C5CFF", fg: "#FFFFFF", fontFamily: "Geist" },
  scenes: [
    { type: "big-version", durationInFrames: 80,
      content: { from: "1.9", to: "2.0", roll: "slot-machine", rays: true },
      transition: { presentation: "zoom-through", timing: "spring", durationInFrames: 14 } },
    { type: "top-highlights", durationInFrames: 100,
      content: { items: ["Rewritten engine", "10× faster export", "New plugin API"] },
      transition: { presentation: "spatial-push", timing: "linear", durationInFrames: 12 } },
    { type: "cta-scene", durationInFrames: 60,
      content: { title: "Upgrade now", install: "npm i pkg@2", typed: true } },
  ],
}
```

**Reuse:** `number-wheel`, `slot-machine-roll`, `rolling-number`, `per-word-crossfade`, `short-slide-down`, `scale-down-fade`, `kinetic-center-build`, `typewriter`, `micro-scale-fade`, `volumetric-rays`, `cta-scene`.
**New:**
- **New:** `big-version` — герой-сцена крупного номера версии с инкрементной анимацией. Берёт `from`/`to`, бьёт на разряды, катит каждый через wheel/slot, синхронит остановки stagger-ом. Пропсы: `from`, `to`, `roll?: 'wheel'|'slot-machine'`, `rays?=false`, `digitStaggerFrames?=6`. Лучи рисует только при `rays:true`; компонент сам остаётся прозрачным.
- **New:** `top-highlights` — нумерованный список из ≤3 крупных строк, по одной во времени, с `rolling-number`-индексом. Пропсы: `items: string[]` (clamp ≤3), `revealFrames?=30`, `numberStyle?: 'roll'|'static'`.

---

### B3. Patch / Bugfix Notes `[N]`
**Повод:** мелкий патч-релиз — компактно перечислить фиксы плотным моноширинным списком в духе `git log --oneline`. Сухо, технично, быстро.
**Длительность:** ~7 сек (210 кадров) при `N=6`. Для `[N]`: `total = 50 (head) + clamp(N*14, 84, 168) (list) + 50 (tail) − 2*overlap(10)`. Список плотнее, чем в B1 (14f/строка против 24f), потому что строки короткие и моноширинные.
**Фон:** solid `theme.background` чуть темнее обычного (терминальная атмосфера), без grid/rays — максимальная плотность текста.

**Сценарий (beats):**
1. **0–44f · PatchHead** — `version-badge` мелко (v1.8.1, тег «patch» через `category-tag`), строка `Bug fixes` через `top-down-letters`; справа счётчик «N fixes» через `rolling-number`.
2. **44–50f · переход** — `directional-wipe` снизу вверх (как прокрутка лога) к списку.
3. **50–160f · FixList** — N моноширинных строк формата `· short-hash  message`; построчный вход `short-slide-right`, малый stagger 6f, будто лог дописывается сверху вниз.
4. **150–160f · переход** — `fade-through`.
5. **160–210f · Tail** — итог «Patch released», дата и ссылка `soft-blur-in`.

**Анимации:**
- *PatchHead (entrance):* `version-badge` `micro-scale-fade` (scale 0.94→1, 12f, без bounce — деловой тон); `top-down-letters` — буквы «Bug fixes» падают по одной translateY −16→0 stagger 3f; счётчик `rolling-number` 0→N за 18f.
- *FixList (emphasis):* каждая строка `short-slide-right` translateX −24→0 + opacity, stagger 6f; hash-сегмент окрашен accent и моноширинный, message приглушённый fg; в конце последней строки `blink-caret` мигает 2 цикла.
- *Tail (exit предыдущей):* список `blur-out-up` 10f; итоговая строка `soft-blur-in` blur 8→0.

**Переходы:** head→list `directional-wipe` (linearTiming 10f, direction up); list→tail `fade-through` (linearTiming 10f). Тяжёлые wipe намеренно не используются — они бы ломали плотный темп.

**Config (сокращённо):**
```ts
{
  meta: { id: "patch-notes", fps: 30, width: 1920, height: 1080, version: "1.8.1", channel: "patch" },
  theme: { background: "#050507", accent: "#3FB950", fg: "#C9D1D9", fontFamily: "Geist Mono" },
  scenes: [
    { type: "patch-head", durationInFrames: 50,
      content: { version: "v1.8.1", title: "Bug fixes", count: 6 },
      transition: { presentation: "directional-wipe", timing: "linear", durationInFrames: 10, direction: "up" } },
    { type: "fix-log", durationInFrames: 110,
      content: { items: [
        { hash: "a1f3c9", msg: "Fix null deref on logout" },
        { hash: "b7e210", msg: "Correct timezone in export" },
        { hash: "c4d881", msg: "Debounce search input" },
        { hash: "d9a017", msg: "Patch memory leak in player" },
        { hash: "e2b556", msg: "Restore retina assets" },
        { hash: "f0c3aa", msg: "Tighten CSP headers" },
      ], staggerFrames: 6, mono: true },
      transition: { presentation: "fade-through", timing: "linear", durationInFrames: 10 } },
    { type: "stat-recap", durationInFrames: 50,
      content: { title: "Patch released", date: "Jun 29", href: "remocn.dev/releases" } },
  ],
}
```

**Reuse:** `version-badge`, `top-down-letters`, `rolling-number`, `short-slide-right`, `micro-scale-fade`, `inline-highlight`, `blur-out-up`, `soft-blur-in`, `stat-recap`, `category-tag` (из B1, для тега «patch»).
**New:**
- **New:** `fix-log` — плотный моноширинный лог фиксов в стиле `git log --oneline`. Рендерит `{hash,msg}[]`, выравнивает hash-колонку, окрашивает hash в accent, гонит построчный `short-slide-right` с малым stagger. Пропсы: `items: {hash:string,msg:string}[]`, `staggerFrames?=6`, `showCaret?=true`, `maxRows?`, `mono?=true`.
- **New:** `blink-caret` — мигающая терминальная каретка (▌), синхронизирована по fps, N циклов. Пропсы: `cycles?=2`, `periodFrames?=16`, `char?='▌'`. Переиспользуема в любых terminal-подобных кадрах.

---

### B4. Roadmap Reveal `[N]`
**Повод:** показать будущие вехи продукта — что Now / Next / Later, со статусным прогрессом. Не отчёт о прошлом, а обещание будущего.
**Длительность:** ~10 сек (300 кадров) при `N=4`. Для `[N]`: `total = 60 (title) + clamp(N*30, 120, 220) (timeline) + 60 (outro) − 2*overlap(13)`. Timeline-вход длиннее (30f/веха), т.к. рисуется соединительная линия между узлами.
**Фон:** solid `theme.background` + очень медленный `dynamic-grid` с лёгким дрейфом вглубь — ощущение движения вперёд во времени.

**Сценарий (beats):**
1. **0–52f · RoadmapTitle** — `title-scene`: «Roadmap 2026» через `mask-reveal-up`, подзаголовок `staggered-fade-up`.
2. **52–60f · переход** — `shared-axis-z` («вглубь») к timeline.
3. **60–230f · Timeline** — горизонтальная ось; N узлов-вех «прорастают» слева-направо, соединительная линия рисуется по длине через `interpolate`; у каждой вехи статус-чип (Now/Next/Later) и заголовок `per-character-rise`.
4. **218–230f · переход** — `fade-through`.
5. **230–300f · Outro** — `cta-scene`: «Follow the journey» + ссылка `soft-blur-in`.

**Анимации:**
- *RoadmapTitle (entrance):* `mask-reveal-up` — заголовок выезжает из-под маски (clip-path inset bottom 100→0) за 24f spring damping 20; подзаголовок `staggered-fade-up` по словам.
- *Timeline (emphasis):* соединительная линия — `strokeDashoffset` через `interpolate(frame,[0,90],[fullLen,0],{extrapolateRight:'clamp'})`; каждый узел `spring-scale-in` scale 0→1 в момент, когда линия до него «дотянулась» (узел i активен при `frame > startLine + i*lineStep`); заголовок вехи `per-character-rise` stagger 2f/символ; статус-чип `micro-scale-fade`, цвет по статусу (Now=accent, Next=fg-muted, Later=outline).
- *Outro (exit предыдущей):* timeline `scale-down-fade` 12f к центру; CTA `kinetic-center-build`.

**Переходы:** title→timeline `shared-axis-z` (springTiming 14f); timeline→outro `fade-through` (linearTiming 12f).

**Config (сокращённо):**
```ts
{
  meta: { id: "roadmap", fps: 30, width: 1920, height: 1080, year: 2026 },
  theme: { background: "#0A0B10", accent: "#FF8A5B", fg: "#ECECF1", muted: "#8A8A99", fontFamily: "Geist" },
  scenes: [
    { type: "title-scene", durationInFrames: 60,
      content: { title: "Roadmap 2026", subtitle: "Where we're headed" },
      transition: { presentation: "shared-axis-z", timing: "spring", durationInFrames: 14 } },
    { type: "roadmap-timeline", durationInFrames: 170,
      content: { orientation: "horizontal", items: [
        { status: "Now",   title: "Realtime editor" },
        { status: "Now",   title: "Mobile export" },
        { status: "Next",  title: "Team workspaces" },
        { status: "Later", title: "AI scene builder" },
      ] },
      transition: { presentation: "fade-through", timing: "linear", durationInFrames: 12 } },
    { type: "cta-scene", durationInFrames: 70,
      content: { title: "Follow the journey", href: "remocn.dev/roadmap" } },
  ],
}
```

**Reuse:** `title-scene`, `mask-reveal-up`, `staggered-fade-up`, `per-character-rise`, `spring-scale-in`, `micro-scale-fade`, `scale-down-fade`, `kinetic-center-build`, `soft-blur-in`, `dynamic-grid`, `cta-scene`, `progress-steps`.
**New:**
- **New:** `roadmap-timeline` — анимированная ось вех с прорастающей соединительной линией и статус-узлами. Рисует линию через `strokeDashoffset`, активирует узлы по достижении линией их позиции, каждый узел = точка + статус-чип + заголовок. Пропсы: `items: {status:'Now'|'Next'|'Later',title:string}[]`, `orientation?: 'horizontal'|'vertical'`, `lineDurationFrames?=90`, `statusColors?: Record<string,string>`.
- **New:** `milestone-node` — атом точки на оси: кружок (pulse при активации) + `status-chip` + заголовок. Пропсы: `status`, `title`, `active`, `pulse?=true`. Живёт внутри `roadmap-timeline`.
- **New:** `status-chip` — чип статуса с предустановленной палитрой Now/Next/Later (специализация `category-tag`). Пропсы: `status`, `colors?`.

---

### B5. Migration Guide `[N]`
**Повод:** breaking-релиз требует миграции — показать код «было → стало» и пронумерованные шаги апгрейда. Чисто типографически, без фейкового браузера/IDE.
**Длительность:** ~11 сек (330 кадров) при `N=3`. Для `[N]`: `total = 60 (intro) + 120 (code-compare) + clamp(N*34, 102, 204) (steps) + 60 (outro) − 3*overlap(13)`. Code-compare фиксирован 120f (один разворот before/after), steps масштабируются по N.
**Фон:** solid `theme.background` (терминально-тёмный), без grid/rays — код должен быть единственным акцентом.

**Сценарий (beats):**
1. **0–52f · MigrateIntro** — `version-badge` «v1 → v2» + заголовок «Migration guide» через `focus-blur-resolve` (из расфокуса в резкость).
2. **52–60f · переход** — `shared-axis-y`.
3. **60–180f · CodeCompare** — две колонки кода: слева «Before» (приглушён), справа «After» (accent); изменённые строки в After подсвечиваются `marker-highlight`; удалённые в Before гаснут `strikethrough-replace`. Разворот колонок раскрывается из центральной оси.
4. **168–180f · переход** — `frosted-glass-wipe` (матовое стекло «протирает» код, открывая шаги).
5. **180–270f · Steps** — N пронумерованных шагов миграции, `progress-steps` слева + текст шага `line-by-line-slide`; активный шаг подсвечен.
6. **270–330f · Outro** — `stat-recap`/`cta-scene`: «Migrated in N steps» + ссылка на docs `soft-blur-in`.

**Анимации:**
- *MigrateIntro (entrance):* заголовок `focus-blur-resolve` (blur 12→0px, scale 1.04→1, 26f); бейдж «v1 → v2» — стрелка между версиями рисуется по длине через `interpolate`, версии `micro-scale-fade`.
- *CodeCompare (emphasis):* колонки раскрываются из центральной оси (scaleX 0→1 от середины, spring damping 18); строки кода появляются `staggered-fade-up` stagger 4f; в After изменённые строки получают `marker-highlight` (фон-маркер прокрашивается слева-направо за 14f) с задержкой после появления; в Before удаляемые строки `strikethrough-replace` (черта проводится, строка тускнеет).
- *Steps (emphasis/exit):* `progress-steps` заполняется по мере появления шагов; каждый шаг `line-by-line-slide` translateX −20→0 stagger 8f, активный ярче, прошлые приглушаются `micro-scale-fade`; на переходе к outro блок `blur-out-up`.

**Переходы:** intro→compare `shared-axis-y` (springTiming 12f); compare→steps `frosted-glass-wipe` (linearTiming 16f); steps→outro `fade-through` (linearTiming 12f).

**Config (сокращённо):**
```ts
{
  meta: { id: "migration", fps: 30, width: 1920, height: 1080, from: "1.x", to: "2.0" },
  theme: { background: "#06070A", accent: "#FFB454", fg: "#D5D5DD", muted: "#7A7A88", fontFamily: "Geist Mono" },
  scenes: [
    { type: "title-scene", durationInFrames: 60,
      content: { badge: "v1 → v2", title: "Migration guide", reveal: "focus-blur-resolve" },
      transition: { presentation: "shared-axis-y", timing: "spring", durationInFrames: 12 } },
    { type: "code-compare", durationInFrames: 120,
      content: {
        before: ["import { Old } from 'pkg'", "const c = new Old(opts)", "c.run()"],
        after:  ["import { New } from 'pkg'", "const c = createNew(opts)", "await c.run()"],
        changed: [0,1,2], removed: [] },
      transition: { presentation: "frosted-glass-wipe", timing: "linear", durationInFrames: 16 } },
    { type: "migration-steps", durationInFrames: 90,
      content: { steps: [
        "Update import paths",
        "Replace constructor with factory",
        "Await async run()",
      ] },
      transition: { presentation: "fade-through", timing: "linear", durationInFrames: 12 } },
    { type: "stat-recap", durationInFrames: 60,
      content: { title: "Migrated in 3 steps", href: "remocn.dev/migrate" } },
  ],
}
```

**Reuse:** `version-badge`, `focus-blur-resolve`, `staggered-fade-up`, `line-by-line-slide`, `marker-highlight`, `strikethrough-replace`, `micro-scale-fade`, `blur-out-up`, `soft-blur-in`, `progress-steps`, `title-scene`, `stat-recap`, `cta-scene`.
**New:**
- **New:** `code-compare` — типографический diff-разворот «before → after» в две колонки, БЕЗ имитации IDE/окна. Берёт два массива строк, индексы `changed`/`removed`, подсвечивает изменения `marker-highlight`, вычёркивает удаления `strikethrough-replace`, раскрывает колонки из центральной оси. Пропсы: `before: string[]`, `after: string[]`, `changed?: number[]`, `removed?: number[]`, `mono?=true`, `revealStagger?=4`, `highlightDelay?=10`. Чистая типографика на прозрачном фоне — фон задаёт сцена.
- **New:** `diff-line` — атом строки кода с режимом `added|removed|changed|context`: управляет цветом, маркером слева (+/−/~) и анимацией подсветки/вычёркивания. Пропсы: `text`, `kind`, `highlight?=false`, `mono?=true`. Живёт внутри `code-compare`.
- **New:** `migration-steps` — пронумерованный список шагов миграции с синхронным `progress-steps`. Рендерит `steps: string[]`, ведёт активный индекс по времени, въезд `line-by-line-slide`. Пропсы: `steps: string[]`, `stepDurationFrames?=auto`, `activeStyle?`, `connector?=true`.

---

## C. Growth & Social Proof

Семья про доказательство ценности: отзывы, твиты, метрики, юбилеи. Опора — типографика цитат и крупные числа. Фоны сдержанные (spotlight-card / dynamic-grid / solid), чтобы текст и лица не конкурировали с декором.

---

### C1. Testimonial Reel `[N]`
**Повод:** B2B SaaS показывает серию клиентских отзывов на лендинге или в pitch-deck.
**Длительность:** ~3.5 сек на цитату (105 кадров) + интро-заставка 60 кадров. Для `[N]`: `total = 60 + N*105 − N*15` (15f — overlap каждого fade-through, включая вход первой цитаты). Пример N=3 → `60 + 315 − 45 = 330` кадров (11 сек).
**Фон:** `spotlight-card` (мягкое световое пятно следует за активной карточкой), база — solid `theme.background`.

**Сценарий (beats):**
1. **0–60f · IntroScene** — заголовок раздела «What teams say», `tracking-in` + тонкая линия-разделитель снизу.
2. **60–165f · Quote 1** — карточка цитаты выезжает в `quote-stack`, текст набирается `per-word-crossfade`.
3. **165–270f · Quote 2** — верхняя карточка «отстреливается», следующая всплывает; автор-строка `short-slide-right`.
4. **270–375f · Quote N** — последняя цитата задерживается на +10f дольше (акцент перед выходом).
5. **375–390f · Exit** — стопка уезжает вверх `blur-out-up`.

**Анимации:**
- IntroScene: `tracking-in` letter-spacing `interpolate(frame,[0,24],[0.4em,0],{extrapolateRight:'clamp'})`, opacity 0→1 за 18f; линия `mask-reveal-up` слева направо за 20f.
- Quote: вход карточки `spring({frame,fps,config:{damping:18,mass:0.9}})` по translateY 40→0; текст `per-word-crossfade` со stagger 4f на слово; аватар + имя `staggered-fade-up` (stagger 6f, два элемента).
- Emphasis: активная карточка scale 1.0, фоновые `peek`-карточки scale 0.94 и opacity 0.5 — глубина без glow.
- Exit: `blur-out-up` blur 0→8px, translateY 0→−60, opacity 1→0 за 15f.

**Переходы:** `fade-through` между цитатами (presentation, `linearTiming(15)`), вход интро — `springTiming({damping:200})`.

**Config (сокращённо):**
```ts
const reel = {
  meta: { id: 'testimonial-reel', format: '16:9', fps: 30 },
  theme: { background: '#0B0B0F', text: '#F4F4F5', accent: '#7C5CFF' },
  scenes: [
    { type: 'title-scene', durationInFrames: 60, content: { kicker: 'What teams say' } },
    ...quotes.map((q) => ({
      type: 'quote-stack',
      durationInFrames: 105,
      content: { text: q.text, author: q.author, role: q.role, avatar: q.avatar },
      transition: { kind: 'fade-through', timing: 'linear', overlap: 15 },
    })),
  ],
} as const
```

**Reuse:** `spotlight-card`, `per-word-crossfade`, `staggered-fade-up`, `tracking-in`, `short-slide-right`, `blur-out-up`, `mask-reveal-up`, `title-scene`.

**New:**
- `quote-stack` — колода карточек-цитат: активная сверху, 2–3 следующих выглядывают со смещением и наклоном, образуя физическую стопку; смена «отстреливает» верхнюю и поднимает следующую. **Пропсы:** `quotes: { text; author; role; avatar }[]`, `activeIndex: number`, `peek: number` (px смещение фоновых, дефолт 14), `tilt: number` (deg наклон фоновых, дефолт 2.5), `popSpring: { damping; mass }`, `accentColor: string`. Внутри: top-карточка управляется `activeIndex`, фоновые рендерятся через `interpolate` по глубине (scale/opacity/translateY), смена — `spring` translateY верхней −80 + opacity→0.

---

### C2. Tweet Wall `[N]`
**Повод:** продукт собрал волну реакций в X; нужно показать «стену» энтузиазма одним планом.
**Длительность:** базово 7 сек (210 кадров). Для `[N]` карточек в фокусе: `total = 210 + (N−1)*45` (каждый дополнительный фокус-кадр добавляет 45f на зум-чтение).
**Фон:** `dynamic-grid` (тонкая сетка, лёгкий параллакс-дрейф), solid `theme.background` под ней.

**Сценарий (beats):**
1. **0–40f · WallBuild** — десятки твит-карточек проявляются волной из глубины, формируя диагональный поток `tweet-grid-flow`.
2. **40–90f · Drift** — вся стена медленно дрейфует по диагонали, слои с разной скоростью (параллакс).
3. **90–165f · Focus** — одна карточка выезжает на передний план (до 0.7 экрана), текст внутри `typewriter`.
4. **165–210f · Release & pan** — фокус-карточка возвращается в строй, камера `perspective-marquee`-сдвигом уезжает влево.

**Анимации:**
- WallBuild: карточки `micro-scale-fade` (scale 0.92→1, opacity 0→1) со stagger 2f по индексу + джиттер ±3f; глубина задаётся `depthLayers` (3 слоя z).
- Drift: `interpolate(frame,[40,210],[0,−240])` по X для дальнего слоя, `[0,−120]` для ближнего — разная скорость = параллакс.
- Focus: выбранная карточка `spring({damping:20})` scale до 1.0 фронтового слоя, остальные `soft-blur-in` наоборот — уходят в blur 4px и opacity 0.4; внутренний текст `typewriter` 30 cps.
- Exit: `fade-through` всей сцены, дрейф продолжается на выходе (motion continuity).

**Переходы:** внутри — без жёстких cut, всё на дрейфе; выход шаблона `spatial-push` влево (`linearTiming(18)`).

**Config (сокращённо):**
```ts
const wall = {
  meta: { id: 'tweet-wall', format: '16:9', fps: 30 },
  theme: { background: '#08090C', text: '#E7E9EE', accent: '#1D9BF0' },
  scenes: [{
    type: 'tweet-grid-flow',
    durationInFrames: 210,
    content: {
      tweets,                 // { handle; name; avatar; text; likes }[]
      focusOrder: [4, 11],    // индексы карточек в фокус
    },
  }],
} as const
```

**Reuse:** `infinite-marquee`/`perspective-marquee` (как механика потока), `dynamic-grid`, `typewriter`, `micro-scale-fade`, `soft-blur-in`, `x-follow-card` (как разметка одной карточки), `fade-through`, `spatial-push`.

**New:**
- `tweet-grid-flow` — masonry-сетка твит-карточек, дрейфующая по диагонали с параллакс-слоями глубины; умеет вытаскивать одну карточку в фокус и возвращать. **Пропсы:** `tweets: TweetCard[]`, `columns: number` (дефолт 4), `driftAngle: number` (deg, дефолт 18), `driftSpeed: number` (px/сек), `focusOrder: number[]`, `depthLayers: number` (дефолт 3, влияет на scale/blur/скорость слоя), `gap: number`. Внутри: раскладка по колонкам разной высоты, каждый слой получает свой `interpolate` по X/Y, фокус — `spring` подъём карточки в верхний z + блюр остальных.

---

### C3. Milestone Celebration
**Повод:** «10,000 users» / «1M downloads» — праздничный пост в соцсети, момент гордости команды.
**Длительность:** ~4 сек (120 кадров).
**Фон:** `volumetric-rays` (мягкие лучи из центра, медленное вращение), solid `theme.background`.

**Сценарий (beats):**
1. **0–24f · Lead-in** — надпись-повод «We just hit» поднимается `bottom-up-letters`.
2. **24–78f · CountUp** — крупное число катится 0 → 10,000 через `rolling-number`, под ним стампуется `milestone-badge`.
3. **78–96f · Pop** — на финальной цифре `confetti` выстреливает, бейдж даёт micro-bounce.
4. **96–120f · Settle** — подпись «users and counting» проявляется `staggered-fade-up`, лучи затухают.

**Анимации:**
- Lead-in: `bottom-up-letters` stagger 3f на букву, маска снизу, translateY 24→0.
- CountUp: `rolling-number` с easing `interpolate(frame,[24,78],[0,1],{extrapolateRight:'clamp'})`, разряды-колёса (`number-wheel`) докручиваются с разной задержкой (младший разряд быстрее); число `spring-scale-in` на старте (scale 0.7→1, damping 12).
- Pop: `milestone-badge` штампуется `spring({damping:9,mass:0.7})` scale 0→1 + ring draws via strokeDashoffset за 16f; `confetti` 80 частиц, gravity, разлёт 50°.
- Emphasis: на кадре 78 короткий scale-punch числа 1.0→1.06→1.0 за 8f.
- Exit: лучи opacity 1→0.3, всё `micro-scale-fade`.

**Переходы:** одна сцена, без внутренних presentation; шаблон самодостаточен (можно встроить через `zoom-through-transition` извне).

**Config (сокращённо):**
```ts
const milestone = {
  meta: { id: 'milestone-celebration', format: '16:9', fps: 30 },
  theme: { background: '#0E0A14', text: '#FFFFFF', accent: '#FFB020' },
  scenes: [{
    type: 'milestone-scene',
    durationInFrames: 120,
    content: { lead: 'We just hit', value: 10000, suffix: '', caption: 'users and counting' },
  }],
} as const
```

**Reuse:** `rolling-number`, `number-wheel`, `confetti`, `volumetric-rays`, `bottom-up-letters`, `staggered-fade-up`, `spring-scale-in`, `micro-scale-fade`.

**New:**
- `milestone-badge` — круглая печать-медальон, которая «штампуется» под числом: spring-scale появление + обводка-кольцо рисуется по периметру + опциональная лента с подписью. **Пропсы:** `label: string` (текст в центре/на ленте), `ringStroke: number` (дефолт 3), `ringColor: string`, `stampSpring: { damping; mass }`, `ribbonText?: string`, `size: number`. Внутри: SVG circle с `strokeDasharray`/`strokeDashoffset`, центр-текст `spring-scale-in`, лента — повёрнутый прямоугольник с `mask-reveal-up`.

---

### C4. Social Proof Stats
**Повод:** «Trusted by» — логотипы клиентов + 3 ключевые метрики в одном чистом плане для главной страницы.
**Длительность:** ~5.5 сек (165 кадров).
**Фон:** solid `theme.background`; `infinite-marquee` логотипов работает как нижняя лента, не как заливка.

**Сценарий (beats):**
1. **0–30f · Kicker** — «Trusted by teams at» проявляется `focus-blur-resolve`.
2. **30–75f · LogoStrip** — лента логотипов въезжает и запускает бесконечный `infinite-marquee` (медленный, ровный).
3. **75–135f · StatTrio** — три метрики считаются вверх в `stat-trio`, разделители прочерчиваются между ними.
4. **135–165f · Hold & fade** — лента продолжает идти, текст метрик чуть оседает, общий `fade-through` на выход.

**Анимации:**
- Kicker: `focus-blur-resolve` blur 10→0 + opacity 0→1 за 22f.
- LogoStrip: вход `short-slide-down` (translateY −20→0) у контейнера, затем `infinite-marquee` со скоростью 30px/сек, opacity логотипов 0.7 (приглушённые, не отвлекают).
- StatTrio: каждая колонка `rolling-number` со stagger 10f (лево→право); вертикальные разделители `mask-reveal-up` (рисуются сверху вниз) синхронно с появлением колонки; подписи под числами `staggered-fade-up`.
- Emphasis: суффиксы (`+`, `%`, `k`) появляются `micro-scale-fade` на финале счёта каждого числа.
- Exit: `fade-through`, маркиза не останавливается до самого конца.

**Переходы:** одна сцена; выход — `fade-through` (`linearTiming(15)`).

**Config (сокращённо):**
```ts
const proof = {
  meta: { id: 'social-proof-stats', format: '16:9', fps: 30 },
  theme: { background: '#FAFAFA', text: '#0A0A0A', accent: '#0A0A0A' },
  scenes: [{
    type: 'social-proof-scene',
    durationInFrames: 165,
    content: {
      kicker: 'Trusted by teams at',
      logos,                                   // string[] (src)
      stats: [
        { value: 12000, suffix: '+', label: 'Active users' },
        { value: 99.9, suffix: '%', label: 'Uptime' },
        { value: 4.9, suffix: '/5', label: 'Avg rating' },
      ],
    },
  }],
} as const
```

**Reuse:** `infinite-marquee`, `rolling-number`, `logo-enter`, `focus-blur-resolve`, `short-slide-down`, `staggered-fade-up`, `mask-reveal-up`, `micro-scale-fade`, `fade-through`.

**New:**
- `stat-trio` — три колонки метрик с прочерчивающимися вертикальными разделителями; каждая метрика считается вверх со staggered-входом. **Пропсы:** `stats: { value; suffix; label }[]` (ровно 3), `dividerColor: string`, `dividerStagger: number` (f между колонками, дефолт 10), `countDuration: number` (f на счёт, дефолт 45), `align: 'baseline' | 'center'`. Внутри: каждая колонка композирует `rolling-number` + подпись; разделители — тонкие линии с `mask-reveal-up` сверху вниз, появление синхронизировано с `dividerStagger`.

---

### C5. Review Spotlight `[9:16]`
**Повод:** один сильный отзыв из App Store / G2 как вертикальный Reels/Shorts.
**Длительность:** ~5 сек (150 кадров). Вертикаль `1080×1920`.
**Фон:** `spotlight-card` (узкое световое пятно сверху, фокус на аватаре), solid `theme.background`.

**Сценарий (beats):**
1. **0–24f · AvatarIn** — круглый аватар опускается сверху `short-slide-down` + scale-settle.
2. **24–54f · Stars** — пять звёзд заполняются слева направо в `star-rating-fill`.
3. **54–120f · Quote** — крупная цитата раскрывается построчно `line-by-line-slide`, ключевая фраза подсвечивается `marker-highlight`.
4. **120–150f · Attribution & exit** — имя/роль `short-slide-right`, всё уходит `scale-down-fade`.

**Анимации:**
- AvatarIn: `short-slide-down` translateY −80→0 + `spring({damping:14})` scale 0.8→1; тонкое кольцо вокруг аватара `mask-reveal-up` по окружности.
- Stars: `star-rating-fill` заполнение per-star stagger 5f + светлый sweep по ряду за 14f.
- Quote: `line-by-line-slide` (каждая строка translateX −24→0, opacity 0→1, stagger 8f); `marker-highlight` подложка под 1–2 словами рисуется слева направо за 12f после появления строки.
- Emphasis: цитата крупная, межстрочный 1.15, без uppercase/letter-spacing — редакторская типографика.
- Exit: `scale-down-fade` (scale 1→0.94, opacity 1→0) за 14f.

**Переходы:** одна сцена; формат `[9:16]` — `meta.format='9:16'`, всё центрируется по вертикальной оси, аватар в верхней трети.

**Config (сокращённо):**
```ts
const spotlight = {
  meta: { id: 'review-spotlight', format: '9:16', fps: 30 },
  theme: { background: '#101014', text: '#F5F5F7', accent: '#34C759' },
  scenes: [{
    type: 'review-scene',
    durationInFrames: 150,
    content: {
      avatar, name: 'Mara K.', role: 'Founder, Loop',
      rating: 5,
      quote: 'Shipped our launch video in an afternoon — felt like cheating.',
      highlight: 'in an afternoon',
    },
  }],
} as const
```

**Reuse:** `spotlight-card`, `line-by-line-slide`, `marker-highlight`, `short-slide-down`, `short-slide-right`, `scale-down-fade`, `mask-reveal-up`.

**New:**
- `star-rating-fill` — ряд из 5 звёзд, заполняющихся слева направо с per-star spring-stagger и проходящим световым sweep. **Пропсы:** `rating: number` (0–5, дробные через clip-маску), `count: number` (дефолт 5), `fillColor: string`, `emptyColor: string`, `stagger: number` (f между звёздами, дефолт 5), `sweep: boolean` (дефолт true), `size: number`. Внутри: каждая звезда = два слоя (пустая + залитая под `overflow:hidden` маской), заполнение `spring` по ширине маски; sweep — узкий градиент-пропуск, едущий `interpolate` по X ряда.

---


---

## D. Developer / OSS

Шесть шаблонов под dev-аудиторию: open source репозитории, CLI-утилиты, SDK/API, интеграции и деплой. Опора — чистая типографика как герой ролика плюс примитивы кода/терминала. Тёмные фоны уместны (`theme.background` solid, `dynamic-grid`, `volumetric-rays`). Каждый template — `<TransitionSeries>`, контент сериализуется в JSON-config `{ meta, theme, scenes }`, fps=30, 1920×1080, durationInFrames явный, total = сумма минус overlap. Уровень compositions удалён: где нужна «цельная сцена», изобретаем лёгкий компонент.

---

### D1. OSS Repo Showcase `[contributors]`

**Повод:** анонс/продвижение open source репозитория — показать traction (звёзды), людей за проектом и one-liner установки.
**Длительность:** ~13 сек (390 кадров). Для `[contributors=N]` сцена контрибьюторов = `clamp(90, 90 + N*4, 180)` кадров (волна появления плиток).
**Фон:** `dynamic-grid` (тонкая техно-сетка, dark) на всех сценах; на CTA — добавочный `spotlight-card` под кнопкой.

**Сценарий (beats):**
1. **0–90f · RepoTitle** — имя репозитория `acme/rocket` крупно по центру, под ним one-line описание.
2. **90–195f · StarsTraction** — `github-stars` отщёлкивает количество звёзд, рядом `rolling-number` для forks/issues.
3. **195–285f · Contributors** — `contributors-grid` (NEW) собирает сетку аватаров контрибьюторов волной.
4. **285–360f · InstallLine** — `terminal-simulator` печатает `npm i acme-rocket`, появляется галочка готовности.
5. **360–390f · CTA** — `cta-scene`: «Star it on GitHub» + URL.

**Анимации:**
- RepoTitle: имя через `per-character-rise` (stagger 2f/символ, `spring({frame, fps, config:{damping:14}})`), описание `soft-blur-in` с задержкой 12f. Exit — `micro-scale-fade` (scale 1→0.96, opacity→0).
- StarsTraction: `github-stars` entrance — иконка звезды `spring-scale-in`, число катится `interpolate` счётчиком; forks/issues `rolling-number` стартуют со сдвигом 8f друг от друга (каскад). Emphasis — лёгкий `shimmer-sweep` по числу звёзд на пике.
- Contributors: `contributors-grid` — аватары вылетают по диагонали, каждый `spring-scale-in` + opacity, stagger по индексу; заголовок «N contributors» через `rolling-number`.
- InstallLine: terminal печатает посимвольно (typewriter-движок симулятора), курсор мигает, после команды — строка вывода `staggered-fade-up` + зелёная галочка `spring-scale-in`.
- CTA: текст `tracking-in` (letter-spacing 0.3em→normal, blur→0), кнопка `micro-scale-fade`.

**Переходы:** RepoTitle→Stars `fade-through` (springTiming, 20f); Stars→Contributors `spatial-push` влево (linearTiming 18f); Contributors→Install `frosted-glass-wipe` (24f); Install→CTA `zoom-through-transition` (springTiming).

**Config (сокращённо):**
```ts
const config = {
  meta: { id: "oss-repo-showcase", title: "acme/rocket" },
  theme: { background: "#0A0A0B", accent: "#FFD23F", text: "#F5F5F5", font: "Geist Mono" },
  scenes: [
    { type: "repo-title", durationInFrames: 90,
      content: { repo: "acme/rocket", tagline: "Ship faster with rockets" } },
    { type: "stars-traction", durationInFrames: 105,
      content: { stars: 12400, forks: 840, issues: 37 },
      transition: { type: "fade-through", timing: "spring", duration: 20 } },
    { type: "contributors", durationInFrames: 90,
      content: { count: 48, avatars: ["...urls"] },
      transition: { type: "spatial-push", direction: "left", duration: 18 } },
    { type: "install-line", durationInFrames: 75,
      content: { cmd: "npm i acme-rocket" },
      transition: { type: "frosted-glass-wipe", duration: 24 } },
    { type: "cta-scene", durationInFrames: 30,
      content: { label: "Star it on GitHub", url: "github.com/acme/rocket" },
      transition: { type: "zoom-through", timing: "spring" } },
  ],
};
```

**Reuse:** `github-stars`, `rolling-number`, `terminal-simulator`, `per-character-rise`, `soft-blur-in`, `tracking-in`, `shimmer-sweep`, `spring-scale-in`, `staggered-fade-up`, `micro-scale-fade`, `dynamic-grid`, `spotlight-card`, `cta-scene`.
**New:**
- `contributors-grid` — сетка аватаров контрибьюторов, появляющихся волной. Принимает массив `{avatarUrl, login}` и собирает адаптивную grid (columns auto по count). Каждая плитка анимируется `spring({frame: frame - i*stagger, fps, config})` для scale+opacity, позиция через `interpolate` от off-diagonal к финальной клетке. Props: `avatars: {avatarUrl: string; login?: string}[]`, `columns?: number` (default auto), `stagger?: number` (default 3), `shape?: 'circle' | 'rounded'` (default circle), `maxVisible?: number` (остаток схлопывается в «+N» плитку). `count` инферится из `avatars.length`.

---

### D2. CLI / Tool Demo

**Повод:** демо CLI-утилиты — показать команду, живой вывод в терминале и результат её работы в окне.
**Длительность:** ~14 сек (420 кадров). Фиксированная (один сценарий команды).
**Фон:** `theme.background` solid (глубокий dark `#0C0E12`); под `browser-frame` — `volumetric-rays` мягко из верхнего угла.

**Сценарий (beats):**
1. **0–75f · ToolName** — название тулзы `vercel-snap` + тэглайн.
2. **75–210f · CommandType** — `terminal-simulator` печатает `npx vercel-snap build --prod`.
3. **210–315f · LiveOutput** — в том же терминале строки лога появляются потоком (build steps), последняя — `✓ Done in 2.4s`.
4. **315–405f · ResultReveal** — `browser-frame` (NEW) разворачивается и показывает результат (превью задеплоенной страницы / артефакт).
5. **405–420f · Sign-off** — короткий `title-scene` с лого тулзы.

**Анимации:**
- ToolName: имя `kinetic-center-build` (символы собираются к центру из разлёта), тэглайн `line-by-line-slide` снизу. Exit `mask-reveal-up` (контент уезжает за маску).
- CommandType: terminal печатает посимвольно ~3 символа/кадр, prompt `$` мигает; entrance окна терминала — `frosted-glass-wipe` сверху.
- LiveOutput: лог-строки `staggered-fade-up` (каждая 6f), числа в строках (size, time) — `rolling-number`; финальная `✓ Done` подсвечена `marker-highlight` (зелёный свайп под текстом).
- ResultReveal: `browser-frame` entrance — `spring-scale-in` всего окна (`spring({frame, fps, config:{damping:18, stiffness:120}})`) от 0.9, верхняя «chrome»-полоса с урлом печатается `typewriter`, контент внутри `soft-blur-in`.
- Sign-off: `logo-enter` лого + имя `micro-scale-fade`.

**Переходы:** ToolName→Command `directional-wipe` вниз (linearTiming 20f); внутри терминала Command→Output — без cut (одна Sequence, контент дописывается); Output→Result `shared-axis-z` (springTiming, терминал уходит в глубину, browser-frame выходит вперёд); Result→Sign-off `fade-through` (16f).

**Config (сокращённо):**
```ts
const config = {
  meta: { id: "cli-tool-demo", title: "vercel-snap" },
  theme: { background: "#0C0E12", accent: "#22D3A6", text: "#E8EAED", font: "JetBrains Mono" },
  scenes: [
    { type: "tool-name", durationInFrames: 75,
      content: { name: "vercel-snap", tagline: "Snapshot deploys, zero config" } },
    { type: "terminal", durationInFrames: 240,
      content: {
        prompt: "$",
        commands: [{ cmd: "npx vercel-snap build --prod", typeAt: 0 }],
        output: [
          { text: "Collecting routes...", at: 140 },
          { text: "Building 24 pages...", at: 165 },
          { text: "✓ Done in 2.4s", at: 195, highlight: true },
        ],
      },
      transition: { type: "directional-wipe", direction: "down", duration: 20 } },
    { type: "browser-frame", durationInFrames: 90,
      content: { url: "vercel-snap.app", screenshot: "/preview.png" },
      transition: { type: "shared-axis-z", timing: "spring" } },
    { type: "title-scene", durationInFrames: 15,
      content: { logo: "/logo.svg", name: "vercel-snap" },
      transition: { type: "fade-through", duration: 16 } },
  ],
};
```

**Reuse:** `terminal-simulator`, `rolling-number`, `kinetic-center-build`, `line-by-line-slide`, `mask-reveal-up`, `staggered-fade-up`, `marker-highlight`, `soft-blur-in`, `spring-scale-in`, `logo-enter`, `micro-scale-fade`, `volumetric-rays`, `frosted-glass-wipe`, `title-scene`.
**New:**
- `browser-frame` — лёгкое окно браузера (chrome-полоса: traffic-light кнопки, адресная строка) вокруг произвольного контента/скриншота. НЕ полноценная «сцена деплоя», просто рамка-обёртка. Entrance: `spring-scale-in` рамки + `typewriter` для url в адресной строке. Props: `url: string`, `children?: ReactNode` (контент), `screenshot?: string` (если без children — img внутри), `chrome?: 'mac' | 'minimal'` (default mac), `typeUrl?: boolean` (default true), `accent?: string` (цвет активного таба). Контент остаётся прозрачным/переданным — рамка ничего не закрашивает кроме chrome.

---

### D3. Code Walkthrough `[steps]`

**Повод:** пошаговый разбор кода/паттерна — показать сниппет и провести зрителя по ключевым строкам.
**Длительность:** ~6 сек база + шаги. Для `[steps=N]` total = `60 (intro) + N*120 (по шагу) + 45 (outro)` кадров. Пример N=3 → ~13.5 сек (405 кадров).
**Фон:** `theme.background` solid dark; за код-блоком тонкий `dynamic-grid` (низкая прозрачность) для глубины.

**Сценарий (beats):**
1. **0–60f · Intro** — заголовок «How `useDeferredValue` works» + язык/файл.
2. **60–180f · Step 1** — `glass-code-walk` показывает блок, подсвечивает строки 3–5, сбоку всплывает аннотация.
3. **180–300f · Step 2** — фокус смещается на строки 8–11 (scroll + highlight), аннотация меняется.
4. **300–360f · Step N** — финальная подсветка результата/return.
5. **360–405f · Outro** — `cta-scene` «Read the full guide».

**Анимации:**
- Intro: заголовок `per-word-crossfade` (слова сменяются с лёгким blur), подпись файла `soft-blur-in`. Exit `micro-scale-fade`.
- Steps: ядро — `glass-code-walk`. На каждом шаге: активные строки получают `marker-highlight` (свайп подложки), неактивные приглушаются (opacity 0.4 через `interpolate`); код плавно скроллит к активному блоку (`interpolate(frame, ..., {extrapolateRight:'clamp'})` translateY, spring-сглаживание). Аннотация справа — `line-by-line-slide` + `inline-highlight` на ключевом термине. Между шагами номер шага `number-wheel` (1→2→3).
- Outro: `cta-scene`, текст `tracking-in`.

**Переходы:** Intro→Step1 `fade-through` (18f); между шагами — НЕ cut, единый `glass-code-walk` инстанс, переход фокуса внутренней анимацией (scroll+highlight crossfade); последний Step→Outro `frosted-glass-wipe` вверх (22f).

**Config (сокращённо):**
```ts
const config = {
  meta: { id: "code-walkthrough", title: "useDeferredValue" },
  theme: { background: "#0B0D10", accent: "#7C9EFF", text: "#D7DBE0", font: "Geist Mono" },
  scenes: [
    { type: "title-scene", durationInFrames: 60,
      content: { title: "How useDeferredValue works", file: "search.tsx · TS" } },
    { type: "code-walk", durationInFrames: 285,
      content: {
        code: "const deferred = useDeferredValue(query)\n...",
        lang: "tsx",
        steps: [
          { lines: [3, 5], note: "Defers the value to a low-priority render", at: 0 },
          { lines: [8, 11], note: "List re-renders without blocking input", at: 120 },
          { lines: [14], note: "Return stays responsive", at: 240 },
        ],
      },
      transition: { type: "fade-through", duration: 18 } },
    { type: "cta-scene", durationInFrames: 45,
      content: { label: "Read the full guide", url: "acme.dev/guide" },
      transition: { type: "frosted-glass-wipe", direction: "up", duration: 22 } },
  ],
};
```

**Reuse:** `glass-code-walk`, `marker-highlight`, `inline-highlight`, `number-wheel`, `per-word-crossfade`, `line-by-line-slide`, `soft-blur-in`, `tracking-in`, `micro-scale-fade`, `dynamic-grid`, `title-scene`, `cta-scene`.
**New:**
- `step-scene` (glue) — обёртка-оркестратор пошаговых сцен: принимает массив шагов с `at`-кадрами и прокидывает активный индекс детям через render-prop. Считает текущий шаг из `useCurrentFrame()`, экспонирует `progressWithinStep` для интерполяций. Props: `steps: {at: number; label?: string}[]`, `children: (s: {index: number; progress: number; total: number}) => ReactNode`, `indicator?: 'number-wheel' | 'progress-steps' | 'none'` (default number-wheel). `total` инферится из `steps.length`. Используется D3 для синхронизации скролла/подсветки с прогрессом шага.

---

### D4. API / SDK Intro

**Повод:** представить API/SDK — показать как «послать запрос» и какой чистый ответ приходит, посыл «it just works».
**Длительность:** ~12 сек (360 кадров). Фиксированная.
**Фон:** `theme.background` solid dark с `volumetric-rays` (лёгкие лучи слева, ощущение «света из API»); под блоками `spotlight-card`.

**Сценарий (beats):**
1. **0–75f · Headline** — «One call. Everything you need.» + имя SDK.
2. **75–180f · RequestBlock** — `glass-code-block` показывает запрос (`acme.users.get(id)` / fetch).
3. **180–195f · DataFlow** — `data-flow-pipes` короткой вспышкой соединяет запрос → ответ (потоки данных бегут по линиям).
4. **195–315f · ResponseBlock** — `json-block` (NEW) построчно раскрывает структурированный JSON-ответ.
5. **315–360f · Payoff** — крупная строка «It just works.» + CTA-ссылка на docs.

**Анимации:**
- Headline: «One call.» `per-character-rise`, «Everything you need.» `soft-blur-in` с задержкой; имя SDK `tracking-in`. Exit `mask-reveal-up`.
- RequestBlock: `glass-code-block` entrance `spring-scale-in` (от 0.94), код печатается `typewriter`, имя метода `inline-highlight`. На пике — лёгкий `shimmer-sweep` по стеклянной поверхности.
- DataFlow: `data-flow-pipes` — линии от нижней грани request к верхней грани response, частицы/дэши бегут `interpolate` по path (offset анимируется), яркость на пике.
- ResponseBlock: `json-block` — фигурные скобки появляются первыми (`spring-scale-in`), затем ключи/значения построчно `staggered-fade-up` (stagger 5f), значения-числа через `rolling-number`, строковые значения `typewriter`. Синтаксическая подсветка по типам.
- Payoff: «It just works.» `kinetic-center-build`, CTA `micro-scale-fade`.

**Переходы:** Headline→Request `spatial-push` вверх (linearTiming 18f); Request→Response — `data-flow-pipes` как мостик (без жёсткого cut, оба блока в одной Sequence, pipes overlap 15f); Response→Payoff `zoom-through-transition` (springTiming).

**Config (сокращённо):**
```ts
const config = {
  meta: { id: "api-sdk-intro", title: "acme-sdk" },
  theme: { background: "#0A0C0F", accent: "#5EEAD4", text: "#E6E8EB", font: "JetBrains Mono" },
  scenes: [
    { type: "headline", durationInFrames: 75,
      content: { lines: ["One call.", "Everything you need."], sdk: "acme-sdk" } },
    { type: "code-block", durationInFrames: 105,
      content: { code: "const user = await acme.users.get(id)", lang: "ts" },
      transition: { type: "spatial-push", direction: "up", duration: 18 } },
    { type: "json-block", durationInFrames: 120,
      content: {
        json: { id: "u_123", name: "Ada", plan: "pro", seats: 12, active: true },
      },
      transition: { type: "data-flow", overlap: 15 } },
    { type: "payoff", durationInFrames: 60,
      content: { text: "It just works.", url: "docs.acme.dev" },
      transition: { type: "zoom-through", timing: "spring" } },
  ],
};
```

**Reuse:** `glass-code-block`, `data-flow-pipes`, `rolling-number`, `per-character-rise`, `soft-blur-in`, `tracking-in`, `inline-highlight`, `shimmer-sweep`, `mask-reveal-up`, `kinetic-center-build`, `spring-scale-in`, `staggered-fade-up`, `micro-scale-fade`, `volumetric-rays`, `spotlight-card`.
**New:**
- `json-block` — построчное раскрытие структурированного JSON с синтаксической подсветкой по типу. Парсит объект, рендерит дерево с правильным indent, анимирует появление строк по уровням (скобки → ключи → значения). Числа через `rolling-number`, строки `typewriter`, booleans `spring-scale-in`. Props: `json: Record<string, unknown>` (значения сериализуемы), `stagger?: number` (default 5), `theme?: 'glass' | 'plain'` (default glass), `revealOrder?: 'top-down' | 'depth-first'` (default top-down), `accent?: string`. Подсветка типов инферится из значений автоматически — без ручной разметки токенов.

---

### D5. Integration Announcement

**Повод:** «now works with X» — анонс новой интеграции/поддержки сторонних сервисов; показать продукт в центре и партнёров-спутников вокруг.
**Длительность:** ~11 сек (330 кадров). Фиксированная.
**Фон:** `theme.background` solid dark; на сцене спутников — `dynamic-grid` (радиальное ощущение пространства), без glow.

**Сценарий (beats):**
1. **0–90f · Announce** — «Now works with» крупно, ниже appearance имени продукта.
2. **90–105f · ProductCore** — лого продукта `logo-enter` встаёт в центр.
3. **105–240f · Constellation** — `logo-constellation` (NEW) выводит логотипы партнёров на орбиты вокруг центра, они «прилетают» и встают по кругу, тонкие линии-связи.
4. **240–300f · CountStat** — `rolling-number` «48+ integrations» + подпись.
5. **300–330f · CTA** — `cta-scene` «Explore integrations».

**Анимации:**
- Announce: «Now works with» через `staggered-fade-up` пословно, имя продукта `tracking-in`. Exit на ProductCore — текст `micro-scale-fade` уходит вверх.
- ProductCore: `logo-enter` (scale + spring), короткий `shimmer-sweep` по логотипу как «фокус».
- Constellation: `logo-constellation` — каждый партнёрский логотип `spring({frame: frame - i*stagger, fps, config})` влетает по радиусу от центра к своей орбитальной точке (позиции на окружности через cos/sin от индекса), линии-коннекторы рисуются `interpolate` (stroke-dashoffset) после прилёта. Лёгкое орбитальное вращение всей системы (медленный `interpolate` rotation, ±3°). Имена партнёров подписями `soft-blur-in`.
- CountStat: `rolling-number` катится 0→48, суффикс «+» `spring-scale-in`; подпись `inline-highlight` на слове «integrations».
- CTA: `tracking-in` + кнопка `micro-scale-fade`.

**Переходы:** Announce→ProductCore `fade-through` (16f); ProductCore→Constellation — без cut (лого остаётся центром, спутники добавляются в той же Sequence); Constellation→CountStat `frosted-glass-wipe` (20f); CountStat→CTA `spatial-push` вверх (linearTiming 16f).

**Config (сокращённо):**
```ts
const config = {
  meta: { id: "integration-announcement", title: "Now works with everything" },
  theme: { background: "#08090C", accent: "#A78BFA", text: "#ECEDEF", font: "Geist" },
  scenes: [
    { type: "announce", durationInFrames: 90,
      content: { kicker: "Now works with", product: "Acme" } },
    { type: "logo-constellation", durationInFrames: 150,
      content: {
        center: "/acme.svg",
        partners: [
          { logo: "/slack.svg", label: "Slack" },
          { logo: "/github.svg", label: "GitHub" },
          { logo: "/linear.svg", label: "Linear" },
          { logo: "/notion.svg", label: "Notion" },
        ],
      },
      transition: { type: "fade-through", duration: 16 } },
    { type: "stat-recap", durationInFrames: 60,
      content: { value: 48, suffix: "+", label: "integrations" },
      transition: { type: "frosted-glass-wipe", duration: 20 } },
    { type: "cta-scene", durationInFrames: 30,
      content: { label: "Explore integrations", url: "acme.dev/integrations" },
      transition: { type: "spatial-push", direction: "up", duration: 16 } },
  ],
};
```

**Reuse:** `logo-enter`, `rolling-number`, `shimmer-sweep`, `tracking-in`, `staggered-fade-up`, `soft-blur-in`, `inline-highlight`, `spring-scale-in`, `micro-scale-fade`, `dynamic-grid`, `cta-scene`, `stat-recap`.
**New:**
- `logo-constellation` — центральный логотип + партнёрские логотипы на орбитах вокруг, с линиями-связями. НЕ ecosystem-constellation composition — это лёгкий self-contained примитив без сцен/переходов внутри. Раскладывает партнёров по окружности (равный угловой шаг или заданный `radius`), анимирует прилёт от центра наружу `spring`, рисует коннекторы через `stroke-dashoffset`. Props: `center: string` (логотип в центре), `partners: {logo: string; label?: string; orbit?: number}[]`, `radius?: number` (default 360), `stagger?: number` (default 4), `connectors?: boolean` (default true), `spin?: number` (амплитуда лёгкого вращения в градусах, default 0). Кол-во орбитальных точек инферится из `partners.length`. Без glow — связи это тонкие линии `theme.accent` низкой прозрачности.

---

### D6. Deploy Story

**Повод:** «от команды до живого результата» — терминал прогоняет деплой, и в финале раскрывается работающий результат (URL/превью). Драматургия «build → ship → live».
**Длительность:** ~14 сек (420 кадров). Фиксированная.
**Фон:** `theme.background` solid очень тёмный (`#070809`) на терминальной части; на reveal — `volumetric-rays` (свет «выходит» из развернувшегося результата), под карточкой `spotlight-card`.

**Сценарий (beats):**
1. **0–60f · Intro** — «Ship it.» крупно, имя проекта/окружения (prod).
2. **60–210f · DeployRun** — `terminal-simulator` печатает `git push` / `acme deploy`, лог деплоя бежит (build, upload, dns), прогресс через `progress-steps`.
3. **210–240f · Finalizing** — последняя строка `✓ Deployed to production`, прогресс заполняется, мигает зелёным.
4. **240–360f · DeployReveal** — `deploy-reveal` (NEW): терминал «складывается» и из него раскрывается карточка результата с живым URL, статусом и метрикой.
5. **360–420f · CTA** — `cta-scene` «Visit the site» + URL, `stat-recap` опционально.

**Анимации:**
- Intro: «Ship it.» `kinetic-center-build`, окружение `inline-highlight` (бейдж «production»). Exit `mask-reveal-up`.
- DeployRun: terminal печатает команду `typewriter`, лог-строки `staggered-fade-up` (каскад 5f), технические числа (`120 KB`, `0.8s`) — `rolling-number`; `progress-steps` снизу проходит этапы Build→Upload→DNS→Live с подсветкой текущего.
- Finalizing: `✓ Deployed` строка `marker-highlight` (зелёный свайп), progress последний сегмент `spring-scale-in`, короткий `shimmer-sweep` по всей progress-полосе.
- DeployReveal: `deploy-reveal` — терминал уменьшается/складывается вверх (`interpolate(frame, ..., {extrapolateLeft:'clamp', extrapolateRight:'clamp'})` для scale+translateY), из его «низа» раскрывается result-card (`spring-scale-in`, mask-clip снизу вверх), внутри: URL `typewriter`, status-dot `spring-scale-in` (зелёный «Live»), метрика отклика `rolling-number`. Лёгкий `soft-blur-in` контента карточки.
- CTA: URL `tracking-in`, кнопка `micro-scale-fade`.

**Переходы:** Intro→DeployRun `directional-wipe` вниз (linearTiming 18f); DeployRun→Finalizing — без cut (одна Sequence терминала); Finalizing→Reveal `shared-axis-z` (springTiming, терминал в глубину, карточка вперёд) — реализуется внутри `deploy-reveal`; Reveal→CTA `fade-through` (18f).

**Config (сокращённо):**
```ts
const config = {
  meta: { id: "deploy-story", title: "Ship it" },
  theme: { background: "#070809", accent: "#34D399", text: "#E5E7EB", font: "JetBrains Mono" },
  scenes: [
    { type: "title-scene", durationInFrames: 60,
      content: { title: "Ship it.", badge: "production" } },
    { type: "terminal", durationInFrames: 180,
      content: {
        commands: [{ cmd: "acme deploy --prod", typeAt: 0 }],
        steps: ["Build", "Upload", "DNS", "Live"],
        output: [
          { text: "Bundled 120 KB in 0.8s", at: 80 },
          { text: "Uploading assets...", at: 110 },
          { text: "✓ Deployed to production", at: 150, highlight: true },
        ],
      },
      transition: { type: "directional-wipe", direction: "down", duration: 18 } },
    { type: "deploy-reveal", durationInFrames: 120,
      content: { url: "acme.app", status: "Live", responseMs: 84 },
      transition: { type: "shared-axis-z", timing: "spring" } },
    { type: "cta-scene", durationInFrames: 60,
      content: { label: "Visit the site", url: "acme.app" },
      transition: { type: "fade-through", duration: 18 } },
  ],
};
```

**Reuse:** `terminal-simulator`, `progress-steps`, `rolling-number`, `kinetic-center-build`, `inline-highlight`, `marker-highlight`, `staggered-fade-up`, `shimmer-sweep`, `mask-reveal-up`, `spring-scale-in`, `soft-blur-in`, `tracking-in`, `micro-scale-fade`, `volumetric-rays`, `spotlight-card`, `title-scene`, `cta-scene`, `stat-recap`.
**New:**
- `deploy-reveal` — переход «терминал → результат»: складывает терминальное окно и раскрывает result-card с живым URL/статусом/метрикой. НЕ terminal-to-browser-deploy composition — это один лёгкий компонент-переход, не сцена с собственным config. Внутри: фаза 1 (collapse) — `interpolate` scale/translateY/opacity терминала; фаза 2 (reveal) — `spring-scale-in` карточки с clip-маской снизу вверх. Props: `url: string`, `status?: string` (default "Live"), `responseMs?: number`, `collapseAt?: number` (кадр начала фазы 2, default 30), `card?: 'browser' | 'badge'` (default badge — компактная карточка статуса; `browser` оборачивает в browser-frame-стиль). Прозрачный фон, ничего не закрашивает кроме самой карточки/chrome.

---

# Templates — Data & Metrics / Sales & Conversion

Уровень `compositions` удалён. Каждый template строится только из типографики (герой ролика), примитивов чисел/чартов/фонов/переходов и новых лёгких типографических компонентов, спецификации которых даны в блоках **New**.

Template — это `<TransitionSeries>`, управляемый сериализуемым JSON-config:

```ts
type TemplateConfig = {
  meta: { id: string; title: string; aspect: "16:9"; fps: 30 };
  theme: {
    background: string;
    foreground: string;
    accent: string;
    muted: string;
    fontHeading: string;
    fontBody: string;
  };
  scenes: Array<{
    type: string;
    durationInFrames: number;
    content: Record<string, unknown>;
    transition?: { presentation: string; timing: "linearTiming" | "springTiming"; durationInFrames: number };
  }>;
};
```

Правила: `fps=30`, `1920×1080`. `total = Σ durationInFrames − Σ overlap`. Все `interpolate(...)` с `extrapolateLeft/Right:'clamp'`. Пружины — `spring({ frame, fps, config })`. Переходы — брендовые presentation с `linearTiming`/`springTiming`. Никаких glow / gradient-text / decorative uppercase. Фоны только из `volumetric-rays`, `dynamic-grid`, `spotlight-card`, `solid theme.background`. Типографика — опора каждой сцены.

---

## E. Data & Metrics

### E1. Year in Review / Recap `[N]`

**Повод:** годовой/квартальный wrap-up — серия растущих по силе цифр, «вот сколько всего случилось за год». **Длительность:** ~3+2.5×N сек. Для `[N]` метрик: `total = 90 (интро) + N×120 (stat-beat) − N×15 (overlap) + 90 (recap)` кадров. **Фон:** `solid theme.background` с очень тонким статичным `dynamic-grid` (opacity 0.06), общий для всех сцен — непрерывность «приборной панели года».

**Сценарий (beats):**
1. **0–90f · IntroTitle** — `title-scene`: год собирается по символам, под ним подзаголовок «Year in review».
2. **90–210f · StatBeat #1** — первая метрика, спокойный ритм: крупная `rolling-number`, подпись слева.
3. **210–330f · StatBeat #2** — ритм ускоряется, смена композиционной оси (число справа, подпись слева).
4. **…StatBeat #N** — чередование лево/право, stagger входа подписи уменьшается (24f→16f→10f), кульминация на последней.
5. **последние 90f · RecapWall** — `stat-recap` собирает все N цифр в компактную сетку + CTA-строка.

**Анимации:**
- IntroTitle: год — `kinetic-center-build` (per-glyph spring `config:{ damping: 14 }`, собирается за 30f, stagger 2f); подзаголовок — `soft-blur-in` (blur 12→0px за 24f, opacity 0→1). Exit — `blur-out-up` (y 0→−40, blur 0→8, 14f).
- StatBeat: число — `rolling-number` 0→target за 45f, ease-out (`Easing.out(Easing.cubic)`); ярлык — `staggered-fade-up` по словам (y 24→0, stagger по сцене). Emphasis на кадре финала роллинга — `spring-scale-in` пульс 1.0→1.06→1.0 (`config:{ damping: 8 }`). Exit — `blur-out-up`.
- RecapWall: N цифр влетают `staggered-fade-up` (stagger 8f) в grid 2×⌈N/2⌉; акцентная цифра пульсирует `micro-scale-fade`; CTA — `tracking-in` (letter-spacing 0.3em→0).

**Переходы:** между StatBeat — `fade-through` (springTiming, `config:{ damping: 200 }`, 15f). Intro→Beat#1 — `shared-axis-y` (linearTiming 18f). Beat#N→RecapWall — `spatial-push` вверх (linearTiming 20f).

**Config (сокращённо):**
```ts
{
  meta: { id: "year-in-review", title: "Year in Review", aspect: "16:9", fps: 30 },
  theme: { background: "#0A0A0F", foreground: "#FAFAFA", accent: "#6366F1", muted: "#6B7280", fontHeading: "Geist", fontBody: "Geist" },
  scenes: [
    { type: "title-scene", durationInFrames: 90, content: { kicker: "2025", title: "Year in review" } },
    { type: "stat-beat", durationInFrames: 120, content: { value: 1284000, format: "compact", label: "requests served", align: "left" },
      transition: { presentation: "shared-axis-y", timing: "linearTiming", durationInFrames: 18 } },
    { type: "stat-beat", durationInFrames: 120, content: { value: 98.4, suffix: "%", label: "uptime", align: "right" },
      transition: { presentation: "fade-through", timing: "springTiming", durationInFrames: 15 } },
    { type: "stat-recap", durationInFrames: 90, content: { mode: "wall", cta: "See the full report" },
      transition: { presentation: "spatial-push", timing: "linearTiming", durationInFrames: 20 } }
  ]
}
```

**Reuse:** `rolling-number`, `title-scene`, `stat-recap`, `kinetic-center-build`, `soft-blur-in`, `staggered-fade-up`, `blur-out-up`, `spring-scale-in`, `micro-scale-fade`, `tracking-in`, `dynamic-grid`.

**New:**
- `stat-beat` — полноэкранная одиночная метрика как самостоятельная сцена: крупное число + ярлык + опциональный дельта-бейдж. Пропсы: `{ value: number; format?: "plain"|"compact"|"currency"; prefix?: string; suffix?: string; label: string; delta?: { value: number; direction: "up"|"down" }; align?: "left"|"center"|"right" }`. Внутри оборачивает `rolling-number`, сам управляет композиционной осью через `align`. Прозрачный фон.

---

### E2. Dashboard Tour

**Повод:** показать продукт-аналитику «изнутри» без скриншота дашборда — типографический тур по ключевым числам с callout'ами. **Длительность:** ~12 сек (360f), одна непрерывная сцена с фазами фокуса. **Фон:** `spotlight-card` — мягкое световое пятно ведёт по активной зоне сетки, остальное приглушено.

**Сценарий (beats):**
1. **0–60f · GridAssemble** — четыре `kpi-card` собираются в сетку 2×2.
2. **60–150f · FocusTopLeft** — spotlight наезжает на первую карточку, рядом `marker-highlight` callout.
3. **150–240f · FocusTopRight** — фокус переезжает, число во второй карточке досчитывается.
4. **240–300f · FocusBottomRow** — нижний ряд подсвечивается вместе, сравнительная подпись `inline-highlight`.
5. **300–360f · PullBack** — spotlight расходится, вся сетка в фокусе, итоговая строка + micro-CTA.

**Анимации:**
- GridAssemble: 4 карточки — `spring-scale-in` (scale 0.8→1, `config:{ damping: 18, stiffness: 120 }`) каскадом по диагонали stagger 5f; числа — `rolling-number`.
- Focus*: активная карточка — `micro-scale-fade` (scale 1→1.06), неактивные `interpolate` opacity 1→0.4 за 12f. Число активной — `number-wheel` доезд 36f. Callout — `marker-highlight` (заливка прорисовывается слева-направо за 24f поверх ключевого слова), второстепенное — `inline-highlight`.
- Spotlight: центр пятна `interpolate` по x/y между якорями карточек, `Easing.inOut(Easing.cubic)`, 18f на переезд.
- PullBack: сетка `scale-down-fade` (scale 1→0.96, opacity 1→0.9), итоговая строка `line-by-line-slide` снизу; аннотация-CTA `tracking-in`.

**Переходы:** фазы фокуса живут в одном `<Sequence>` через смену spotlight-якоря (без межсценовых cut'ов). На вход/выход template — `frosted-glass-wipe` (linearTiming 16f).

**Config (сокращённо):**
```ts
{
  scenes: [
    { type: "kpi-grid", durationInFrames: 360, content: {
      cards: [
        { value: 42100, label: "MRR", prefix: "$", callout: "up 38% MoM" },
        { value: 1290, label: "active teams", callout: "new record" },
        { value: 7.4, suffix: "%", label: "churn", callout: "down from 9.1%" },
        { value: 312, label: "NPS responses" }
      ],
      tour: ["top-left", "top-right", "bottom-row", "all"]
    } }
  ]
}
```

**Reuse:** `number-wheel`, `rolling-number`, `marker-highlight`, `inline-highlight`, `spring-scale-in`, `micro-scale-fade`, `scale-down-fade`, `line-by-line-slide`, `tracking-in`, `spotlight-card`, `frosted-glass-wipe`.

**New:**
- `kpi-card` — атомарная карточка метрики для типографических сеток: число сверху, ярлык снизу, опциональный callout-слот. Пропсы: `{ value: number; prefix?: string; suffix?: string; label: string; callout?: string; active?: boolean }`. Прозрачный фон, бордюр `1px theme.muted/20`; `active` управляет масштабом и приглушением. Не содержит собственного `<Sequence>` — таймингом управляет родитель.
- `kpi-grid` — сцена-оркестратор: раскладывает массив `kpi-card` в адаптивную сетку и проигрывает `tour` — список якорей фокуса, синхронизируя spotlight и callout'ы. Пропсы: `{ cards: KpiCard[]; tour: Array<"top-left"|"top-right"|"bottom-left"|"bottom-right"|"top-row"|"bottom-row"|"all"> }`.

---

### E3. Metrics Report `[N]`

**Повод:** строгий отчёт по показателям — каждый чарт на отдельном экране с подписью, как слайды квартального ревью. **Длительность:** ~2.5 сек на чарт. Для `[N]`: `total = 60 (cover) + N×105 (chart-panel) − (N−1)×18 (overlap) + 60 (close)` кадров. **Фон:** `solid theme.background`, под графиком статичный `dynamic-grid` как координатная сетка (opacity 0.1, выровнен по осям чарта).

**Сценарий (beats):**
1. **0–60f · ReportCover** — `title-scene`: заголовок отчёта + период.
2. **60–165f · ChartPanel #1** — `animated-bar-chart`: оси, столбцы вырастают, подпись-вывод.
3. **165–270f · ChartPanel #2** — `animated-line-chart`: линия прочерчивается, аннотация пика.
4. **…ChartPanel #N** — чередование bar/line, единый ритм входа: ось → данные → вывод-подпись.
5. **последние 60f · ReportClose** — `stat-recap` ключевых дельт + источник данных мелким шрифтом.

**Анимации:**
- ReportCover: заголовок — `top-down-letters` (per-glyph y −30→0, stagger 2.5f); период — `soft-blur-in`.
- ChartPanel заголовок — `mask-reveal-up` (clip-path снизу-вверх за 16f); подпись оси — `staggered-fade-up`.
- `animated-bar-chart`: высоты столбцов `interpolate` 0→value за 30f clamp, stagger 6f, `spring` финальный «доскок» (`config:{ damping: 12 }`); значения над столбцами — `rolling-number` синхронно.
- `animated-line-chart`: `strokeDashoffset` от длины пути к 0 за 50f (`Easing.inOut(Easing.cubic)`); маркер-точка на пике — `spring-scale-in` после прочерчивания; аннотация — `inline-highlight`.
- Exit панели: `scale-down-fade` + заголовок `blur-out-up`.

**Переходы:** ChartPanel↔ChartPanel — `directional-wipe` горизонтальный (linearTiming 18f, «перелистывание слайдов», направление чередуется). Cover→Panel#1 — `shared-axis-z` (linearTiming 20f). Panel#N→Close — `fade-through` (15f).

**Config (сокращённо):**
```ts
{
  scenes: [
    { type: "title-scene", durationInFrames: 60, content: { title: "Q2 Metrics Report", kicker: "Apr — Jun 2025" } },
    { type: "chart-panel", durationInFrames: 105, content: {
      chart: "bar", title: "Signups by month",
      series: [{ label: "Apr", value: 18 }, { label: "May", value: 24 }, { label: "Jun", value: 38 }], unit: "k" },
      transition: { presentation: "shared-axis-z", timing: "linearTiming", durationInFrames: 20 } },
    { type: "chart-panel", durationInFrames: 105, content: {
      chart: "line", title: "MRR",
      series: [{ label: "W1", value: 28 }, { label: "W2", value: 33 }, { label: "W3", value: 40 }, { label: "W4", value: 47 }],
      annotation: { at: "W4", text: "crossed $45k" } },
      transition: { presentation: "directional-wipe", timing: "linearTiming", durationInFrames: 18 } }
  ]
}
```

**Reuse:** `animated-bar-chart`, `animated-line-chart`, `rolling-number`, `title-scene`, `stat-recap`, `top-down-letters`, `mask-reveal-up`, `staggered-fade-up`, `inline-highlight`, `spring-scale-in`, `scale-down-fade`, `blur-out-up`, `dynamic-grid`.

**New:**
- `chart-panel` — сцена-обёртка над одним графиком с типографическим заголовком и осями: выбирает `bar`/`line`, прокидывает `series`, рисует подпись и опциональную аннотацию пика. Пропсы: `{ chart: "bar"|"line"; title: string; series: Array<{ label: string; value: number }>; unit?: string; annotation?: { at: string; text: string } }`. Цвета берёт из `theme`. Прозрачный фон.

---

### E4. Funnel / Growth Story

**Повод:** нарратив роста — «было мало → стало много», воронка сужается, кривая идёт вверх-и-вправо. **Длительность:** ~14 сек (420f). **Фон:** `volumetric-rays` снизу-слева вверх-вправо (направление совпадает с вектором роста), низкая интенсивность (opacity 0.12), медленный дрейф.

**Сценарий (beats):**
1. **0–70f · Hook** — крупный вопрос `per-word-crossfade`: «From 0 to ___».
2. **70–190f · FunnelStack** — `funnel-stack`: 4 ступени появляются сверху-вниз, у каждой `number-wheel` отщёлкивает конверсию.
3. **190–310f · GrowthCurve** — `animated-line-chart` вверх-и-вправо по экспоненте, сопровождающий `number-wheel` гонит итоговую цифру.
4. **310–380f · Payoff** — кульминация: финальное число `slot-machine-roll` фиксируется, подпись `kinetic-center-build`.
5. **380–420f · CTA** — `cta-scene`.

**Анимации:**
- Hook: `per-word-crossfade` (каждое слово blur 8→0 + opacity, stagger 6f, предыдущее затухает); placeholder подчёркнут `marker-highlight`.
- FunnelStack: ступени — `short-slide-down` (y −30→0) со stagger 10f, ширина каждого яруса `interpolate` 0→target за 20f (визуализация сужения); числа ступеней — `number-wheel` 30f ease-out после посадки яруса; переток между этапами подсвечивает `data-flow-pipes`.
- GrowthCurve: `strokeDashoffset` прочерчивание 60f с `Easing.out(Easing.cubic)` (акселерация к концу = разгон); сопроводительный `number-wheel` синхронен прогрессу линии; финальная точка — `spring-scale-in` (`config:{ damping: 8 }`).
- Payoff: финальная сумма — `slot-machine-roll` (барабан 45f до фикса); подпись — `kinetic-center-build`; знак `×`/валюта — `micro-scale-fade`.
- CTA: `tracking-in` + кнопка `spring-scale-in`.

**Переходы:** Hook→Funnel — `shared-axis-y` вверх (springTiming 18f, «поднимаемся по воронке»). Funnel→Curve — `zoom-through-transition` (linearTiming 22f, влетаем в график). Curve→Payoff — `fade-through` (15f). Payoff→CTA — `fade-through` (15f).

**Config (сокращённо):**
```ts
{
  scenes: [
    { type: "title-scene", durationInFrames: 70, content: { mode: "hook", words: ["From", "0", "to", "scale"], reveal: "per-word-crossfade" } },
    { type: "funnel-stack", durationInFrames: 120, content: {
      steps: [
        { label: "Visit", value: 120000 },
        { label: "Signup", value: 18000 },
        { label: "Activate", value: 9400 },
        { label: "Pay", value: 2100 }
      ], showConversion: true },
      transition: { presentation: "shared-axis-y", timing: "springTiming", durationInFrames: 18 } },
    { type: "chart-panel", durationInFrames: 120, content: {
      chart: "line", title: "ARR", curve: "exponential",
      series: [{ label: "M1", value: 8 }, { label: "M6", value: 240 }], endValue: { value: 240000, prefix: "$", roll: "slot-machine-roll" } },
      transition: { presentation: "zoom-through-transition", timing: "linearTiming", durationInFrames: 22 } },
    { type: "cta-scene", durationInFrames: 40, content: { headline: "3.2× in 6 months", cta: "Start scaling" },
      transition: { presentation: "fade-through", timing: "springTiming", durationInFrames: 15 } }
  ]
}
```

**Reuse:** `number-wheel`, `slot-machine-roll`, `animated-line-chart`, `per-word-crossfade`, `kinetic-center-build`, `short-slide-down`, `marker-highlight`, `data-flow-pipes`, `inline-highlight`, `tracking-in`, `spring-scale-in`, `micro-scale-fade`, `cta-scene`, `title-scene`, `volumetric-rays`.

**New:**
- `funnel-stack` — типографическая воронка: вертикальный стек ярусов, ширина каждого пропорциональна значению, метка + конверсия между ступенями. Пропсы: `{ steps: Array<{ label: string; value: number }>; showConversion?: boolean }`. Числа через `number-wheel`, ширины — `interpolate` от 0; конверсия между ярусами (`value[i]/value[i-1]`) считается компонентом и выводится `inline-highlight`. Прозрачный фон, ярусы — заливка `theme.accent` с убывающей opacity.

---

### E5. Comparison / Before–After

**Повод:** «старый способ vs наш способ» — типографический сплит, контраст боли и облегчения, метрики бок о бок. **Длительность:** ~11 сек (330f). **Фон:** `solid theme.background`, тонкая вертикальная разделительная линия по центру (статичная, `theme.muted/20`); правая половина чуть ярче на `theme.accent`-тоне.

**Сценарий (beats):**
1. **0–60f · SetupTitle** — «Before / After» по центру, шов прорезает кадр по вертикали.
2. **60–150f · BeforeReveal** — левая колонка (старое): тусклые цифры, перечёркнутые пункты.
3. **150–240f · AfterReveal** — правая колонка (новое) влетает ярче, цифры выше.
4. **240–300f · DeltaCallout** — между колонками всплывают дельты («−87% time», «4× output»).
5. **300–330f · Verdict** — итоговая строка по центру, разделитель растворяется.

**Анимации:**
- SetupTitle: «Before» и «After» расходятся к своим сторонам — `interpolate` x от центра к ±240px за 20f, `tracking-in`; шов раскрывается из центра `interpolate` ширины за 24f.
- BeforeReveal: пункты — `strikethrough-replace` (текст появляется `staggered-fade-up`, затем линия зачёркивания прочерчивается слева-направо за 14f); цифры тусклые — `number-wheel`, opacity 0.5.
- AfterReveal: правая колонка — `line-by-line-slide` (каждая строка x 40→0 + opacity, stagger 7f); цифры яркие — `rolling-number`, accent-цвет, на финале `micro-scale-fade` пульс.
- DeltaCallout: бейджи дельт — `spring-scale-in` из центральной линии (`config:{ damping: 16 }`) со stagger 8f; знак дельты — `marker-highlight`.
- Verdict: `mask-reveal-up`; разделительная линия `interpolate` opacity 1→0 за 12f.

**Переходы:** Before↔After живут в одной сцене `comparison-split` (синхронная композиция, без межсценового перехода). Template-вход — `grid-pixelate-wipe` (linearTiming 18f), template-выход — `fade-through` (15f).

**Config (сокращённо):**
```ts
{
  scenes: [
    { type: "title-scene", durationInFrames: 60, content: { left: "Before", right: "After", split: true, reveal: "seam" } },
    { type: "comparison-split", durationInFrames: 240, content: {
      before: { heading: "Manual editing", rows: [
        { label: "Time per video", value: 6, unit: "h", strike: true },
        { label: "Output / week", value: 3, strike: true }
      ] },
      after: { heading: "With remocn", rows: [
        { label: "Time per video", value: 45, unit: "min" },
        { label: "Output / week", value: 12 }
      ] },
      deltas: [{ text: "−87% time" }, { text: "4× output" }] },
      transition: { presentation: "grid-pixelate-wipe", timing: "linearTiming", durationInFrames: 18 } },
    { type: "title-scene", durationInFrames: 30, content: { title: "Ship more, sweat less" },
      transition: { presentation: "fade-through", timing: "springTiming", durationInFrames: 15 } }
  ]
}
```

**Reuse:** `rolling-number`, `number-wheel`, `strikethrough-replace`, `staggered-fade-up`, `line-by-line-slide`, `tracking-in`, `marker-highlight`, `spring-scale-in`, `micro-scale-fade`, `mask-reveal-up`, `title-scene`, `grid-pixelate-wipe`.

**New:**
- `comparison-split` — двухколоночный сплит «до/после» с раздельными таймингами появления и слотом дельт по центру. Пропсы: `{ before: { heading: string; rows: Row[] }; after: { heading: string; rows: Row[] }; deltas?: Array<{ text: string }> }`, где `Row = { label: string; value: number; unit?: string; strike?: boolean }`. Левая колонка приглушена и поддерживает `strike` (через `strikethrough-replace`), правая — accent-акцент; дельты привязаны к парам строк и стартуют после `AfterReveal`. Прозрачный фон, разделитель — опция родителя.

---


---

## F. Onboarding & Education

> Family про обучение: пользователь должен «понять продукт за 20 секунд». Опора — типографика (что сказать) + новые лёгкие ui-frame примитивы (где показать). Уровень compositions удалён: «экран приложения» собирается из новых лёгких mock-примитивов, не из готовых сцен. Без mesh-gradient, glow и gradient-text. fps=30, 1920×1080.

---

### F1. App Walkthrough / Onboarding `[N]`

**Повод:** провести нового пользователя по N ключевым шагам продукта, где каждый шаг — реальный экран с курсором и подписью.
**Длительность:** ~3 сек intro + N×3.5 сек + 2.5 сек outro. Для `[N]`: `90 + N*105 + 75` кадров минус overlap переходов `(N+1)*12f`. При N=3 ≈ 444f ≈ 14.8 сек.
**Фон:** solid `theme.background` + `dynamic-grid` (низкий контраст, ~6% opacity) для глубины.

**Сценарий (beats):**
1. **0–90f · TitleScene** — название продукта (`focus-blur-resolve`) + строка «Get started in N steps» (`staggered-fade-up`).
2. **90–195f · Step 1 (UiFrame)** — экран в `app-window-frame`, `simulated-cursor` едет к кнопке, клик, `progress-steps` подсвечивает 1/N.
3. **195–300f · Step 2** — frame меняет контент через `fade-through`, курсор продолжает, progress 2/N.
4. **300–405f · Step N** — финальный экран, курсор фиксируется, progress заполнен.
5. **405–480f · CtaScene** — «You're all set» (`spring-scale-in`) + кнопка.

**Анимации:**
- *TitleScene*: заголовок `focus-blur-resolve` (blur 12→0px за 18f, `interpolate(...,{extrapolateRight:'clamp'})`); подзаголовок `staggered-fade-up` (stagger 4f, y 16→0). entrance.
- *StepScene*: `app-window-frame` entrance — `spring({frame,fps,config:{damping:18,mass:0.8}})` scale 0.94→1 + opacity. `simulated-cursor` — кубический безье к таргету за 30f, click-pulse (scale 1→0.88→1 за 6f). `progress-steps` активный сегмент `interpolateColors` muted→primary за 10f + width-grow. emphasis на клике.
- *CtaScene*: `spring-scale-in` (damping 12) на заголовке; кнопка `micro-scale-fade`; emphasis — `shimmer-sweep` один проход. exit предыдущего шага — `scale-down-fade` 8f.

**Переходы:** intro→step `spatial-push` (springTiming damping 200); step→step `fade-through` (linearTiming 12f); step→cta `shared-axis-y`.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "app-walkthrough", aspect: "16:9", fps: 30 },
  theme: { background: "#0B0B0F", primary: "#6E56CF", muted: "#9A9AA8", font: "Inter" },
  scenes: [
    { type: "title-scene", durationInFrames: 90,
      content: { title: "Acme", subtitle: "Get started in 3 steps" } },
    ...steps.map((s, i) => ({
      type: "walkthrough-step", durationInFrames: 105,
      transition: { type: "fade-through", timing: linearTiming(12) },
      content: { screen: s.screen, label: s.label, cursorTo: s.target, stepIndex: i, stepCount: steps.length }
    })),
    { type: "cta-scene", durationInFrames: 75,
      transition: { type: "shared-axis-y" },
      content: { title: "You're all set", button: "Open app" } },
  ],
};
```

**Reuse:** focus-blur-resolve, staggered-fade-up, spring-scale-in, micro-scale-fade, scale-down-fade, simulated-cursor, progress-steps, fade-through, spatial-push, shared-axis-y, shimmer-sweep, dynamic-grid.
**New:**
- **`app-window-frame`** — хром окна приложения/браузера: traffic-light dots, title/address-bar, скруглённый контейнер под скриншот или children. Что делает: даёт рамку «экрана» без реального UI-кита. Пропсы: `variant?: 'browser'|'os'|'mobile'`, `title?: string`, `url?: string`, `padding?: number`, `radius?: number`, `children`. Прозрачный фон вокруг, внутренняя поверхность = `theme.surface`; сам статичен, анимируется внешним Sequence.
- **`screen-mock`** — лёгкий плейсхолдер контента приложения из примитивных блоков (rows/cards/sidebar) без реального кита. Что делает: имитирует «наполнение экрана» div-блоками по `theme`. Пропсы: `layout: 'list'|'grid'|'split'|'editor'`, `accent?: string`, `density?: 'compact'|'cozy'`, `highlightRegion?: { x; y; w; h }` (зона под таргет курсора). Поддерживает per-block `staggered-fade-up` на входе.

---

### F2. Tutorial / How-To `[N]`

**Повод:** пошаговая инструкция «как сделать X»: на каждый шаг — крупный step-title, затем демонстрация действия.
**Длительность:** ~2.5 сек hook + N×4 сек + 2 сек recap. Для `[N]`: `75 + N*120 + 60` минус `N*15f` overlap. N=4 ≈ 555f ≈ 18.5 сек.
**Фон:** solid `theme.background`, слева вертикальная рейка `progress-steps` как навигатор.

**Сценарий (beats):**
1. **0–75f · TitleScene** — «How to <verb> <noun>» (`per-word-crossfade`).
2. **75–195f · Step 1** — большой номер «01» (`bottom-up-letters`) + step-title (`tracking-in`) → демонстрация в `instruction-pane`.
3. **195–315f · Step 2** — номер «02», действие, `simulated-cursor` или `drag-and-drop-flow`.
4. **315–435f · Step N** — финальный шаг, результат.
5. **435–555f · RecapScene** — `line-by-line-slide` список всех шагов сжато.

**Анимации:**
- *StepScene*: номер `step-numeral` через `bottom-up-letters` (каждая цифра stagger 5f, y 100%→0 mask); step-title `tracking-in` (letter-spacing 0.4em→0, 16f). Демо-зона `instruction-pane` въезжает `short-slide-right` (x 40→0, spring damping 20). emphasis — `marker-highlight` подчёркивает ключевое слово (sweep 12f). entrance левой колонки, правая с задержкой 8f.
- *RecapScene*: `line-by-line-slide` (stagger 6f, x −24→0 + opacity), активный буллет `inline-highlight`.

**Переходы:** step→step `directional-wipe` (вверх, linearTiming 15f) синхронно со сменой номера; step→recap `shared-axis-z`.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "tutorial-howto", aspect: "16:9", fps: 30 },
  theme: { background: "#101014", primary: "#34D399", muted: "#71717A", font: "Geist" },
  scenes: [
    { type: "title-scene", durationInFrames: 75, content: { title: "How to deploy in minutes" } },
    ...steps.map((s, i) => ({
      type: "tutorial-step", durationInFrames: 120,
      transition: { type: "directional-wipe", direction: "up", timing: linearTiming(15) },
      content: { index: i + 1, title: s.title, demo: s.demo }
    })),
    { type: "recap-scene", durationInFrames: 120,
      transition: { type: "shared-axis-z" },
      content: { steps: steps.map(s => s.title) } },
  ],
};
```

**Reuse:** per-word-crossfade, bottom-up-letters, tracking-in, short-slide-right, line-by-line-slide, marker-highlight, inline-highlight, simulated-cursor, drag-and-drop-flow, progress-steps, directional-wipe, shared-axis-z.
**New:**
- **`instruction-pane`** — двухзонный блок «номер + заголовок слева / демонстрация справа» с управляемым reveal. Что делает: задаёт grid и тайминг входа двух зон (правая с задержкой относительно левой). Пропсы: `index: number`, `title: string`, `split?: number` (доля левой колонки 0–1), `demoSlot: ReactNode`, `align?: 'top'|'center'`, `revealDelay?: number`. Прозрачен.
- **`step-numeral`** — крупная редакторская цифра-маркер шага с mask-reveal. Что делает: рендерит tabular-цифру шага и анимирует её появление. Пропсы: `value: number`, `pad?: number` (zero-pad), `style?: 'outline'|'solid'`, `revealFrames?: number`. Чистая типографика, без декора.

---

### F3. Empty → Populated

**Повод:** показать ценность «было пусто — стало полно данных»: типографический stat-grid оживает (без dashboard-сцены).
**Длительность:** ~13 сек (390f). Фиксированная.
**Фон:** solid `theme.background` + `spotlight-card` подсветка центральной сетки.

**Сценарий (beats):**
1. **0–60f · EmptyState** — сетка ячеек пуста, подпись «No data yet» (`soft-blur-in`, приглушённая).
2. **60–150f · FirstFill** — первая ячейка наполняется: метка (`short-slide-down`) + `rolling-number` стартует.
3. **150–300f · CascadeFill** — остальные ячейки наполняются волной (stagger), числа крутятся, в одной ячейке `animated-bar-chart`.
4. **300–390f · Headline** — поверх заполненной сетки итог «3,200 active users» (`kinetic-center-build`).

**Анимации:**
- *EmptyState*: каркас `empty-state-grid` рисует пунктирные ячейки (opacity 0→0.25, `soft-blur-in` 14f); подпись muted.
- *FirstFill*: ячейка пунктир→solid — crossfade двух border-слоёв 10f; метка `short-slide-down` (y −20→0); `rolling-number` 0→target за 45f ease-out.
- *CascadeFill*: ячейки по `staggered-fade-up` (stagger 8f, диагональный порядок); `animated-bar-chart` бары растут `spring({config:{damping:16}})`; числа `rolling-number`/`number-wheel` вразнобой.
- *Headline*: `kinetic-center-build` (слова к центру, scale 1.06→1, blur 6→0); emphasis — `micro-scale-fade` пульс на главном числе.

**Переходы:** внутрисценовые, без presentation-wipe (единое пространство сетки); EmptyState→FirstFill — `fade-through` 10f только на подписи.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "empty-to-populated", aspect: "16:9", fps: 30 },
  theme: { background: "#0A0A0A", primary: "#F59E0B", muted: "#52525B", font: "Inter" },
  scenes: [
    { type: "stat-grid-fill", durationInFrames: 300,
      content: {
        columns: 3, rows: 2,
        cells: [
          { label: "Active users", value: 3200, render: "rolling-number" },
          { label: "Revenue", value: 18400, prefix: "$", render: "number-wheel" },
          { label: "Growth", value: 32, suffix: "%", render: "bar-chart" },
        ],
        fillOrder: "diagonal", stagger: 8,
      } },
    { type: "headline-scene", durationInFrames: 90,
      content: { text: "3,200 active users", build: "kinetic-center-build" } },
  ],
};
```

**Reuse:** soft-blur-in, short-slide-down, kinetic-center-build, micro-scale-fade, staggered-fade-up, rolling-number, number-wheel, animated-bar-chart, spotlight-card, fade-through.
**New:**
- **`stat-grid`** — типографическая сетка KPI-ячеек (label + value), управляемая порядком и таймингом наполнения. Что делает: раскладывает ячейки и оркестрирует их «заполнение». Пропсы: `columns`, `rows`, `cells: { label; value; prefix?; suffix?; render: 'rolling-number'|'number-wheel'|'bar-chart' }[]`, `fillOrder?: 'row'|'col'|'diagonal'|'random'`, `stagger?: number`, `emptyLabel?: string`. Чистые ячейки на `theme.surface`, без иконок и glow.
- **`empty-state-grid`** — пунктирный «скелет» сетки до наполнения, морфится в solid по сигналу. Что делает: рисует структуру/border-морфинг под `stat-grid`. Пропсы: `columns`, `rows`, `filledAt: number[]`, `dashColor?`, `solidColor?`.

---

### F4. Tooltip Tour

**Повод:** обзорный тур по одному экрану: `simulated-cursor` останавливается у элементов, всплывают callout-подсказки.
**Длительность:** ~12 сек (360f). Фиксированная (3 остановки × ~3.5 сек + рамка).
**Фон:** solid `theme.background`, экран в `app-window-frame` (из F1) держит фокус всю сцену.

**Сценарий (beats):**
1. **0–60f · MountScreen** — `app-window-frame` + `screen-mock` появляются (`spring-scale-in`), курсор въезжает из-за края.
2. **60–160f · Stop 1** — курсор к элементу A, `callout-tooltip` раскрывается, `focus-mask` затемняет остальное.
3. **160–260f · Stop 2** — курсор к B, прошлый tooltip сворачивается, новый раскрывается.
4. **260–340f · Stop 3** — курсор к C, финальный callout.
5. **340–360f · Outro** — tooltips гаснут, подпись «Explore the rest» (`micro-scale-fade`).

**Анимации:**
- *MountScreen*: frame `spring-scale-in` (damping 14); `simulated-cursor` въезд по дуге 24f.
- *Stop*: курсор → таргет кубический безье 26f с decel; на прибытии `callout-tooltip` раскрывается `spring({config:{damping:15,mass:0.7}})` (scale 0.85→1 + opacity), хвостик-стрелка к таргету; текст внутри `staggered-fade-up` (stagger 3f). Фокус — `focus-mask`/`spotlight-card`, позиция `interpolate` 12f. exit прошлого — `scale-down-fade` 8f.
- *Outro*: подпись `micro-scale-fade`; tooltips `fade-through`.

**Переходы:** без presentation-переходов между остановками (единый экран); tooltip enter/exit — локальная анимация. Вход всей сцены извне — `zoom-through-transition` если в плейлисте.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "tooltip-tour", aspect: "16:9", fps: 30 },
  theme: { background: "#0D0D12", primary: "#3B82F6", muted: "#6B7280", font: "Inter" },
  scenes: [
    { type: "tooltip-tour", durationInFrames: 360,
      content: {
        screen: { layout: "split", accent: "#3B82F6" },
        stops: [
          { at: 70,  target: { x: 0.28, y: 0.34 }, side: "right", text: "Filter by status here" },
          { at: 170, target: { x: 0.62, y: 0.50 }, side: "top",   text: "Live preview updates instantly" },
          { at: 270, target: { x: 0.80, y: 0.72 }, side: "left",  text: "Export when you're ready" },
        ],
        dim: true, outro: "Explore the rest",
      } },
  ],
};
```

**Reuse:** spring-scale-in, staggered-fade-up, micro-scale-fade, scale-down-fade, simulated-cursor, spotlight-card, fade-through, zoom-through-transition, app-window-frame, screen-mock (из F1).
**New:**
- **`callout-tooltip`** — всплывающая подсказка с хвостиком к таргету, spring-раскрытие и text-reveal. Что делает: показывает подпись у точки экрана. Пропсы: `text: string`, `target: { x; y }` (доли экрана), `side?: 'top'|'right'|'bottom'|'left'|'auto'`, `index?: number`, `maxWidth?: number`, `arrow?: boolean`. Прозрачный контейнер, surface `theme.surface`; тонкая 1px рамка, без glow.
- **`focus-mask`** — динамическая маска-затемнение с «окном света» вокруг текущего таргета. Что делает: уводит внимание к зоне через CSS `mask`/overlay, позиция `interpolate`-ится между остановками. Пропсы: `target: { x; y }`, `radius?: number`, `dim?: number` (0–1 плотность), `softness?: number`. Функциональный фокус-аттеншн, не декоративный glow.

---


---

## G. Marketing & Events

> Family про конверсию: один экран = один оффер. Типографика крупная и редакторская, числа кинетические, CTA читается мгновенно. Без gradient-text, decorative uppercase, mesh-gradient.

---

### G1. Webinar / Event Promo

**Повод:** анонс вебинара/ивента: тема + дата/время + спикер → регистрация.
**Длительность:** ~11 сек (330f). Фиксированная.
**Фон:** `volumetric-rays` (мягкие, низкая интенсивность) над `theme.background`.

**Сценарий (beats):**
1. **0–80f · KickerTitle** — kicker «Live webinar» мелким (`tracking-in`) + тема крупно (`mask-reveal-up`).
2. **80–170f · DateTime** — дата/время + `event-meta-row` (дата · длительность · формат).
3. **170–270f · Speaker** — `speaker-card`: фото, имя (`per-character-rise`), роль/компания.
4. **270–330f · CtaScene** — «Save your seat» (`spring-scale-in`) + дата-напоминание.

**Анимации:**
- *KickerTitle*: kicker `tracking-in` (letter-spacing 0.3em→0.05em, 14f); тема `mask-reveal-up` (clip-path bottom→top 20f, две строки stagger 8f).
- *DateTime*: `event-meta-row` элементы `staggered-fade-up` (stagger 5f); разделители-точки `micro-scale-fade`.
- *Speaker*: `speaker-card` въезд `short-slide-right` (spring damping 18); имя `per-character-rise` (stagger 3f, y 60%→0 mask); фото `image-expand-to-fullscreen`-lite (scale 0.9→1 + reveal).
- *CtaScene*: `spring-scale-in` (damping 12); emphasis — `shimmer-sweep` по кнопке один раз.

**Переходы:** kicker→datetime `fade-through` 12f; datetime→speaker `spatial-push` (вверх); speaker→cta `shared-axis-y`.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "webinar-promo", aspect: "16:9", fps: 30 },
  theme: { background: "#0B0B10", primary: "#8B5CF6", muted: "#71717A", font: "Geist" },
  scenes: [
    { type: "title-scene", durationInFrames: 80,
      content: { kicker: "Live webinar", title: "Scaling Remotion in production" } },
    { type: "event-meta", durationInFrames: 90,
      transition: { type: "fade-through", timing: linearTiming(12) },
      content: { date: "Jul 14, 2026", time: "18:00 CET", meta: ["60 min", "Online"] } },
    { type: "speaker-card", durationInFrames: 100,
      transition: { type: "spatial-push", direction: "up" },
      content: { name: "Jane Doe", role: "Founder, Acme", avatar: "/jane.jpg" } },
    { type: "cta-scene", durationInFrames: 60,
      transition: { type: "shared-axis-y" },
      content: { title: "Save your seat", note: "Jul 14 · 18:00 CET" } },
  ],
};
```

**Reuse:** tracking-in, mask-reveal-up, short-slide-right, per-character-rise, spring-scale-in, staggered-fade-up, micro-scale-fade, speaker-card, shimmer-sweep, image-expand-to-fullscreen, volumetric-rays, fade-through, spatial-push, shared-axis-y.
**New:**
- **`event-meta-row`** — горизонтальный ряд мета-фактов события (дата · время · длительность · формат) с точечными разделителями и stagger-входом. Что делает: компонует факты в одну редакторскую строку. Пропсы: `items: { label: string; emphasis?: boolean }[]`, `separator?: 'dot'|'slash'|'pipe'`, `stagger?: number`, `align?: 'start'|'center'`. Tabular figures для времени, без иконок-картинок.

---

### G2. Sale / Discount Promo

**Повод:** распродажа: огромный «−50%», оффер, и тикающий countdown как триггер срочности.
**Длительность:** ~9 сек (270f). Фиксированная.
**Фон:** solid `theme.background` (контрастный, почти чёрный) + тонкий `dynamic-grid`.

**Сценарий (beats):**
1. **0–70f · DiscountHit** — гигантская «−50%» через `number-wheel` (50 докручивается с инерцией) + `spring-scale-in` на «%».
2. **70–150f · Offer** — «On all annual plans» (`per-word-crossfade`) + старая/новая цена (`price-shift`).
3. **150–240f · Countdown** — `countdown` HH:MM:SS тикает, подпись «Ends in» (`short-slide-down`).
4. **240–270f · CtaScene** — промокод «SAVE50» (`inline-highlight`) + кнопка.

**Анимации:**
- *DiscountHit*: «−50%» — `number-wheel` цифры докручиваются (damping high, ~40f), «%» `spring-scale-in` (damping 10, overshoot); блок `kinetic-center-build`.
- *Offer*: подзаголовок `per-word-crossfade` (stagger 6f); `price-shift` — старая `scale-down-fade` + line-through, новая `rolling-number` 0→price 30f.
- *Countdown*: `countdown` тик через `Math.floor(frame/fps)`, разряды `number-wheel`; «Ends in» `short-slide-down`; emphasis — последние секунды `micro-scale-fade` пульс.
- *CtaScene*: промокод `inline-highlight` (sweep маркера 10f); кнопка `spring-scale-in` + `shimmer-sweep`.

**Переходы:** discount→offer `zoom-through-transition` (зум сквозь %); offer→countdown `directional-wipe` вниз; countdown→cta `fade-through`.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "sale-promo", aspect: "16:9", fps: 30 },
  theme: { background: "#08080A", primary: "#EF4444", muted: "#6B7280", font: "Inter" },
  scenes: [
    { type: "discount-hit", durationInFrames: 70,
      content: { value: 50, unit: "%", sign: "minus", render: "number-wheel" } },
    { type: "offer-scene", durationInFrames: 80,
      transition: { type: "zoom-through-transition" },
      content: { text: "On all annual plans", oldPrice: 199, newPrice: 99, currency: "$" } },
    { type: "countdown-scene", durationInFrames: 90,
      transition: { type: "directional-wipe", direction: "down" },
      content: { label: "Ends in", target: "2026-07-01T00:00:00Z" } },
    { type: "cta-scene", durationInFrames: 30,
      transition: { type: "fade-through" },
      content: { code: "SAVE50", button: "Claim discount" } },
  ],
};
```

**Reuse:** number-wheel, rolling-number, spring-scale-in, kinetic-center-build, per-word-crossfade, scale-down-fade, short-slide-down, micro-scale-fade, inline-highlight, countdown, shimmer-sweep, dynamic-grid, zoom-through-transition, directional-wipe, fade-through.
**New:**
- **`price-shift`** — пара «старая → новая цена»: зачёркивание старой + reveal новой через rolling-number. Что делает: визуализирует переход цены. Пропсы: `oldPrice: number`, `newPrice: number`, `currency?: string`, `period?: string`, `strikeFrames?: number`. Старая `theme.muted` с анимируемым line-through (scaleX 0→1), новая `theme.primary` через rolling-number. Tabular figures, без glow.

---

### G3. Newsletter Digest `[N]`

**Повод:** дайджест выпуска рассылки: N highlight-карточек с заголовком и краткой выжимкой.
**Длительность:** ~3 сек cover + N×2.5 сек + 2 сек outro. Для `[N]`: `90 + N*75 + 60` минус `N*12f`. N=4 ≈ 402f ≈ 13.4 сек.
**Фон:** solid `theme.background` + `spotlight-card` на активной карточке.

**Сценарий (beats):**
1. **0–90f · Cover** — «Issue #42» (`bottom-up-letters`) + дата/тема выпуска (`soft-blur-in`).
2. **90–165f · Digest 1** — `digest-item`: номер, заголовок (`top-down-letters`), one-liner (`line-by-line-slide`).
3. **165–240f · Digest 2** — следующая карточка въезжает, прошлая уходит.
4. **240–N · Digest N** — последний хайлайт.
5. **outro · CtaScene** — «Read full issue» (`spring-scale-in`).

**Анимации:**
- *Cover*: «Issue #42» `bottom-up-letters` (stagger 4f, mask y); подзаголовок `soft-blur-in` (blur 10→0, 14f).
- *DigestItem*: карточка въезжает `short-slide-right` (spring damping 20); номер «01» `micro-scale-fade`; заголовок `top-down-letters` (stagger 3f, y −60%→0 mask); one-liner `line-by-line-slide`; emphasis-слово `marker-highlight`.
- *CtaScene*: `spring-scale-in` (damping 12) + `infinite-marquee` тонкой строкой темы внизу (опционально).

**Переходы:** cover→digest `shared-axis-y`; digest→digest `spatial-push` (вверх, springTiming) — лента прокрутки; digest→cta `fade-through`.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "newsletter-digest", aspect: "16:9", fps: 30 },
  theme: { background: "#0E0E11", primary: "#10B981", muted: "#737373", font: "Geist" },
  scenes: [
    { type: "digest-cover", durationInFrames: 90,
      content: { issue: 42, title: "What's new this week" } },
    ...items.map((it, i) => ({
      type: "digest-item", durationInFrames: 75,
      transition: { type: "spatial-push", direction: "up", timing: springTiming({ damping: 200 }) },
      content: { index: i + 1, title: it.title, summary: it.summary, highlight: it.highlight }
    })),
    { type: "cta-scene", durationInFrames: 60,
      transition: { type: "fade-through" },
      content: { title: "Read full issue", url: "acme.dev/issue-42" } },
  ],
};
```

**Reuse:** bottom-up-letters, top-down-letters, soft-blur-in, line-by-line-slide, short-slide-right, micro-scale-fade, marker-highlight, spring-scale-in, infinite-marquee, digest-item, spotlight-card, shared-axis-y, spatial-push, fade-through.
**New:**
- **`digest-cover`** — обложка выпуска: номер issue крупно + тема, редакторская верстка. Что делает: открывает дайджест титулом. Пропсы: `issue: number`, `title: string`, `date?: string`, `accent?: string`. Номер tabular, чистая типографика без декора. (Сам `digest-item` уже планируемый glue, обложка — новый компаньон.)

---

### G4. Hiring / We're Hiring `[N]`

**Повод:** мы нанимаем: показать N вакансий карточками → призыв откликнуться.
**Длительность:** ~3 сек hook + N×2.5 сек + 2.5 сек cta. Для `[N]`: `90 + N*75 + 75` минус `N*12f`. N=3 ≈ 354f ≈ 11.8 сек.
**Фон:** solid `theme.background` + `volumetric-rays` мягкие.

**Сценарий (beats):**
1. **0–90f · Hook** — «We're hiring» (`per-character-rise`) + «Join the team building X» (`staggered-fade-up`).
2. **90–165f · Role 1** — `role-card`: должность (`tracking-in`), локация/формат, теги (`role-tag-pills`).
3. **165–240f · Role 2** — следующая карточка.
4. **240–N · Role N** — последняя вакансия, либо `role-grid` при N>3 (все сразу).
5. **cta · CtaScene** — «Apply now» + ссылка (`spring-scale-in`).

**Анимации:**
- *Hook*: «We're hiring» `per-character-rise` (stagger 3f, mask); подзаголовок `staggered-fade-up` (stagger 4f).
- *RoleCard*: карточка `spring-scale-in` (damping 16); должность `tracking-in` (12f); `role-tag-pills` `staggered-fade-up` (stagger 4f) + `micro-scale-fade`; локация `short-slide-right`.
- *RoleGrid* (N>3): карточки `staggered-fade-up` диагонально (stagger 6f).
- *CtaScene*: `spring-scale-in` (damping 12); кнопка `shimmer-sweep`.

**Переходы:** hook→role `shared-axis-y`; role→role `directional-wipe` (вверх); role→cta `zoom-through-transition`.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "hiring-promo", aspect: "16:9", fps: 30 },
  theme: { background: "#0A0A0D", primary: "#F472B6", muted: "#71717A", font: "Inter" },
  scenes: [
    { type: "title-scene", durationInFrames: 90,
      content: { title: "We're hiring", subtitle: "Join the team building remocn" } },
    ...roles.map((r, i) => ({
      type: "role-card", durationInFrames: 75,
      transition: { type: "directional-wipe", direction: "up", timing: linearTiming(12) },
      content: { title: r.title, location: r.location, tags: r.tags, mode: r.mode }
    })),
    { type: "cta-scene", durationInFrames: 75,
      transition: { type: "zoom-through-transition" },
      content: { title: "Apply now", url: "acme.dev/careers" } },
  ],
};
```

**Reuse:** per-character-rise, staggered-fade-up, tracking-in, short-slide-right, spring-scale-in, micro-scale-fade, role-card, shimmer-sweep, volumetric-rays, shared-axis-y, directional-wipe, zoom-through-transition.
**New:**
- **`role-tag-pills`** — ряд тегов вакансии (stack, seniority, формат) как чистые pill-чипы со stagger-входом. Что делает: компонует короткие метки роли. Пропсы: `tags: string[]`, `variant?: 'outline'|'soft'`, `stagger?: number`, `wrap?: boolean`. Surface `theme.surface`/border `theme.muted`, без glow.
- **`role-grid`** — сетка `role-card` для режима «все вакансии сразу» (N>3). Что делает: раскладывает планируемые `role-card` в grid с волновым входом. Пропсы: `roles: Role[]`, `columns?: number`, `fillOrder?: 'row'|'diagonal'`, `stagger?: number`.

---

### G5. Podcast / Episode Promo `[9:16]`

**Повод:** анонс эпизода подкаста, вертикальный формат под Stories/Reels: обложка + название + play.
**Длительность:** ~8 сек (240f). Фиксированная. Холст **1080×1920**.
**Фон:** solid `theme.background` + `volumetric-rays` сверху-вниз (вертикальный поток), мягкие.

**Сценарий (beats):**
1. **0–60f · CoverIn** — обложка эпизода `image-expand-to-fullscreen` (scale 1.08→1, reveal), затем уезжает в верхнюю треть.
2. **60–130f · TitleBlock** — «Episode 12» kicker (`tracking-in`) + название (`mask-reveal-up`, 2 строки stagger).
3. **130–200f · GuestPlay** — гость/тема (`per-word-crossfade`) + `audio-play-button` с пульсирующей `waveform-bars`.
4. **200–240f · CtaScene** — «Listen now» + платформы (`staggered-fade-up`).

**Анимации:**
- *CoverIn*: `image-expand-to-fullscreen` затем перепозиция в верх (spring damping 20); тонкая 1px рамка обложки.
- *TitleBlock*: kicker `tracking-in` (0.3em→0.05em); название `mask-reveal-up` (clip bottom→top 20f, строки stagger 8f).
- *GuestPlay*: `audio-play-button` въезд `spring-scale-in` (damping 12); `waveform-bars` осциллируют через `Math.sin(frame*k + i)`, высота `interpolate`; тема `per-word-crossfade`.
- *CtaScene*: «Listen now» `spring-scale-in`; платформы `staggered-fade-up` (stagger 4f).

**Переходы:** cover→title `shared-axis-y`; title→guest `fade-through`; guest→cta `spatial-push` (вверх). Все timing под вертикаль — только up/down, без горизонтальных wipe.

**Config (сокращённо):**
```ts
const config: TemplateConfig = {
  meta: { id: "podcast-promo", aspect: "9:16", fps: 30, width: 1080, height: 1920 },
  theme: { background: "#0C0A12", primary: "#A855F7", muted: "#6B7280", font: "Geist" },
  scenes: [
    { type: "cover-scene", durationInFrames: 60,
      content: { cover: "/ep12.jpg" } },
    { type: "episode-title", durationInFrames: 70,
      transition: { type: "shared-axis-y" },
      content: { kicker: "Episode 12", title: "Building in public" } },
    { type: "guest-play", durationInFrames: 70,
      transition: { type: "fade-through" },
      content: { guest: "with Jane Doe", playing: true } },
    { type: "cta-scene", durationInFrames: 40,
      transition: { type: "spatial-push", direction: "up" },
      content: { title: "Listen now", platforms: ["Apple", "Spotify", "YouTube"] } },
  ],
};
```

**Reuse:** tracking-in, mask-reveal-up, per-word-crossfade, spring-scale-in, staggered-fade-up, image-expand-to-fullscreen, volumetric-rays, shared-axis-y, fade-through, spatial-push.
**New:**
- **`audio-play-button`** — крупная круглая play-кнопка для аудио-промо со spring-входом и опциональным «дыханием» в состоянии playing. Что делает: даёт акцентный play-элемент. Пропсы: `playing?: boolean`, `size?: number`, `pulse?: boolean`, `pulseRange?: [number, number]`. Чистый треугольник play, surface `theme.primary`, без glow; пульс — scale 1→1.04 синусом.
- **`waveform-bars`** — ряд осциллирующих аудио-баров, детерминированно от `frame` (seek-safe). Что делает: имитирует звуковую волну. Пропсы: `bars?: number`, `amplitude?: number`, `speed?: number`, `color?: string`, `seed?: number`. Высота = `interpolate(Math.sin(frame*speed + i*phase), [-1,1], [min,max])`; без неуправляемого рандома, чтобы рендер был детерминирован.

---

## H. Brand & Identity

Семья оверлеев. Все три рендерятся на **прозрачном фоне (alpha)** — фон не рисуем, шаблоны накладываются поверх чужого видео/футажа. `meta.transparent: true`, экспорт ProRes 4444 / WebM alpha. Никаких volumetric-rays / dynamic-grid здесь — только сам брендовый элемент и типографика.

---

### H1. Logo Reveal Pack
**Повод:** один логотип, три разных стинга на выбор — для интро ролика, рекламной вставки, конца кейса.
**Длительность:** каждый пресет ~2 сек (60 кадров). Выбор пресета — проп, не три сцены подряд.
**Фон:** alpha (прозрачный, накладывается на любой кадр).

**Сценарий (beats) — по пресетам:**
1. **preset `draw` (0–60f)** — контур логотипа прочерчивается обводкой, затем заливается; wordmark `tracking-in`.
2. **preset `assemble` (0–60f)** — части лого слетаются из 4 сторон и собираются `spring`; wordmark `per-character-rise`.
3. **preset `impact` (0–60f)** — лого появляется резким `spring-scale-in` с лёгким overshoot + shockwave-кольцо; wordmark `soft-blur-in`.

**Анимации:**
- `draw`: SVG-path `strokeDashoffset` len→0 за 36f, fill opacity 0→1 на 30–42f; wordmark `tracking-in` letter-spacing 0.3em→0.
- `assemble`: 4 фрагмента `interpolate` по translateX/Y из ±120 + rotate ±8°→0, `spring({damping:16})`; финальный snap на 38f.
- `impact`: `spring-scale-in` scale 0→1.08→1 (damping 8), shockwave-ring scale 0.2→1.6 + opacity 0.6→0 за 20f; hold логотипа 18f до конца.
- Все три заканчиваются 12f статичного hold (для удобной нарезки монтажёром).

**Переходы:** нет внутренних; стинг сам по себе — атомарный оверлей.

**Config (сокращённо):**
```ts
const logoPack = {
  meta: { id: 'logo-reveal-pack', format: '16:9', fps: 30, transparent: true },
  theme: { text: '#FFFFFF', accent: '#7C5CFF' },
  scenes: [{
    type: 'logo-sting-preset',
    durationInFrames: 60,
    content: { preset: 'assemble', logoSrc: '/brand/mark.svg', wordmark: 'Loop', hold: 12 },
  }],
} as const
```

**Reuse:** `logo-enter`, `tracking-in`, `per-character-rise`, `soft-blur-in`, `spring-scale-in`.

**New:**
- `logo-sting-preset` — обёртка-стинг с тремя именованными пресетами (`draw` | `assemble` | `impact`), каждый со своей хореографией появления лого + wordmark, на прозрачном фоне. **Пропсы:** `preset: 'draw' | 'assemble' | 'impact'`, `logoSrc: string`, `wordmark?: string`, `accent: string`, `hold: number` (f статичного финала, дефолт 12), `mark?: 'svg-path' | 'image'` (для `draw` нужен path). Тип `preset` строго инферится — пользователь не пишет касты; внутренняя map пресет→хореография.

---

### H2. Lower-Third
**Повод:** нижняя плашка с именем/титулом спикера — наложение на talking-head или интервью.
**Длительность:** управляется in/out, типично 4 сек видимости. Параметризуется `inFrame`/`outFrame`.
**Фон:** alpha (только плашка, прозрачный фон).

**Сценарий (beats):**
1. **inFrame → +18f · In** — плашка раскрывается полосой слева направо `bar-wipe`, акцент-тик ставится первым.
2. **+18f → +30f · Text settle** — имя `short-slide-right`, титул `staggered-fade-up` под ним.
3. **hold · Visible** — статичный hold всё время между in и out.
4. **outFrame−15f → outFrame · Out** — текст уходит `blur-out-up`, полоса схлопывается обратно влево.

**Анимации:**
- In: `lower-third-bar` фон `mask-reveal-up` по X (clip-path inset слева направо) за 16f; акцент-тик (вертикальная черта слева) `spring` высота 0→full за 10f.
- Text: имя `short-slide-right` translateX −16→0 + opacity; титул `staggered-fade-up` stagger 6f с задержкой 6f после имени.
- Out: текст `blur-out-up`, фон обратный `mask` (схлоп вправо→влево) за 15f.
- Без uppercase/letter-spacing — имя обычным кейсом, титул чуть приглушённым цветом.

**Переходы:** нет; вход/выход управляется только `inFrame`/`outFrame` относительно таймлайна-носителя.

**Config (сокращённо):**
```ts
const lowerThird = {
  meta: { id: 'lower-third', format: '16:9', fps: 30, transparent: true },
  theme: { text: '#FFFFFF', subtext: '#A1A1AA', accent: '#34C759' },
  scenes: [{
    type: 'lower-third-bar',
    durationInFrames: 120,            // окно присутствия на носителе
    content: { name: 'Mara Koval', title: 'Founder & CEO, Loop', side: 'left' },
  }],
} as const
```

**Reuse:** `short-slide-right`, `staggered-fade-up`, `blur-out-up`, `mask-reveal-up`, `lower-third` (glue-разметка).

**New:**
- `lower-third-bar` — нижняя плашка с именем/титулом: полоса-фон с bar-wipe in/out, акцент-тик слева/справа, два текстовых ряда. **Пропсы:** `name: string`, `title: string`, `side: 'left' | 'right'`, `inFrame: number`, `outFrame: number`, `barColor: string`, `accent: string`, `barReveal: number` (f на wipe, дефолт 16). Внутри: `clip-path inset` для wipe, тик — отдельный `spring`, тексты композят `short-slide-right`/`staggered-fade-up`; out зеркалит in.

---

### H3. Intro/Outro Bumper
**Повод:** единая заставка и концовка для серии видео (YouTube-серия, курс, продуктовые апдейты).
**Длительность:** intro ~2.5 сек (75 кадров), outro ~2.5 сек (75 кадров). Режим — проп `mode`.
**Фон:** alpha (брендовая рамка/wordmark поверх любого кадра или поверх чёрного у носителя).

**Сценарий (beats):**
1. **intro 0–20f · BracketsIn** — угловые скобки-рамка прочерчиваются по 4 углам `bracket-draw`.
2. **intro 20–55f · Wordmark** — центральный wordmark `kinetic-center-build` собирается из центра, tagline под ним `soft-blur-in`.
3. **intro 55–75f · Hold/handoff** — короткий hold, скобки чуть сжимаются — намёк на «переход к контенту».
4. **outro (mode='outro') 0–75f** — зеркально: wordmark `mask-reveal-up`, CTA-строка «Subscribe / Next episode» `short-slide-down`, скобки рисуются и держатся.

**Анимации:**
- BracketsIn: каждая угловая скобка = две линии, `strokeDashoffset` за 16f, stagger 4f по углам (по часовой).
- Wordmark intro: `kinetic-center-build` — буквы расходятся из центральной точки + `spring({damping:15})`; tagline `soft-blur-in` blur 8→0 за 18f.
- Outro: wordmark `mask-reveal-up` снизу вверх, CTA `short-slide-down`, скобки держатся весь outro (рамка как подпись бренда).
- Handoff (intro конец): скобки `interpolate` inset +12px внутрь за 12f — кадр «сжимается», передавая управление контенту.

**Переходы:** intro можно сцепить с контентом через `image-expand-to-fullscreen` извне; внутри bumper — без presentation.

**Config (сокращённо):**
```ts
const bumper = {
  meta: { id: 'intro-outro-bumper', format: '16:9', fps: 30, transparent: true },
  theme: { text: '#FFFFFF', accent: '#FF5C00' },
  scenes: [{
    type: 'bumper-frame',
    durationInFrames: 75,
    content: { mode: 'intro', wordmark: 'Loop Weekly', tagline: 'Product, every Friday', brackets: true },
  }],
} as const
```

**Reuse:** `kinetic-center-build`, `soft-blur-in`, `mask-reveal-up`, `short-slide-down`, `logo-sting` (как опциональный центр).

**New:**
- `bumper-frame` — заставка/концовка серии: угловые скобки-рамка (draw) + центральный wordmark + tagline/CTA, режим `intro` или `outro` зеркалит хореографию. **Пропсы:** `mode: 'intro' | 'outro'`, `wordmark: string`, `tagline?: string` (intro) / `cta?: string` (outro), `brackets: boolean` (рисовать рамку, дефолт true), `bracketColor: string`, `accent: string`. Тип `mode` строго инферится; внутри — `bracket-draw` через `strokeDashoffset`, центр композит `kinetic-center-build` / `mask-reveal-up` по режиму, handoff-сжатие только в `intro`.

---

## I. Sales & Conversion

### I1. Pricing Reveal

**Повод:** показать тарифы и мягко подтолкнуть к рекомендуемому → CTA. **Длительность:** ~12 сек (360f). **Фон:** `spotlight-card` — мягкий направленный свет, к кульминации наводится на рекомендуемую колонку (мотивированный свет, не glow).

**Сценарий (beats):**
1. **0–55f · Lead** — заголовок «Simple pricing» + подзаголовок.
2. **55–150f · ColumnsEnter** — три `pricing-column` въезжают снизу со stagger.
3. **150–250f · RecommendFocus** — центральная (рекомендуемая) поднимается и подсвечивается, фичи дочёркиваются.
4. **250–320f · PriceLand** — цена рекомендуемой колонки досчитывается крупно.
5. **320–360f · CTA** — `cta-scene` «Start free trial».

**Анимации:**
- Lead: заголовок — `soft-blur-in` (blur 14→0 за 20f); подзаголовок — `staggered-fade-up`.
- ColumnsEnter: 3 колонки — `staggered-fade-up` (y 50→0) слева-направо stagger 8f, `spring` посадка (`config:{ damping: 18 }`).
- RecommendFocus: центральная колонка `interpolate` y 0→−24 + `micro-scale-fade` (scale 1→1.05); боковые `interpolate` opacity 1→0.55; список фич — `progress-steps` (галочки прорисовываются по очереди, stagger 6f); бейдж «Popular» — `spring-scale-in`.
- PriceLand: цена — `rolling-number` с префиксом `$`, 40f ease-out; «/mo» — `inline-highlight`.
- CTA: кнопка `spring-scale-in` (`config:{ damping: 8 }`) + единичный `shimmer-sweep` по плашке (sweep, не glow); лейбл `tracking-in`.

**Переходы:** Lead→Columns — `shared-axis-y` (linearTiming 16f). Columns/Focus/Price — одна сцена `pricing-grid`. →CTA — `spatial-push` вверх (linearTiming 20f).

**Config (сокращённо):**
```ts
{
  scenes: [
    { type: "title-scene", durationInFrames: 55, content: { title: "Simple pricing", kicker: "No surprises" } },
    { type: "pricing-grid", durationInFrames: 265, content: {
      columns: [
        { name: "Hobby", price: 0, period: "mo", features: ["3 projects", "720p export"] },
        { name: "Pro", price: 19, period: "mo", features: ["Unlimited", "4K export", "Priority render"], recommended: true },
        { name: "Team", price: 49, period: "mo", features: ["Everything in Pro", "5 seats", "SSO"] }
      ] },
      transition: { presentation: "shared-axis-y", timing: "linearTiming", durationInFrames: 16 } },
    { type: "cta-scene", durationInFrames: 40, content: { headline: "Start with Pro", cta: "Start free trial" },
      transition: { presentation: "spatial-push", timing: "linearTiming", durationInFrames: 20 } }
  ]
}
```

**Reuse:** `rolling-number`, `progress-steps`, `shimmer-sweep`, `soft-blur-in`, `staggered-fade-up`, `inline-highlight`, `micro-scale-fade`, `spring-scale-in`, `tracking-in`, `cta-scene`, `title-scene`, `spotlight-card`.

**New:**
- `pricing-column` — атомарная колонка тарифа: название, цена (через `rolling-number`), период, список фич, флаг `recommended`. Пропсы: `{ name: string; price: number; period?: string; features: string[]; recommended?: boolean }`. `recommended` поднимает колонку и включает accent-бордюр; фичи рендерятся как `progress-steps`-список. Прозрачный фон.
- `pricing-grid` — оркестратор: раскладывает `pricing-column[]`, проигрывает фазы enter → focus(recommended) → price-land, синхронизирует spotlight. Пропсы: `{ columns: PricingColumn[] }`.

---

### I2. Plan Comparison

**Повод:** детальное сравнение планов по фичам — таблица, где видно «что входит куда», с подсветкой рекомендованного столбца. **Длительность:** ~13 сек (390f). **Фон:** `solid theme.background` с горизонтальными разделителями строк (`theme.muted/15`); столбец recommended на едва тёплом accent-тоне.

**Сценарий (beats):**
1. **0–55f · TableTitle** — «Compare plans».
2. **55–130f · HeaderRow** — шапка с названиями планов въезжает.
3. **130–270f · RowsCascade** — строки фич появляются каскадом, ячейки заполняются (✓/✗/значение).
4. **270–340f · ColumnHighlight** — рекомендованный столбец подсвечивается целиком, остальные тускнеют.
5. **340–390f · CTA** — строка под таблицей.

**Анимации:**
- TableTitle: `top-down-letters`.
- HeaderRow: ячейки шапки — `staggered-fade-up` (stagger 6f слева-направо); рекомендованный заголовок — `marker-highlight` бейдж.
- RowsCascade: строки — `line-by-line-slide` (x −30→0, opacity, stagger 9f сверху-вниз); внутри строки ячейки `micro-scale-fade` stagger 3f; галочки ✓ — `spring-scale-in` (`config:{ damping: 14 }`), крестики ✗ — `soft-blur-in` приглушённо.
- ColumnHighlight: фон рекомендованного столбца — `interpolateColors` от background к accent-тону за 16f (opacity 0→0.12); соседние столбцы `interpolate` opacity 1→0.5; верх столбца — единичный `shimmer-sweep`.
- CTA: `tracking-in` + `spring-scale-in` кнопка.

**Переходы:** Title→Header — `fade-through` (14f). Header/Rows/Highlight — одна сцена `plan-table`. →CTA — `shared-axis-y` (16f).

**Config (сокращённо):**
```ts
{
  scenes: [
    { type: "title-scene", durationInFrames: 55, content: { title: "Compare plans" } },
    { type: "plan-table", durationInFrames: 285, content: {
      plans: ["Free", "Pro", "Enterprise"],
      recommended: "Pro",
      rows: [
        { feature: "Seats", cells: ["1", "1", "5"] },
        { feature: "Storage", cells: ["10 GB", "1 TB", "Unlimited"] },
        { feature: "Priority render", cells: [false, true, true] },
        { feature: "SSO", cells: [false, false, true] }
      ] },
      transition: { presentation: "fade-through", timing: "springTiming", durationInFrames: 14 } },
    { type: "cta-scene", durationInFrames: 50, content: { headline: "Choose Pro" },
      transition: { presentation: "shared-axis-y", timing: "linearTiming", durationInFrames: 16 } }
  ]
}
```

**Reuse:** `top-down-letters`, `staggered-fade-up`, `line-by-line-slide`, `micro-scale-fade`, `spring-scale-in`, `soft-blur-in`, `marker-highlight`, `shimmer-sweep`, `tracking-in`, `cta-scene`, `title-scene`.

**New:**
- `plan-table` — сравнительная таблица планов: шапка с планами, строки фич, ячейки трёх типов (boolean → ✓/✗, строка-значение), подсветка `recommended` столбца. Пропсы: `{ plans: string[]; recommended?: string; rows: Array<{ feature: string; cells: Array<boolean | string> }> }`. Сам управляет каскадным таймингом строк и фазой `ColumnHighlight`; boolean-ячейки рендерит `spring-scale-in`-галочкой. Прозрачный фон.

---

### I3. Case Study

**Повод:** мини-кейс клиента — проблема → решение → результаты, с убедительными метриками на финале. **Длительность:** ~16 сек (480f). **Фон:** меняется по акту — Problem на `solid` (тяжесть), Solution на `dynamic-grid` (структура/порядок), Results на `volumetric-rays` (подъём, opacity 0.08→0.16 за 30f). Смена фона = смена эмоции.

**Сценарий (beats):**
1. **0–80f · Client** — имя клиента + одна вводная строка.
2. **80–200f · Problem** — формулировка боли, болевые слова `marker-highlight` (сдержанный тон).
3. **200–320f · Solution** — что внедрили, шаги `progress-steps`.
4. **320–430f · Results** — `stat-recap` из 3 метрик улучшения.
5. **430–480f · Quote** — `quote-card` с финальным отзывом.

**Анимации:**
- Client: имя — `tracking-in`; вводная строка — `soft-blur-in`.
- Problem: текст — `line-by-line-slide` (stagger 8f); болевые слова — `marker-highlight` (muted-заливка, не яркая); главная фраза — `focus-blur-resolve` (весь блок blur 6→0, главная строка резче).
- Solution: заголовок — `mask-reveal-up`; шаги — `progress-steps` (нумерованные, прорисовка по очереди stagger 10f); каждый шаг подъезжает `staggered-fade-up`.
- Results: три метрики — `stat-recap` с `rolling-number`, влетают `spring-scale-in` (stagger 8f, `config:{ damping: 8 }`); дельта-стрелки `micro-scale-fade`.
- Quote: `quote-card` — кавычки `spring-scale-in`, текст `per-word-crossfade`, автор/лого `tracking-in`.

**Переходы:** Client→Problem — `fade-through` (15f). Problem→Solution — `directional-wipe` слева-направо (linearTiming 18f). Solution→Results — `shared-axis-z` push-in (springTiming 20f, «приближаемся к итогу»). Results→Quote — `frosted-glass-wipe` (16f).

**Config (сокращённо):**
```ts
{
  scenes: [
    { type: "title-scene", durationInFrames: 80, content: { client: "Northwind", intro: "A 12-person studio drowning in edits" } },
    { type: "problem-statement", durationInFrames: 120, content: { body: "Every demo video took 2 days and broke their roadmap.", highlight: ["2 days", "broke"], emphasis: "broke their roadmap" },
      transition: { presentation: "fade-through", timing: "springTiming", durationInFrames: 15 } },
    { type: "progress-steps", durationInFrames: 120, content: { title: "What we did", steps: ["Adopted remocn templates", "Wired render-sdk", "Automated exports"] },
      transition: { presentation: "directional-wipe", timing: "linearTiming", durationInFrames: 18 } },
    { type: "stat-recap", durationInFrames: 110, content: { stats: [
      { value: 92, suffix: "%", label: "faster" }, { value: 4, suffix: "×", label: "more videos" }, { value: 0, label: "missed deadlines" }
    ] }, transition: { presentation: "shared-axis-z", timing: "springTiming", durationInFrames: 20 } },
    { type: "quote-card", durationInFrames: 50, content: { quote: "We ship demos the same day now.", author: "Head of Growth, Northwind", logo: true },
      transition: { presentation: "frosted-glass-wipe", timing: "linearTiming", durationInFrames: 16 } }
  ]
}
```

**Reuse:** `rolling-number`, `progress-steps`, `stat-recap`, `quote-card`, `marker-highlight`, `focus-blur-resolve`, `line-by-line-slide`, `mask-reveal-up`, `staggered-fade-up`, `per-word-crossfade`, `tracking-in`, `soft-blur-in`, `spring-scale-in`, `micro-scale-fade`, `title-scene`, `dynamic-grid`, `volumetric-rays`, `directional-wipe`.

**New:**
- `problem-statement` — сцена-формулировка боли: многострочный текст с приглушённой `marker-highlight`-подсветкой болевых слов и `focus-blur-resolve` на главной фразе. Пропсы: `{ body: string; highlight?: string[]; emphasis?: string }`. Тон сдержанный (muted-заливка вместо accent), чтобы контрастировать с ярким актом Results. Прозрачный фон.

---

### I4. ROI / Savings Result

**Повод:** одна убойная цифра экономии — «save $X», максимально сфокусированно и убедительно. **Длительность:** ~9 сек (270f). **Фон:** `dynamic-grid`; на кульминации (SaveLand) сетка кратко пульсирует (cell opacity +0.08 за 8f, спад 12f) — единственный момент активности фона.

**Сценарий (beats):**
1. **0–60f · Premise** — контекст-условие: `typewriter` набирает «If you run 50 deploys/mo…».
2. **60–140f · Breakdown** — короткий расчёт-строки (часы × ставка), `staggered-fade-up`.
3. **140–210f · SaveLand** — гигантское `$X` через `slot-machine-roll`, центр кадра.
4. **210–245f · Period** — «per year» уточнение под цифрой.
5. **245–270f · CTA** — `cta-scene`.

**Анимации:**
- Premise: `typewriter` ~26f на строку, моноширинный, мигающий курсор; exit `blur-out-up`. (Альтернатива — `per-word-crossfade`, последнее слово обрывается `micro-scale-fade`.)
- Breakdown: 2–3 строки расчёта — `staggered-fade-up` (stagger 7f); промежуточные числа — мелкий `rolling-number`; знак `=` — `spring-scale-in`.
- SaveLand: основная цифра — `slot-machine-roll` (барабан 48f, сильный ease-out); префикс `$` появляется первым `spring-scale-in`; на финале роллинга — `kinetic-center-build` микропульс всей суммы (`micro-scale-fade` scale 1→1.05→1) + grid-пульс фона.
- Period: `soft-blur-in` под цифрой.
- CTA: `tracking-in` + кнопка `spring-scale-in` с единичным `shimmer-sweep` (sweep по металлу, не glow).

**Переходы:** Premise→Breakdown — `fade-through` (14f). Breakdown→SaveLand — `zoom-through-transition` (linearTiming 20f, «вброс» к цифре, резкий фокус). SaveLand+Period — одна сцена `savings-result`. →CTA — `shared-axis-y` (16f).

**Config (сокращённо):**
```ts
{
  scenes: [
    { type: "title-scene", durationInFrames: 60, content: { mode: "premise", typewriter: "If you run 50 deploys/mo…" } },
    { type: "savings-result", durationInFrames: 150, content: {
      breakdown: [
        { label: "Hours saved / mo", value: 60 },
        { label: "Blended rate", value: 75, prefix: "$" }
      ],
      result: { value: 54000, prefix: "$", period: "per year", roll: "slot-machine-roll" } },
      transition: { presentation: "fade-through", timing: "springTiming", durationInFrames: 14 } },
    { type: "cta-scene", durationInFrames: 25, content: { headline: "See your savings", cta: "Calculate yours" },
      transition: { presentation: "zoom-through-transition", timing: "linearTiming", durationInFrames: 20 } }
  ]
}
```

**Reuse:** `slot-machine-roll`, `number-wheel`, `rolling-number`, `typewriter`, `per-word-crossfade`, `kinetic-center-build`, `staggered-fade-up`, `soft-blur-in`, `tracking-in`, `spring-scale-in`, `micro-scale-fade`, `shimmer-sweep`, `blur-out-up`, `cta-scene`, `title-scene`, `dynamic-grid`.

**New:**
- `savings-result` — сцена «итоговая экономия»: опциональный мини-расчёт (breakdown-строки), затем доминирующая цифра результата с периодом. Пропсы: `{ breakdown?: Array<{ label: string; value: number; prefix?: string; suffix?: string }>; result: { value: number; prefix?: string; suffix?: string; period?: string; roll?: "number-wheel" | "slot-machine-roll" } }`. Управляет таймингом «расчёт → вброс цифры → период», синхронизирует grid-пульс фона с финалом роллинга. Прозрачный фон.
