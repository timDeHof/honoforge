# LANGUAGE.md — Architecture Vocabulary

> Terms used to discuss module depth, seams, and leverage. Use these terms consistently in architecture reviews, ADRs, and code comments.

## Core Terms

**Module** — Anything with an interface and an implementation (function, class, package, slice). The unit of architectural analysis.

**Interface** — Everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.

**Implementation** — The code inside the module. The hidden part.

**Depth** — Leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.

**Seam** — Where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")

**Adapter** — A concrete thing satisfying an interface at a seam.

**Leverage** — What callers get from depth.

**Locality** — What maintainers get from depth: change, bugs, knowledge concentrated in one place.

## Principles

### The Deletion Test

Imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep. A "yes, concentrates" is the signal you want.

### The Interface Is the Test Surface

The interface defines what needs testing. If the interface is wide, the test surface is wide. Deepen the module to narrow the interface and concentrate the test surface.

### One Adapter = Hypothetical Seam. Two Adapters = Real Seam.

A single adapter proves the interface is useful. Two adapters prove the seam is real and the interface is stable enough to support multiple implementations.

### Shallow Module

Interface nearly as complex as the implementation. Often a pass-through or thin wrapper. Apply the deletion test — if deleting it just moves complexity to callers, keep it. If complexity vanishes, delete it.

### Deep Module

High leverage: lots of behaviour behind a small interface. Changes to implementation don't ripple to callers. Bugs are localized. Tests concentrate on the interface, not the internals.

## Anti-patterns

**Pass-through** — A module that just forwards calls to another module with no added behaviour. Earns no keep.

**Leaky seam** — A module whose implementation details leak through its interface (e.g., exposing internal types, requiring callers to know about internal structure).

**Scattered knowledge** — Understanding one concept requires bouncing between many small modules. No locality.

**Test-driven extraction** — Pure functions extracted just for testability, but the real bugs hide in how they're called. No locality.

## Usage

When discussing architecture:

- Say "deepen the module" not "make it more complex"
- Say "the seam between X and Y" not "the boundary"
- Say "the adapter for Z" not "the implementation of Z"
- Say "apply the deletion test" not "is this module necessary?"
