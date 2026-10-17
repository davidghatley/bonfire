# 0001: Base for bonfire (fork pi, fork opencode, or embed)

- **Status:** proposed (David decides)
- **Date:** 2026-10-17
- **Scope:** which existing harness bonfire is built on, and how

bonfire is a harness for **gauntlet loops**: propose, evaluate, critique, verify, repeated until an artifact passes. Work fans out to parallel subagents on different paths, and runs are long and durable. The proving demo (INTENT.md) is **one gauntlet loop that fans out 4 parallel workers on a real task (first: one game from a prep pack), merges the result, and survives a forced restart mid-way**.

Legend: **[V]** = I checked it myself in source, docs, `gh` or the installed CLI on 2026-10-17. **[U]** = unverified, inferred, or from marketing text.

---

## 1. Comparison

"pi durable" is **not a fork and not a mode**. It is `@earendil-works/pi-durable`, a separate package in the pi monorepo (`packages/durable`, MIT, v1.3.0 on 2026-10-15). It provides a durable agent harness as a library: conversations, model turns, tool calls and your own state are committed to SQLite or JSONL storage *before* anything is shown. The `pi` CLI you have installed (coding-agent 1.1.0) does **not** run on it yet. coding-agent does not depend on pi-durable; only `packages/env` does. pi.dev's banner says "We've shipped Pi 1.0 with Pi Durable." [V]

| | **pi** (coding-agent CLI) | **pi-durable** (library in the pi repo) | **opencode** |
|---|---|---|---|
| Repo | github.com/earendil-works/pi | same repo, `packages/durable` | github.com/anomalyco/opencode (sst/opencode redirects here) |
| License (SPDX) | `MIT` (c) 2025 Mario Zechner [V] | `MIT`, author "Earendil Works" [V] | `MIT` (c) 2025 opencode [V] |
| Maintainer | Earendil Inc. (Mario Zechner / badlogic) [V] | same [V] | Anomaly (formerly SST team) [U: org name from repo owner] |
| Stars / forks | ~116k / ~14.8k [V] | n/a (inside pi) | ~214k / ~28.8k [V] |
| Commits, last 90 days | ~1,990 (whole monorepo) [V] | part of that number; 10 releases since 1.0.0 on 2026-10-01 [V] | ~4,820 [V] |
| Releases, last 90 days | 27 [V] | ships in lockstep with pi | 40 [V] |
| Contributors | 300+ [V, API page count] | small core (Mario, davidbrai, ...) [U] | 1,000+ [V, API page count] |
| Open issues | 348 [V] | | 4,519 [V] |
| Contribution policy | PRs and issues from new contributors are auto-closed and triaged daily [V] | same | normal PR flow, default branch `dev` [V] |
| Language / runtime | TypeScript, Node >= 22.19 (binary built with Bun) [V] | TypeScript, Node; also Cloudflare Durable Objects [V] | TypeScript on **Bun 1.4** + **Effect v4** + Drizzle/SQLite; TUI on OpenTUI + Solid [V] |
| Core LOC (non-test .ts) | coding-agent 92k, ai 31k, tui 20k, agent 3k [V] | **durable 25k** + chord 14k + ai 31k [V] | core 71k, tui 63k, app 161k, gui-extensions 58k, session-ui 26k, ai 33k ... about **550k total** [V] |
| Solo-fork difficulty | Moderate. Plain TS, small packages. | **Low to moderate as a dependency.** Normative 5.4k-line spec and 32 runnable examples. High if forked, since the internals are dense. | **High.** Effect v4 everywhere (plugins must share the host's `effect` instance), Bun-only APIs, mid-migration to the V2 HTTP API (`V2_HTTP_API_AUDIT.md`, `src/v1/`) [V] |
| Extension points | Extensions (`pi.registerTool`, commands, events, UI widgets, providers), skills, prompt templates, themes, npm/git "Pi packages" [V] | `defineExtension` with tools, system-prompt sections, hooks (`beforeTool`, ...), wraps, and **custom durable tasks** (`defineTask`, phased state machines) [V] | V2 plugins: `ctx.{agent,tool,model,provider,session,...}.transform` and runtime hooks (`session.hook("context")`, `retry`, aisdk), TUI plugins, custom agents in config [V] |
| Gauntlet loop as an extension? | Possible, but you would be bolting durability onto an in-memory session loop | **Yes. Native fit**: the loop is a `defineTask` with phases, and workers are child tasks or owned conversations | Partly. Agents and tools are easy; there is no user-definable durable task or state machine, so the loop would live in your own orchestrator over the SDK [V/U] |
| Subagents | **Not built in** by design ("skips sub-agents") [V]. Example extension spawns separate `pi` processes, max 8 tasks, concurrency 4 [V] | **Native**: task-owned child conversations, foreground or background, abort propagation, `taskGraph()` watch; examples 22, 23, 24 [V] | **Native**: `task` subagent tool, `mode: "subagent"` agents, background subagent jobs that post results back [V] |
| Parallelism | Process-level (spawn N `pi`) [V] | In-process structured concurrency. Parallel tool rounds; child tasks with `allSettled` / `failFast` waits [V]. One Harness process per Session [V] | In-process Effect fibers; one managed server per DB [V] |
| Git worktrees | None in core [V] | None. Per-conversation `ExecutionEnv` with its own cwd (example 29 "sandbox-per-conversation"; example 28 "reviewer" gets its own checkout) [V]. Remote env over SSH via `pi-env` [V] | **Native `Worktree` service** (create/remove, strategies, DB-tracked) [V] |
| Durability | Append-only JSONL session tree, resume or fork sessions; `get_entries since=<id>` durable cursor over RPC [V]. Crash mid-turn is **not** resumed [U] | **Designed for it.** Atomic commits; tasks checkpoint at every phase; `harness.resume()` continues unfinished runs; idempotent `requestId`; tools rerun only if `replay: "safe"`, otherwise the model gets an `interrupted` result; example 13 "recovery", 31 "reload-and-restart" [V] | **Good.** SQLite; `SessionRestart.resumeSuspendedSessions` resumes orphaned turns at boot by prompting "The server restarted... continue" (at-least-once, max 10 attempts per turn); background jobs keep `recovery` records [V]. Resumes at turn granularity, not at user-defined checkpoints [V] |
| Providers | pi-ai: ~45 providers including Anthropic, OpenAI and Codex, Bedrock, Vertex, OpenRouter; llama.cpp doc, Ollama or any OpenAI-compatible endpoint through `models.json` [V] | same pi-ai [V] | AI SDK + models.dev: Anthropic, OpenAI, Ollama, LM Studio, vLLM, local/OpenAI-compatible, ~35 provider plugins [V] |
| Headless / API | `pi -p` / JSON mode, RPC over stdio, TS SDK (`createAgentSession`), experimental remote client (CBOR over Unix socket) [V] | It *is* the API: `Harness.open(storage)`, `conversation.submit/wait/watch`, `taskGraph` [V] | `opencode run`, `opencode serve` (HTTP + OpenAPI), `@opencode/client`, in-process `@opencode/sdk`, ACP server [V] |
| UI surfaces for demos | Strong TUI (pi-tui, fullscreen mode), HTML session export, OSC 7501 status [V]. No web UI [V] | None. You build it; `watch()` and `watchTaskGraph()` make live views easy [V] | TUI, **web UI** (`opencode web`), desktop app (beta), session share [V]. Best for screenshots out of the box |
| Upstream churn | High (release roughly every 3 days) [V] | **Very high.** README: "Experimental. The API changes without notice." 1.2.0 (2026-10-12) had breaking changes [V] | Very high (40 releases in 90 days, V2 API migration in progress) [V] |
| Dependency licenses (spot check) | MIT, Apache-2.0 (photon, grok-mermaid), BSD-3 (highlight.js) [V] | MIT, Apache-2.0 [V] | MIT (effect, opentui), Apache-2.0 (ai, drizzle-orm) [V]. Full transitive audit not done [U] |

**Note on gauntlet (davidghatley/gauntlet):** Python, about 5.6k LOC. The loop is propose/mutate, snapshot to a run-owned git ref, deterministic evaluate (shell-free command arrays plus a strict-JSON metrics command), fresh critics (structured `CriticResult`), verify in a *separate* worktree, deterministic select, and a plateau-triggered architect reset. It already shells out to **opencode** (`OpenCodeAdapter` parses `opencode run` NDJSON) and persists `state.json` + `events.jsonl` with file locks. It is treated here as illustration only. The pieces worth porting are: worktree-per-candidate, frozen candidate commits, "critic findings are claims, verifier decides", and deterministic ranking. Its weak points are the ones bonfire targets: phases run strictly in sequence, `max_parallel` only bounds work inside a phase, and resume is coarse. [V]

---

## 2. Recommendation

**Build a thin bonfire core that embeds `@earendil-works/pi-durable` + `pi-ai` as libraries. Pin exact versions. Do not fork anything at this stage.** Keep a fork of `packages/durable` ready as the escape hatch if upstream breaks the API in a way you can't absorb.

Why:

1. **Durability is the hard part, and pi-durable already solves it in the shape bonfire needs.** A gauntlet loop is a durable state machine with phases that fans out to child work and waits on it. That is exactly what `defineTask` plus child tasks with `waiting { on, policy: "allSettled" }` provide, with a checkpoint at every phase, `harness.resume()` after a crash, and idempotent `requestId`s. opencode resumes at *turn* granularity by telling the model to "continue", which suits chat but not a multi-generation loop with selection state.
2. **A fork is the wrong unit.** Forking the pi CLI (92k LOC) or opencode (about 550k LOC, Effect + Bun) means one person carrying merge burden against roughly 2k–5k upstream commits per quarter, for UI and coding features bonfire doesn't need at its core. Embedding a 25k-LOC library with a normative spec gives the same freedom ("own the loop") without inheriting the product.
3. **Freedom is preserved.** It's MIT, the providers include Anthropic, OpenAI and local llama.cpp/Ollama through pi-ai, the storage is your SQLite file, and the tools, hooks and tasks are your code. If pi-durable stalls, the escape hatch is to vendor `packages/durable` + `chord` (about 39k LOC) under MIT.
4. **Demo story.** "My own harness on a durable runtime; kill -9 it mid-run and it picks up" reads better as build-in-public than "my fork of X". The pi TUI or opencode web stay available as *clients* later, without forking them.

**The cost, stated plainly:**

- pi-durable is explicitly experimental and broke its API on 2026-10-12. Mitigations: pin exact versions, keep a thin adapter layer (`bonfire/runtime/*`) as the only code that imports pi-durable, and upgrade deliberately.
- There is no built-in UI or worktree manager. bonfire writes its own git worktree helper (port it from gauntlet's `git.py` / `candidates.py`) and a small live view on `watchTaskGraph()`.
- Upstream won't accept your PRs easily (new-contributor auto-close). Assume you'll carry patches rather than upstream them.

**Rejected alternatives:**

- *Fork opencode.* Its features are the richest for this use case (native worktrees, subagents, restart recovery, web UI). But the codebase is the largest and most opinionated (Effect v4 idioms, Bun APIs, an ongoing V2 API rewrite), so it's the worst to maintain alone. It stays the **fallback**: if pi-durable proves too unstable, drive opencode headless through `@opencode/sdk` / `opencode serve` from a bonfire orchestrator. That is the gauntlet V0 approach with better plumbing.
- *Build as a pi CLI extension.* It's fast to demo inside the pi TUI, but the CLI's session loop is not durable mid-turn, so the restart-survival demo would be fragile.
- *Fork pi.* No benefit over embedding its packages, and you'd carry the full merge burden.

---

## 3. Sketch: gauntlet loop, 4 workers, survives restart

```
bonfire daemon (one Node process; owns the Session; pi-durable forbids two owners)
└─ Harness.open(openNodeSqliteStorage(".bonfire/run.sqlite"))   → harness.resume() on boot
   └─ task  bonfire.gauntlet  { phase, generation, baselineRef, parents[], findings[] }
        phase "propose":  commit 4 child tasks bonfire.worker{i, strategy_i}
                          → status "waiting", on: workers, policy: "allSettled"
        └─ bonfire.worker  (child task; owns 1 conversation via task ownership)
              phases: worktree → run → snapshot
              worktree:  git worktree add .bonfire/wt/<gen>/<i>  (idempotent: check, then create)
              run:       conversation (ExecutionEnv cwd = that worktree, CodingTools)
                         submit({ requestId: `gen${g}:w${i}` })   ← restart re-finds the same submission
              snapshot:  commit to refs/bonfire/<run>/<gen>/<i>; record sha in the checkpoint
        phase "evaluate": per candidate, a deterministic task running eval command arrays (replay: "safe")
        phase "critique": fresh conversations (separate critic agent/model), structured output schema → findings
        phase "verify":   fresh worktree from the frozen sha; run verifier commands; findings → verified | rejected
        phase "select":   deterministic rank, or a merge step (an agent combines the best candidates in a fresh worktree,
                          then re-enters evaluate); pass? done : generation+1 → "propose"
        every phase:      append decision records + usage (pi-durable keeps per-conversation spend in `pi.usage`)
                          to runs/<id>/ (events, decisions, costs/tokens) for nibble and the bonfire meter
```

How the restart survives: every phase transition is a committed checkpoint. A `kill -9` during "propose" leaves 4 worker tasks `pending/running`. The next boot calls `harness.resume()`, each worker re-enters its last committed phase, worktree creation is idempotent, the agent submission is deduplicated by `requestId`, and an interrupted non-replay-safe `bash` call comes back to the model as an `interrupted` result, which it handles. Demo script: start the run, wait until all 4 workers are mid-edit (visible in the `watchTaskGraph` view), `kill -9`, restart, and show the same task ids continuing to "select".

[U] Not yet confirmed by running it: how many model calls pi-durable runs at once inside one process, and behaviour under 4 long `bash` evaluations. Heavy evaluations should run as subprocesses either way.

---

Worker isolation (an open decision in INTENT.md): this sketch assumes **git worktrees**, since gauntlet already proved the pattern and opencode has it natively. Separate directories would work behind the same `ExecutionEnv` cwd seam, so this ADR doesn't need to settle it.

## 4. First 5 tasks

1. **Spike: recovery proof (half a day).** In `bonfire/`, `npm i` exact-pinned `@earendil-works/pi-durable@1.3.0 pi-ai chord`. Run upstream examples `13-recovery.ts`, `24-child-tasks.ts` and `22-subagent-foreground.ts` against SQLite with a real Anthropic model and a local llama.cpp model, and `kill -9` mid-run. Exit criterion: the run resumes with the same task ids. Record the dependency choice (why pi-durable) per CLAUDE.md.
2. **Runtime adapter + worktree helper.** Create `src/runtime/` (the only module that imports pi-durable) and `src/git/worktree.ts` (idempotent add/remove, freeze to `refs/bonfire/...`, protected-path check). Port the semantics from gauntlet's `candidates.py` / `git.py`.
3. **`bonfire.worker` task.** Phases worktree → run → snapshot, with each worker owning a conversation scoped to its worktree, `requestId` dedupe, and a configurable model and strategy prompt per worker.
4. **`bonfire.gauntlet` task.** Propose fans out to 4 workers (`allSettled`), then evaluate (deterministic, strict-JSON metrics), critique (fresh conversations, `structuredOutputSchema`), verify (fresh worktree), select (deterministic rank), then loop or stop. Contract and config come from a `bonfire.toml`.
5. **Proving demo + live view.** A `bonfire watch` terminal view on `watchTaskGraph()`, and a scripted demo (`demo/kill-restart.sh`) first on a tiny fixture repo (port gauntlet's `examples/tiny-grid`), then on the real task (one game from a prep pack). Make it runnable from the README and record it for build-in-public.

---

## 5. Sources

- pi site: https://pi.dev/ (banner "shipped Pi 1.0 with Pi Durable"; "skips sub-agents")
- pi repo: https://github.com/earendil-works/pi (LICENSE, AGENTS.md, CONTRIBUTING.md)
- pi-durable README / spec: https://github.com/earendil-works/pi/tree/main/packages/durable (README.md, docs/spec.md, test/examples/)
- pi-env: https://github.com/earendil-works/pi/tree/main/packages/env
- pi coding-agent docs (installed via mise, pi 1.1.0, `pi/docs/`) (extensions.md, sdk.md, rpc.md, sessions.md, models.md, llama-cpp.md); CHANGELOG.md (AgentHarness v2, "durable execution is implemented")
- pi subagent example: https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/subagent
- opencode repo: https://github.com/anomalyco/opencode (LICENSE, AGENTS.md, V2_HTTP_API_AUDIT.md)
- opencode plugin API: https://github.com/anomalyco/opencode/tree/dev/packages/plugin (src/README.md)
- opencode SDK: https://github.com/anomalyco/opencode/tree/dev/packages/sdk
- opencode restart recovery: `packages/core/src/session/execution/restart.ts`; jobs `packages/core/src/job.ts`; worktrees `packages/core/src/worktree.ts`; subagent tool `packages/core/src/tool/plugin/subagent.ts`
- opencode CLI 1.19.0 `--help` (installed via mise)
- gauntlet: https://github.com/davidghatley/gauntlet (README.md, src/gauntlet/orchestrator.py, adapters.py, store.py)
- Activity numbers: GitHub REST API via `gh api` (repos, commits?since=90d, releases, contributors), fetched 2026-10-17
- Dependency licenses: `npm view <pkg> license` for quickjs-wasi, photon-node, highlight.js, grok-mermaid, effect, drizzle-orm, ai, @opentui/core
