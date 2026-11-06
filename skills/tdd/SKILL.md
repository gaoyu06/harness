---
name: tdd
description: '测试驱动开发：用户要求先写测试、TDD、red-green，或要补集成测试时，写实现代码前调用。一次一个纵向切片：先写失败的测试，再写刚好让它通过的实现；测试只放在和用户确认过的边界上。修 bug 的排查转 diagnosing-bugs。'
license: MIT
---

# Test-Driven Development

## 上下游

- 前接：需求或 `dev-plan` 的交付顺序；修 bug 时接 `diagnosing-bugs` 定位出的根因。
- 读取：词汇表、决策记录（见下文）。
- 后接：实现纪律按 `ponytail`；跨模块或高风险的改动由 `review` 门禁决定是否审查。

TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle: consult them before and during the loop, not after.

When exploring the codebase, read the project glossary (`GLOSSARY.md`, or `.harness/spec/glossary.md` in `.harness/` projects) if it exists, so test names and interface vocabulary match the project's domain language, and respect decision records in the area you're touching (`docs/adr/`, or `.harness/notes/`).

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification: "user can checkout with valid cart" tells you exactly what capability exists, and it survives refactors because it doesn't care about internal structure.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Seams: where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You can't test everything, so agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.

Ask: "What's the public interface, and which seams should we test?" Give each proposed seam a one-line note on what it catches and what it misses.

When the shape of that interface is itself in question (how deep the module is, where the seam belongs, what the interface should expose), settle it with the user before writing tests. Prefer a small interface with a lot of behaviour behind it: that is where a few tests cover the most.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth: a known-good literal, a worked example, the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead: one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactoring is not part of the loop.** Do it as a separate step once the slices are green, keeping every test green, not inside the red → green cycle.
