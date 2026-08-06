# Step-by-Step Prompts (English)

Copy-paste prompts, one session at a time. Nothing else — for planning and rationale
see `PROJE_PLANI_FINAL.md`, for the workflow guide see `CLAUDE_CODE_PLAYBOOK.md`.

**Before every session**
1. Unrelated to the previous task? → `/clear`
2. Right model selected? → `/model`
3. Reference the target file with `@`
4. Big task? → ask for a plan first

**After every session**
1. `npx tsc --noEmit` clean?
2. App still runs?
3. Committed?

> `CLAUDE.md` still applies even though you prompt in English: code identifiers in
> English, **code comments in Turkish**, and all user-facing strings in Turkish.
> Turkish text inside the prompts below is literal UI copy — keep it as-is.

---

# PHASE 0 — Setup & Schema

Sessions 0.1 (scaffold) and 0.2 (dependencies) are **done**.

## 0.3 — Design system

```
Create the design system under /constants:
- colors.ts: primary, secondary, success, error, neutral + light/dark theme
- typography.ts: heading/body/label font sizes and weights
- spacing.ts: spacing scale in multiples of 4
- radius.ts: corner radius values
- strings.ts: all user-facing UI text as a plain TypeScript object (no i18n library)

App tone: warm, welcoming, suitable for all ages including children.
First propose 2-3 color palette options and let me pick one. Do not write code
until I have chosen.
```

## 0.4 — Type definitions

```
Write the TypeScript types for the learning module under /types:
- LearningPath (id, title, description, units)
- Unit (id, title, levels)
- Level (id, title, order, difficulty, xpReward, questions)
- Question — a discriminated union with these variants:
  multiple_choice, image_match, ordering, fill_blank, audio_choice, true_false
- UserProgress (completed levels, XP, streak)

Audio fields must be optional — the app has to work fully with no audio files present.
Type definitions only, no implementation.
```

## 0.5 — Sample content

```
Create sample lesson JSON files matching the types in @types/learning.ts,
under /content/lessons/ — the first 2 units with realistic level and question counts.

Content rule: real structure, placeholder text.
- Unit and lesson TITLES may be real (e.g. "Abdest", "İmanın Şartları")
- Question text, answers and explanations must be placeholders:
  "ÖRNEK SORU 1", "ÖRNEK CEVAP A"
- Do NOT write any Quranic verse, hadith, prayer text or religious ruling.
  Leave a TODO marker there instead.
- Every file starts with the marker: ÖRNEK VERİ — GERÇEK DEĞİL

Include at least one example of every question type.
```

---

# PHASE 1 — Skeleton, Navigation, App On Device

## 1.1 — Tab navigation

```
Set up a 4-tab bottom navigation with Expo Router:
Öğren, Namaz, Kur'an, Profil.

For now each tab is an empty screen showing only its title.
Namaz and Kur'an tabs should render a "Yakında" state — they will not ship in v0.1.
Pick icons from @expo/vector-icons.
Colors, typography and all text must come from /constants.
```

## 1.2 — Core components

Run each of these in a **separate session**. Do not ask for all three at once.

```
Create a Button component under /components.
Variants: primary, secondary, ghost.
Sizes: small, medium, large.
States: normal, disabled, loading.
Add a press animation (slight scale-down with Reanimated).
Colors must come from /constants/colors.ts.
```

```
Create a ProgressBar component under /components.
Props: current, total, color variant.
It should animate smoothly when the value changes.
```

```
Create a Card component under /components.
Props: children, onPress (optional), variant.
Shadow and corner radius come from /constants.
```

## 1.3 — Development build

```
Set up EAS Build so I can install a development build on my phone:
- eas.json with development, preview and production profiles
- Verify the bundle identifier and app name in app.json
- Walk me through taking the first Android development build, step by step

Explain why Expo Go is not sufficient for this project and how I install the
dev build on my device. Run the commands one at a time and stop on any error.
```

## 1.4 — Crash reporting

```
Install and configure Sentry:
- Active only in production and preview builds, silent in development
- Read the DSN from an environment variable, never hardcode it
- Wire source map upload into the build pipeline

After setup, throw a deliberate error so we can confirm it shows up in Sentry.
```

---

# PHASE 2 — Learning Engine

## 2.1 — Level map screen

Ask for the plan first:

```
Plan first, do not write code yet.

We are building a Duolingo-style level map screen.
- Vertically scrolling path that zigzags
- Each level is a circular button with three states: locked / unlocked / completed
- Completed levels show earned stars
- Section headers between units

Which files will be created, which components are needed, and where does the
data come from?
```

After approving the plan:

```
Implement the plan. Use the sample data in /content only — no progress
persistence yet.
```

## 2.2 — Question components

One question type per **separate session**:

```
Create the MultipleChoiceQuestion component under /features/learning/components.
Props: question (of type Question), onAnswer callback.
- Options as a vertical list, each a tappable card
- Selecting an option highlights it but does not yet reveal correct/incorrect
- A "Kontrol Et" button at the bottom
Do not write any content — component only.
```

Repeat the same pattern, in order, for:
`TrueFalseQuestion`, `OrderingQuestion`, `FillBlankQuestion`, `ImageMatchQuestion`, `AudioChoiceQuestion`.

## 2.3 — Lesson flow screen

```
Plan first, do not write code yet.

/app/lesson/[id].tsx — the lesson screen:
- Progress bar and close button at the top
- Question component in the middle, rendered dynamically by question type
- After answering, a bottom panel: correct/incorrect feedback + explanation + continue
- At the end, a level completion screen showing XP earned and stars

How should data flow and state management work here?
```

## 2.4 — Progress persistence

```
Build the progress store with Zustand at /features/progress/store.ts:
- Completed levels, total XP, streak
- Persistent storage
- Logic that unlocks the next level when one is completed

The unlock logic must be a pure function with unit tests — a wrong lock leaves
the user stuck and is invisible to manual testing.

Store and tests only. Do not touch the UI.
```

## 2.5 — Audio infrastructure

```
Build the audio playback layer with expo-audio at /features/learning/audio.ts:
- Audio files are NOT bundled into the app; they are fetched remotely and
  cached on device
- When a file is missing the app stays silent, throws no error, and hides the
  play button
- Define and document the audio file naming convention

Do not add any audio files — infrastructure only.
```

## 2.6 — Placement test

```
Plan first, do not write code yet.

The placement flow shown on first launch:
- Welcome screen
- "Ne kadar biliyorsun?" choice: Başlangıç / Temeller / İleri
- A short test based on that choice (5-8 questions)
- Determine the starting point on the learning path from the result
- The user must always be able to go back and unlock skipped units

The progress model must distinguish "unlocked by placement test" from "completed".
```

---

# PHASE 2.5 — Release Preparation → v0.1 FIRST RELEASE

## 2.5.1 — Placeholder sweep

```
Scan the whole project and /content for markers that must never ship:
ÖRNEK, TODO, GERÇEK DEĞİL, placeholder, lorem.
List every hit with file path and line number. Do not fix anything — report only.
```

## 2.5.2 — Over-the-air updates

```
Install and configure expo-updates:
- Channel setup: preview and production
- When updates are checked for and when they are applied
- Document how to publish a content JSON change with eas update

After setup, publish a test OTA update and confirm it reaches the device.
```

## 2.5.3 — Store materials

```
Write the text assets required for store submission:
- Privacy policy draft (what data the app collects and where it is stored)
- Store description, short and long
- Recommended answers for the data safety / data collection forms

Do NOT produce religious content — these are product texts, not religious texts.
Note explicitly that the privacy policy needs legal review before publishing.
```

Then, manually: app icon, screenshots, age rating, TestFlight / Internal Testing distribution.

---

# PHASE 3 — Gamification → v0.2

## 3.1 — Streak system

```
Implement the streak logic under /features/progress:
- Daily activity records stored in SQLite, keyed by date
- Every table carries updatedAt and deletedAt columns (for Phase 7 sync)
- Consecutive-day calculation
- Reset when a day is missed
- One "streak freeze" per week

The calculation must be a pure function with unit tests covering:
day rollover, time zones, the freeze allowance, and long gaps.

Logic and tests only — UI comes later.
```

## 3.2 — Badge system

```
Build the badge / achievement system:
- Badge definitions in /content/badges.json (id, name, condition type, threshold)
- Condition evaluator: XP threshold, level count, streak days, unit completion
- An event fired when a badge is earned

Leave badge names and descriptions as placeholders — I will fill them in.
```

## 3.3 — Mascot and celebration

```
Build the level completion celebration screen:
- A slot for a Lottie animation (I will add the file later)
- Animated counter for XP earned
- Stars appearing one after another
- Continue / Home buttons
```

---

# PHASE 4 — Prayer Module → v0.3

## 4.0 — Data source research ⚠️ BLOCKING

```
Research the prayer times data source and report back. Do not write any code.

- Does Diyanet (Turkish Presidency of Religious Affairs) publish an official
  public API?
- If not, how can the annual prayer times data be obtained legally?
- What third-party API options exist, what are their terms of use and how
  reliable are they long term?
- For each option: access method, terms, risk, implementation cost

End with a recommendation. The outcome of this research determines the design
of the entire prayer module.
```

## 4.1 — Prayer times data layer

```
Plan first, based on the outcome of session 4.0:
- City / district selection
- Storing the annual prayer times locally (SQLite, with updatedAt/deletedAt)
- Finding the nearest district from the device location
- Fallback for users abroad: adhan-js calculation

What should the data model and the data flow look like?
```

## 4.2 — Prayer times screen

```
The main screen of the Namaz tab:
- Next prayer and countdown, large and centered
- List of the five daily prayers, past ones dimmed
- Gregorian and Hijri date

The countdown and "next prayer" calculation must be pure functions with unit
tests covering day rollover, the period after Isha, and time zone changes.
```

## 4.3 — Prayer tracking chart

```
Plan first, do not write code yet.

The prayer tracking chart:
- Three states per prayer per day: kıldım / kılmadım / kaza
- Weekly grid view
- Monthly calendar view
- Stored in SQLite (with updatedAt/deletedAt)

CRITICAL DESIGN RULE: the language must be encouraging and forgiving.
Never use blaming wording such as "kaçırdın", "başarısız", "seri bozuldu".
```

## 4.4 — Notifications

```
Build prayer time reminders with expo-notifications:
- Independent on/off toggle per prayer
- Timing options: at the start of the prayer window, or X minutes later
- Notification copy must be gentle and encouraging in tone
- Schedule them so they fire even when the app is closed
```

## 4.5 — Qibla compass

```
Build a qibla direction compass with expo-sensors:
- Magnetometer readings
- Bearing calculation from the device location to the Kaaba
- Rotating compass UI
- Calibration warning
```

---

# PHASE 5 — Quran Module → v0.4

> Resolve the translation (meal) copyright question before starting this phase.

## 5.1 — Data structure

```
Plan the Quran data layer:
- Surah and verse data model
- Fields for Arabic text, Turkish translation, and transliteration
- Bookmark (last position) storage
- Reading history (how much was read on which day)
```

## 5.2 — Reading screen

```
Build the Quran reading UI:
- Surah selection
- Verse-by-verse display, Arabic right-to-left
- Toggle the translation on and off
- Font size setting
- Automatically save the last position
```

## 5.3 — Goal system

```
Build Quran reading goals:
- Goal types: X pages per day / X juz per month / finish by a given date
- Progress percentage and estimated completion date
- Daily reminder
- Visual progress (juz-based grid)

Date and goal calculations must be pure functions with unit tests.
```

---

# PHASE 6 — Mini Games → v0.5

One game per session:

```
Build the "Sıralama Yarışı" mini game under /features/games:
- Put shuffled steps into the correct order against the clock
- Content comes from JSON under /content/games/
- 60 second timer, correct ordering scores points
- End-of-game screen

Do not write content — use placeholder sample data.
```

---

# PHASE 7 — Accounts & Sync → v1.0

```
Plan the Supabase integration:
- Email sign-up and sign-in
- Migrating existing local data to the cloud
- Two-way sync with conflict resolution (updatedAt/deletedAt already exist)
- Offline-first behaviour

IMPORTANT: prayer tracking data is sensitive personal data.
No social sharing and no leaderboards.
```
