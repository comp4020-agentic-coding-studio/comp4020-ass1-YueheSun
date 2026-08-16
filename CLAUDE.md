# COMP4020 prototype

This is your starter repo for a COMP4020 prototype: a static site written in
HTML/CSS/TypeScript that builds to plain HTML/CSS/JS and deploys to GitHub
Pages. The **deployed site is what gets marked** --- not this repo, and not "it
works on my machine". It's marked live in Chrome against the deployed URL at two
viewports --- 1920×1080 (desktop) and 390×844 (phone) --- and both count in
full, so make that artefact good at both and use the checks below to know
whether it is.

What you're building this week — the spec — is published on the course website,
and this repo's name tells you which deliverable it is. Run the course plugin's
**start** skill at the start of each week: it pulls the right spec from the
course API, carries your harness forward from last week, and helps you turn the
spec's checkable lines into tests of your own. Read the spec before you build,
and see `spec/README.md` for how the checks in this repo relate to it.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Before you push, run `pnpm check`. It runs most of what CI runs --- build,
  lint, and the spec --- so you catch those in seconds instead of waiting for
  the pipeline. The links check, the evidence check, the secrets scan, and the
  deploy itself only run in CI; run `pnpm dlx linkinator ./dist --silent`
  locally against a fresh `pnpm build` for the links check without waiting for
  CI.
- To see what the page actually looks like rather than what you assume it looks
  like, open it in a browser (the `agent-browser` CLI, documented on
  [the course site](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/backpressure/#agent-browser-the-rendered-page-as-ground-truth),
  works well for this). The rendered page is the truth; your mental model of it
  isn't.
- When a check fails, read its output before changing anything. Each check below
  names what it measures, and the failure message is the instruction: it tells
  you the file, the line, or the contract. Treat a red check as authoritative
  --- the page is wrong until the check is green, not until you decide it should
  be.
- Commit when the checks pass. Never commit a red state.

## The checks (your sensors)

CI runs these on every push once your repo is public. GitHub's checks UI shows
two jobs, `check` and `deploy` --- not one status per sensor below --- and
within `check` the steps run in sequence (`pnpm check` chains typecheck, build,
lint, and the spec with `&&`), so an early failure like a broken build stops the
later sensors from running for that push; fix it and push again to see the rest.
While the repo is private (all week, until you ship) the CI jobs stay skipped
--- `pnpm check` is the same roster on your machine, and it's the faster loop
anyway. They aren't hoops. Each is a different way of finding out something true
about the site that you can't reliably see by looking at it.

They also carry a mark at a crit: the sweep runs fifteen minutes after your
cutoff, and green checks there are worth half that week's shipped mark. Still
running counts as not green, so ship with time for CI to finish.

- **typecheck** --- `tsc --noEmit` runs first in `pnpm check`, so a type error
  stops the roster before the build even starts. The types are extra
  backpressure: a red here is the compiler telling you a claim in the code is
  false.
- **build** --- the site must build (`pnpm build`). A build failure means the
  deployed site is broken or stale, so nothing else matters until this is green.
- **deploy / online** --- the live GitHub Pages URL must load and return the
  page you expect. An asset that 404s on the deployed URL counts as broken even
  if it loads locally.
- **spec** --- `spec/invariants.test.ts` asserts what's true of any good
  website, whatever the week's brief asks; the tests you write for the week's
  own spec run alongside it (any `spec/*.test.ts`). A failure names the contract
  you haven't met yet.
- **lint** --- `stylelint` for CSS, `oxlint` for TypeScript. Flags code that's
  wrong, fragile, or non-idiomatic. Read the rule it names.
- **tests** --- any other tests you write, wherever you put them (co-located
  with your source is fine, not just `spec/`), must pass. Vitest picks up both
  this and the spec suite in one `vitest run`, the last step of `pnpm check`. A
  failing test is a claim about the site that's no longer true.
- **evidence** (`pnpm check:evidence`) --- checks your process evidence:
  `PROCESS.md`'s citations resolve to real commits, the current deliverable's
  exact reflection is in `reflections/` (worked out from this repo's name
  against the public course API), and your `CLAUDE.md` is present. Evidence
  gates the deploy --- `deploy` needs `check` to pass, so failing evidence
  blocks the deploy alongside everything else. See
  [Your process is part of the mark](#your-process-is-part-of-the-mark) below,
  and the course website's
  [assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
  for what counts as evidence.
- **links** --- internal links must resolve. A broken link is a dead end you
  didn't mean to ship.
- **secrets** --- the repo is scanned for committed credentials. Never put a
  key, token, or password in a tracked file. If one leaks, rotate it. A local
  pre-commit hook (`.githooks/pre-commit`, installed by `pnpm install`) also
  blocks any commit containing something shaped like an API key --- by the time
  CI sees a key it's already pushed, so the hook is the sensor that matters.

Nothing here measures **accessibility** or **performance** --- wiring those
sensors (`axe-core`, Lighthouse, or whatever you choose) is your work, and later
in the course the spec will ask you to show how you tested both. When you do,
read a green performance result honestly: it's a lab estimate from one run on a
CI machine, not proof the site is fast for real users.

## Verifying detail-photo markers (and species)

Each round's detail screen shows a "primary" feature card (the correct
species) and one or more "confusable" feature cards (species it's genuinely
confused with) --- each card's photo gets **every** feature `data.md` lists
for that species circled and numbered (`annotations` on a `SpeciesCard` /
`ConfusableCard` in `src/data/rounds.ts`), not just one. That photo is also
supposed to be of the species the card claims. `src/data/rounds.test.ts`
checks what's mechanical --- every annotation's `x`/`y` is within `[0, 100]`,
every card's photo file exists, and `ATTRIBUTION.md`'s recorded species text
for that file actually names the card's species (so a swapped photo whose
attribution row didn't get updated fails loudly) --- but it can't check the
thing that actually matters: whether each numbered ring lands on the right
part of the *image*, and whether the image is even of the right *bird*. Both
are claims about pixel content, and no test in this repo, and no vision model
in the CI environment, can judge them. It's a human-eye check, so make it a
repeatable one instead of a one-off:

- Run `pnpm verify:markers` after adding or changing any card's photo or
  annotation coordinates. It composites every one of a card's annotations as
  numbered rings onto its actual source photo and writes one preview file per
  card to `.previews/markers/` (gitignored --- never commit these images, and
  never treat their presence as a substitute for having looked at them),
  named `{round.id}-primary.jpg` or `{round.id}-confusable-{photoSlug}.jpg`,
  printing the claimed species, Latin name, and each numbered label next to
  each file.
- Open every file it wrote and confirm two things: each numbered ring sits on
  the feature its label claims, and the photo actually shows the species
  named next to it --- not just something plausible at a glance.
- Do this **before** committing that card's change. A photo/annotation commit
  made without running this is the same mistake `752ab25` caught by luck, not
  by process --- three of twelve markers were pointing at the wrong spot until
  someone looked.
- **Not covered by this script**: the leader line connecting each ring to its
  label (drawn at runtime by `src/scripts/leader-lines.ts`) and the
  confusable-species dropdown switcher. Both depend on real layout
  (`ResizeObserver`-driven), so `verify:markers`'s pixels-only composite can't
  exercise them --- check those with a real rendered-page pass (`agent-browser`
  or equivalent) at both graded viewports before committing any round that
  touches the card layout.

## The stack is swappable

Out of the box this is plain HTML/CSS/TypeScript on Vite, and every `.html` file
in the repo is a page: add pages, link them, and the build picks them up with no
config. That's a default, not a rule (unless the week's spec says otherwise).
You can swap in Astro or any other static generator, because nothing in CI names
a tool --- the whole contract is:

- `pnpm build` emits the complete site into `dist/`
- the `package.json` scripts (`check`, `check:evidence`, `build`) keep working
- whatever lands in `dist/` still passes the invariants in `spec/`

Two things bite in a swap. The deployed site lives under a path
(`…github.io/<repo>/`), so configure your generator's base path --- this
template's Vite config uses relative asset URLs to sidestep that, but most
generators (Astro included) need `base` set explicitly, and getting it wrong
looks fine locally while every asset 404s on the live URL. And commit the
updated `pnpm-lock.yaml`: CI installs with `--frozen-lockfile`.

## Your process is part of the mark

The deployed page is only half of it. How you got there is marked too: your
commit history, your agent files, and the decisions visible across them. The
checks above can't see any of that, so a person reads it directly --- which
means building legibly is part of building well.

- **Commit as you go.** Small, frequent commits are the record of how the work
  came together, and that record is read, not just the final state. A trail that
  grew alongside the code is the strongest evidence of your process; a single
  dump the night before is the weakest.
- **Keep a process overview** (`PROCESS.md`). A short reading-guide, not an
  essay: what you built, the moments that mattered --- each pointing at a
  commit, a `CLAUDE.md` change, or a prompt and the commit it produced --- and
  where to look in the history. It points a marker at the evidence; it doesn't
  stand in for it, and claims the history doesn't back don't count. The
  `PROCESS.md` in this repo is a template showing the shape and the citation
  format (link text the commit hash or range, target the commit or compare URL);
  `pnpm check:evidence` verifies your citations resolve to real commits before
  you ship. Markers follow those citations and don't trawl the repo for evidence
  you didn't cite.
  No skill or command drafts this for you — after any commit that reflects a
  real judgment call (rejected the agent's first approach, added a rule to this
  file, caught something with a check), add the `PROCESS.md` entry then, while
  the why is still fresh, rather than reconstructing it all at the end.
- **What counts as a harness-level correction, for this repo.** The brief
  ranks "a rule added to `CLAUDE.md`, a check wired up, an attempt thrown away"
  above "retry until it passes." Concretely: the fix has to change what future
  work is checked against or aimed at, not just produce a different output
  under the same standard. A verbal pivot ("let's do X instead of Y") only
  counts once it lands in something durable — a test that now asserts the new
  contract, a rule here that would actually stop the old mistake recurring, or
  a commit that visibly discards a real attempt. A correction inherited from a
  previous week's harness (a check already in the repo before this deliverable
  started) is context, not an A1-original moment — don't cite it as one of
  this deliverable's three or four.
- **Citation integrity.** Cite the commit where the harness artefact itself
  changed — the diff a marker opens has to show the claim, not predate it. A
  commit whose code still reflects the old approach, offered as evidence of
  the new decision, reads as "record contradicts claims" (the rubric's
  explicit N-band failure), even if the commit message describes the new
  decision accurately.
- **Keep a running candidate log.** Claude: after any commit that might be one
  of these moments, append a short raw entry to `process-notes.md` (repo root,
  not part of the deployed site, not itself graded) — what happened, the
  correction, the commit hash — right away, without waiting to be asked. I'll
  curate the final three or four into `PROCESS.md` before shipping, so leave
  `process-notes.md` uncited from `PROCESS.md` and don't treat its leftovers
  as evidence in their own right.
- **Write your reflection in `reflections/`** --- a short markdown file in this
  repo, named for the deliverable it answers, so the number in the filename is
  the number in this repo's name (`crit-1.md` in `comp4020-crit1-<you>`,
  `assignment-1.md` in `comp4020-ass1-<you>`); `reflections/README.md` has the
  full rule. `pnpm check:evidence` checks the exact current name against the
  course API, not merely the presence of any well-named file. It answers the two
  standing prompts: the breakthrough that moved the work forward, and what this
  work changed about the developer you want to be. It stays out of the deployed
  site. It's due at the cutoff, and if it isn't in the repo by then the week
  doesn't count as shipped, however good the prototype is.
- **This file is process evidence.** The harness you build to direct the agent,
  this `CLAUDE.md` and any `AGENTS.md`, is itself read as part of how you
  worked. Keep it honest and current (see below).

You don't need a name, a student number, or any identity file in the repo: we
know whose repo it is. Spend the effort on the work.

## This file is yours

This CLAUDE.md is a starting point, not a fixed rulebook. As you learn what your
prototype needs --- a convention to hold the agent to, a sensor that keeps
catching you out, a fact about the stack the agent keeps getting wrong --- write
it down here. Growing this file is the work of harness engineering, and the gap
between this boilerplate and your own version is part of what your prototype
says about the developer you're becoming.
