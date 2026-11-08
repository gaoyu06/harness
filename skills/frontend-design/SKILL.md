---
name: frontend-design
description: '界面设计：新建或修改页面、组件、样式时，写代码前调用；定视觉方向、排版、配色，执行可用性硬约束，避开模板化的默认风格。用于：加页面、做界面、改样式、搭设计系统、改版、"做得好看点"。展示页转 showcase-page；动效实现读 web-anim。'
license: Complete terms in LICENSE.txt
---

# Frontend Design

## 上下游

- 前接：需求，或 `dev-plan` 规划中的界面部分。
- 后接：按定下的方向实现（`ponytail`）；动效实现读 `web-anim`；界面文案按 `writing-in-design.md`，中文成稿按 `zh-write`。
- 分流：方向拿不准、需要几种方案对比时，先用 `prototype` 做界面原型；页面本身即作品的展示页（作品集、Awwwards 式单页）由 `showcase-page` 负责全流程，视觉细则回到本技能。
- 写入：设计系统 → `spec/design-system.md`（见 Conformance）。

Based on Anthropic's `frontend-design` skill (Apache-2.0), modified: the Hard constraints section below was added and outranks every preference in the original guidance.

## Hard constraints

**Usability** — first in priority. When it conflicts with visual style, brand expression, or implementation convenience, usability wins.

- Every layout optimizes for ease of operation and simplicity first: frequent actions in one click or one shortcut, sensible defaults in place of choices, undo in place of confirmation for reversible actions, one primary task and one filled primary action per view, advanced options disclosed on demand.
- Design for System 1: a screen is understood at a glance, without reading. Gate every important screen and interaction with the **text-strip test** — remove all text, keep only shape, position, icons, and color — and the user must still tell what the screen is for, what can be acted on, which action is primary, what an action will do (irreversible ones above all), and the current state. A failing design gets redesigned, not more words.
- Means: recurring actions keep fixed positions; buttons follow a three-level hierarchy (filled / outlined / text); important actions pair an icon with the label, irreversible ones always carry an icon, and each icon keeps one meaning; state is shown by shape (spinner, dot, check, cross) with color as a second channel; consequences show before acting (the affected object, a diff preview); an action looks and sits the same on desktop and mobile.
- Text supplements and confirms what shape, position, and icons already say.
- Interaction defaults: feedback first, then the operation (optimistic update, sync in the background); every press gets visible feedback; creating an item opens a dialog in place; options to pick beat fields to type; empty states are designed, not one line of text; one shared motion system for page changes and overlays; at most 3 kinds and 10 operable elements per view, the rest in a menu; internal codes and raw values (slugs, enum values) appear under readable names.

**Conformance**

- In an existing project, use its component library, layout patterns, and visual style. Do not introduce a new visual language without approval.
- Starting from scratch: ask whether to build a design system first (colors, typography, spacing, common components) before building the full interface. When one is built, persist it — `.harness/spec/design-system.md` (registered in `spec/index.md`) if the project carries `.harness/`, else a project-level `design-system.md`. Pick a deliberate direction suited to the product category and audience; if unsure, propose lightweight visual prototypes for comparison.
- Brand-facing pages prefer a distinctive direction over generic safe styles.

**Model defaults**

- A look that appears regardless of subject is a default, not a choice — never let it through. Each model family has its own: Anthropic models drift toward cream/yellow palettes and the Anthropic/Claude site aesthetic; Codex models toward sharp corners, outlined borders, oversized headings, and card-everything layouts; older generations had the purple-pink-blue gradient. Know your family's defaults and spend the freedom elsewhere.
- This user's standing ban list, whatever the brand: star or sparkle "AI" icons; glowing dots, glows, and large-radius gradient buttons; blue-purple or purple-heavy palettes; serif display faces without a subject reason; text standing in for icons or logos; decorative bilingual micro-labels ("HOME BRAIN / 家庭大脑"); slogans and explanatory captions on the interface; unstyled native controls (select, scrollbar, date picker, context menu). The positive default: black and white with a small amount of functional color, quiet hairlines, hierarchy carried by type and spacing.

**Color**

- Brand colors only. Additional colors are derived from the brand color in oklch.
- Never invent arbitrary colors.

**Typography**

- Tasteful fonts appropriate to the subject. No default system fonts, no overused generic typefaces.

**Layout & components**

- Left colored accent-bar cards only when the design context clearly justifies them.

**Data & content**

- Judge the context. Production surfaces of real products: never invent content — no fake metrics, testimonials, features, or components to fill the layout. Demos, prototypes, early development, and visual style tests may use invented data freely. Real copy about the actual product is always allowed.

**Icons & SVG**

- Never use emoji as icons.
- Complex SVGs come from an icon library; never hand-code them, never fake icons with divs/borders/transforms.
- Use the project's icon set. If no suitable icon exists, ask for a source or approval before introducing a new icon style. Keep stroke weight, fill, and sizing consistent across the UI.

These constraints bound the floor, not the ceiling: within them, the guidance below still expects a distinctive, opinionated outcome, not a safe one.

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before – use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. However, sometimes less is more, and extra animation contributes to the feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta accent; (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns. All three are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. Just like a human designer who's hired, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the human's design brief: create a compact token system with color, type, layout, and signature. Color: describe the palette as 4–6 named hex values. Type: the typefaces for 2+ roles (a characterful display face that's used with restraint, a complementary body face, and a utility face for captions or data if needed). Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Signature: the single unique element this page will be remembered by that embodies the brief in an appropriate way.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan exactly and deriving every color and type decision from it.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and a element-based selector like .cta). This can happen often with paddings/margins between sections.

Try to do a lot of this planning and iteration in your thinking, and only show ideas to the user when you have higher confidence it'll delight them.

## Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Not taking a risk can be a risk itself! Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected. Critique your own work as you build, taking screenshots if your environment supports it – a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creators have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

When the work includes writing interface copy — labels, errors, empty states, button text — read [`writing-in-design.md`](writing-in-design.md).

## Done means looked at

UI work is done only after you have rendered it and looked. Screenshot every changed screen (Playwright, a headless browser, or the host's browser tool) in the states that matter: empty, loading, populated, narrow width, dark mode if supported. Check alignment, overflow, clipping, contrast, and the text-strip test; fix what you see, then screenshot again. The report carries the final screenshots. If nothing in the environment can render the page, say so in the report instead of claiming it looks right.
