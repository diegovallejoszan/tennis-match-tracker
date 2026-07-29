# Match preparation — tactical knowledge base

This folder holds the **internal** tennis tactics library used in **Phase 5+** when generating LLM match-prep advice. End users do **not** browse these files or tactic cards in the app.

## Purpose

When a user requests preparation advice for an upcoming match, the app sends an LLM API call with:

1. Opponent and user profiles  
2. Head-to-head match history (if any)  
3. The user’s last five matches (if any)  
4. A **filtered excerpt** of this knowledge base (see `src/lib/match-prep/knowledge-base.ts`)

The model returns a tailored game plan and tactical advice. Past responses are stored in the database so users can review them without calling the API again.

## Evolving the library

| File | Role |
|------|------|
| `sources.ts` | Trusted citation registry (Tier 1 federations, Tier 2 coaching sources) |
| `tactic-library.ts` | Paraphrased tactics linked to opponent archetypes and situations |
| `tactics.ts` | Schema and types for tactic records |
| `generator.ts` | Classifies play-style text → archetype; selects relevant tactics |
| `knowledge-base.ts` | Formats tactics + sources as LLM markdown (`KNOWLEDGE_BASE_VERSION`) |
| `build-prep-prompt-context.ts` | Assembles full prompt context from DB + knowledge base |
| `docs/match-prep/*.md` | Long-form reference material (e.g. amateur survival manual) |

**To improve advice over time:**

1. Add or refine entries in `tactic-library.ts` with a `sourceId` from `sources.ts`.  
2. Bump `KNOWLEDGE_BASE_VERSION` in `knowledge-base.ts` when changes are material.  
3. Add new markdown references under `docs/match-prep/` and register them in `sources.ts`.  
4. Extend `classifyOpponentTypeFromText` when new play-style labels appear in player profiles.

Saved advice records should store `knowledgeBaseVersion` (Phase 5 schema) for auditability.

## Singles strategy booklets

Version 1.1 adds paraphrased, source-linked tactics from:

- Jorge Capestany, *The On-Court Guide to Tennis*: matchup counters for
  aggressive baseliners, forehand-dominant players, counterpunchers,
  serve-and-volleyers, moonballers, and all-court players.
- George Mason University coaching notes, *Singles Strategy*: percentage
  baseline patterns, first- versus second-serve return plans, net defense, and
  tactics for strong groundstrokers and counterpunchers.

The library stores only concise paraphrases with source provenance; the PDFs
remain the authoritative references.

## Phase 4 (current)

- Knowledge base code lives in the repo but **Prepare** is hidden from navigation.  
- No LLM calls or saved-advice UI until Phase 5.

See [DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) for the full Phase 5 specification.
