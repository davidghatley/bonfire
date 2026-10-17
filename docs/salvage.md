# Salvage notes: bonfire

Audit date: 2026-10-17. Old repos were read, not modified. bonfire is an agent harness
(a fork of pi or opencode) built for gauntlet loops (propose → evaluate → critique →
verify) and parallel subagents, durable over long runs.

The closest ancestor is **gauntlet** (Python, about 5k LOC; 67 tests pass at
`dd9c4d2`). It is a standalone orchestrator that shells out to OpenCode. It is not a
harness fork, so its loop *design* carries over but its *code* does not.

## How to bring anything in

Copy only the excerpt you need into `docs/reference/<name>.md`, with this header:

```text
> Provenance: davidghatley/<repo>@<commit>:<path> (copied 2026-10-17, excerpt)
> Status: reference only. Not a spec. Overridden by anything in this repo.
```

Never copy code wholesale. bonfire's code must be written against pi or opencode's own internals.

## 1. Carry as reference

| What | Source | Why |
|---|---|---|
| The loop as a phase list | `gauntlet@8850356:README.md`, section "The V0 loop" (steps 1–7) | The clearest statement of propose → snapshot → evaluate → criticize → verify → select → reset. Copy about 40 lines and use them as the starting spec for bonfire's loop. |
| The Finding schema | `gauntlet@8850356:src/gauntlet/models.py`, `Finding` and `FindingStatus` (roughly lines 54–60 and 103–130) | Fields: finding_id, category, claim, evidence, reproduction, severity, confidence, proposed_fix, status. Status is one of unverified, verified, rejected or unable_to_reproduce. "A critic's finding is a claim; only a verifier makes it fact" is the core idea. Copy the field list only, not the code. |
| Verification rules | `gauntlet@8850356:README.md`, step 5 | When several findings rest on one aggregate failing command, mark them `unable_to_reproduce`, never `verified`. Small rule, prevents false confirmations. |
| Durable run store | `gauntlet@8850356:docs/architecture.md`, `store.py` row plus the "State and lifecycle" section | Per-run lock, atomic `state.json` replacement, an append-only fsynced `events.jsonl`, and resume from the next phase boundary. This is the durability floor for long runs. |
| Restart test idea for the proving demo | `gauntlet@8850356:README.md`, `resume` section, and `tests/test_orchestrator.py` (its pause/resume cases) | The INTENT demo needs a run that survives a forced restart. gauntlet's rule: resume continues from the next durable phase boundary and never recreates completed candidates. Turn that into a bonfire test: kill the process mid-fan-out, resume, and assert no worker is redone. |
| Scripted-adapter test pattern | `gauntlet@8850356:examples/tiny-grid/.gauntlet/` (`gauntlet.toml` + `fixtures/*.json`) | Deterministic fixture responses let you test the whole loop with no model calls. Recreate the idea as a bonfire test fixture. Don't copy the files. |
| Orchestration self-experiment | `gauntlet@8850356:experiments/orchestration_v0/REPORT.md` | Three arms (one worker; worker + review + revision; parallel workers + selection) with call accounting. A good template for bonfire's first "does the loop help?" report. Its numbers are mechanics only: the workers are scripted. |
| Eval corpus, pinned rather than copied | `benchlet@9188edf` (16 tasks, each with starter / visible tests / hidden evaluator) plus `benchlet@9188edf:research/experiment-protocol.md` §1–2 | The only outcome benchmark you already have. Pin it by commit as an external eval and mount only `tasks/<id>/starter/` into the solver. The protocol's main rule: compare against a single agent **at equal total budget**, with the task as the unit of analysis. |
| Pilot evidence that hidden tests matter | `benchlet@9188edf:research/baseline-pilot.md`, the table | A single agent passed every visible test on 7 tasks but failed hidden tests on 2 (`atlas` recursion depth, `weave` validation). Those are the cases a critique + verify loop should catch. Use them as bonfire's first target. |

## 2. Lessons

- **What worked in gauntlet:** a strict JSON boundary for critics, which were fresh-context and read-only (the adapter rejects tool events from read-only critics). Deterministic ranking. Protected paths. The scripted adapter, which made 67 tests possible with no model calls.
- **What drifted:** gauntlet became a standalone Python state machine with git plumbing (private bare repo, owned refs, cleanup policy). Twelve of its last commits are "harden / close audit findings". The polish went into recovery edge cases before a single real model run was measured. **Measure one real loop on benchlet before hardening recovery.**
- **Parallel worktrees have costs** (`system-one-mini@4e08635:reports/project-retrospective.md` §4): duplicate discovery noise, and pytest collecting nested worktrees. Keep subagent worktrees outside the repo tree and limit test discovery.
- **Handoffs survive only on disk** (same retrospective, §3): record the exact command, seed, config and input hashes, and keep metrics in JSON. Chat history is not state. This is the case for bonfire's durable event log.
- **Free or slow models time out** (`system-a@b4407e5:PROJECT_STATE.md`, Decisions: Nemotron timed out twice). Durable runs need per-call timeouts and retries recorded as events.

## 3. Leave behind

- **All gauntlet code** (`src/gauntlet/*`, about 5k LOC). It is the wrong substrate: bonfire forks a harness, it does not wrap one. Its git plumbing and plateau/architect-reset logic are V0 guesses that were never validated on real models.
- **`gauntlet@8850356:docs/gauntlet-v0-report.html` and `AGENTS.md`.** Narrative and process, no data.
- **benchlet's runner code and maintainer audits** (`tasks/*/AUDIT.md`, `research/*` except the two files above). Use benchlet as a pinned dependency, not as source.
- **The local `portfolio-pivot` branch of gauntlet.** Its one extra commit is only a tmp-dir test fix.
