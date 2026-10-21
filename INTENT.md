# INTENT: bonfire

> The token bonfire: an agent harness built for gauntlet loops and parallel subagents, made to run long and survive restarts.

Status: placeholder name · written 2026-10-17 from David's direction · **this file changes only when David agrees.**

## Note from David (2026-10-20): keep it lit
bonfire is the rename of gauntlet. It should be about parallelizing work: many different tasks running at once, kept running continuously for a long time. David likes the bonfire idea for exactly that: you keep the fire lit, and it keeps doing tasks for a long time. Lean on that image in naming, copy and demos (feeding the fire = queueing tasks; the fire staying lit = runs that last and survive restarts; the burn = the token meter).

## What it is
- David's own harness: a fork of, extension to, or thin core on top of pi or opencode (decided in docs/decisions/0001-fork-base.md).
- First-class **gauntlet loops**: propose → evaluate → critique → verify, repeated until an artifact passes explicit checks.
- **Fan-out**: one loop forks parallel workers down different paths and merges or picks results.
- **Many tasks, kept going**: a queue of different tasks running in parallel, continuously, for hours or days, not just one loop at a time.
- **Durable**: a run survives a crash or restart and resumes where it was.
- Logs every decision point in a form nibble can train on.

## What it is not
- Not a general replacement for Claude Code, pi or opencode for everyday coding.
- Not a hosted SaaS. Local first.
- Not a framework zoo: one loop model, done well.
- Not the old gauntlet repo's 'evidence-driven artifact improvement' scope.

## The proving demo
One gauntlet loop fans out **4 parallel workers** on a real task (first: building one small game), merges the result, and **the run survives a forced restart** mid-way.

## Interface to the stack
Input: a task + an optional prep folder (from mise_en_place) + check definitions. Calls nibble for typed choices. Output: artifacts + `runs/<id>/` logs (events, decisions, costs/tokens burned; the bonfire meter is part of the brand).

## Starting point
The fork base chosen in 0001. Old gauntlet repo is illustration only.

## Open decisions
- Fork base: pi, pi durable or opencode (see 0001-fork-base.md, status proposed).
- How workers are isolated (git worktrees vs separate dirs).
- Token-burn meter and public 'bonfire' framing for demos.
