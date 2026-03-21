# Agent Instructions

- Do not run `npm run build` after every change.
- Do not run `npx nuxi typecheck` ever.
- Only run `npm run build` when explicitly requested by the user.

## Purpose

This document defines structural, architectural, and behavioral rules for AI agents and contributors operating within this Nuxt 3 codebase.

All generated or modified code MUST conform strictly to this document.

---

# 1. Framework & Runtime

- Framework: Nuxt 3
- Rendering mode: SSR (unless otherwise specified in nuxt.config.ts)
- Language: TypeScript (strict mode enabled)
- API Layer: Nitro (server/)
- State Management: Pinia
- Styling: (Define here — e.g., TailwindCSS / SCSS / CSS Modules)

Agents must:

- Use Vue 3 Composition API exclusively.
- Use `<script setup lang="ts">`.
- Never use Options API.
- Never introduce Vue 2 patterns.
- Prefer auto-imported Nuxt utilities where available.
- Keep components stateless where possible.
- Never used nested ternary operators

---

# 2. Project Structure (Strict)

The following Nuxt 3 directory structure must be respected:

.
├─ app.vue
├─ nuxt.config.ts
├─ assets/
├─ components/
├─ composables/
├─ layouts/
├─ middleware/
├─ pages/
├─ plugins/
├─ public/
├─ server/
│ ├─ api/
│ ├─ middleware/
│ └─ utils/
├─ stores/
├─ types/
└─ utils/

No undocumented top-level directories may be introduced.

---

# 3. Directory Responsibilities

## /pages

- Defines route-based views (file-based routing).
- Must not contain reusable business logic.
- Data fetching must use:
    - useAsyncData()
    - useFetch()
- May import composables and stores.
- Avoid large components; extract to /components when reusable.

Example:

pages/
├─ index.vue
├─ users/
│ ├─ index.vue
│ └─ [id].vue

Rules:

- No direct $fetch calls outside useAsyncData/useFetch.
- No inline API logic.
- No global state mutation outside stores.

---

## /components

- Pure UI components.
- No direct API calls.
- No business logic.
- Communicate via props and emits only.
- Must be reusable and isolated.

Structure recommendation:

components/
├─ base/
├─ ui/
└─ feature/

Naming:

- PascalCase
- Base components prefixed with Base (BaseButton.vue)
- Feature components grouped by domain

---

## /layouts

- Layout wrappers only.
- Must use <slot />.
- No data fetching.
- No domain logic.

---

## /composables

- Encapsulated reusable logic.
- Must follow naming convention: useX().
- May call APIs.
- May access runtime config.
- Must be side-effect aware.
- Should not manipulate DOM directly.

Example:

useAuth.ts
useUsers.ts
usePagination.ts

Rules:

- Return typed objects.
- Avoid hidden global state.
- Keep composables single-responsibility.

---

## /stores

- Pinia stores only.
- One domain per store.
- Strongly typed state.
- No direct API calls inside components — use composables.

Example:

stores/
├─ auth.store.ts
├─ user.store.ts

Rules:

- Use defineStore().
- State must be a function.
- Avoid complex logic inside getters.

---

## /server

Contains Nitro server code only.

Client-side code must never import from /server.

---

### /server/api

- API route handlers.
- Must validate input.
- Must return typed responses.
- Must handle errors explicitly.
- No UI imports.

Examples:

server/api/users.get.ts
server/api/users.post.ts

Rules:

- Use defineEventHandler().
- Validate body/query params.
- Never expose internal errors directly.

---

### /server/middleware

- Server request middleware only.
- Used for:
    - Authentication
    - Logging
    - Request shaping

---

### /server/utils

- Server-only helpers.
- No client imports.
- No Vue imports.

---

## /middleware

- Route middleware only.
- Must be client-safe.
- Used for:
    - Auth guards
    - Redirect logic
    - Access control

---

## /plugins

- App-level initialization.
- Must declare mode if client/server specific.
- Keep plugins minimal and focused.

Example:

plugins/
├─ auth.client.ts
├─ api.ts

---

## /types

- Shared TypeScript types.
- No runtime logic.
- Domain-driven organization encouraged.

Example:

types/
├─ user.ts
├─ api.ts

---

## /utils

- Pure utility functions.
- No Vue-specific logic.
- No side effects.
- Must be framework-agnostic.

---

# 4. Data Fetching Rules

Allowed:

- useAsyncData()
- useFetch()
- $fetch inside composables only

Disallowed:

- Direct API calls inside components.
- Calling server handlers directly.

All API responses must:

- Be typed.
- Return consistent envelope shape (define if needed).
- Handle errors gracefully.

---

# 5. State Management Rules

- Global state must live in Pinia.
- No ad-hoc reactive global exports.
- No cross-store mutation.
- Stores must remain domain-isolated.

---

# 6. Naming Conventions

Files:

- kebab-case for directories
- PascalCase for components
- camelCase for composables (useX)
- snake_case not allowed

Server routes:

- users.get.ts
- users.post.ts
- users/[id].get.ts

---

# 7. Code Quality Requirements

Agents must:

- Use strict TypeScript.
- Avoid `any`.
- Avoid implicit any.
- Avoid unnecessary watchers.
- Prefer computed over watch where possible.
- Avoid duplicated logic.
- Extract reusable logic to composables.

---

# 8. Error Handling

- Server must use proper HTTP status codes.
- Client must handle loading + error states.
- No silent failures.
- No console.log in production code.

---

# 9. Security Rules

- Validate all server inputs.
- Never trust client payload.
- Never expose secrets.
- Use runtimeConfig for environment variables.
- Avoid leaking stack traces.

---

# 10. Prohibited Patterns

- Vue 2 syntax
- Options API
- Direct DOM manipulation
- Business logic inside components
- Cross-layer imports (client importing server)
- Global mutable singletons outside Pinia
- Unvalidated server handlers

---

# 11. Agent Behavioral Contract

When generating or modifying code, agents must:

1. Respect folder boundaries.
2. Preserve architectural consistency.
3. Refactor instead of duplicating logic.
4. Maintain strict typing.
5. Avoid introducing unnecessary dependencies.
6. Prefer composability over inheritance.
7. Keep files cohesive and single-responsibility.
8. Respect file naming conventions as well as for variables.

# 12. Naming Conventions

This project follows consistent casing conventions depending on context.

## PascalCase

**Format**

```text
UserProfile
BlogPostCard
AuthLoginForm
```

**Used for**

- Vue components
- TypeScript types
- TypeScript interfaces
- Classes

**Examples**

```text
components/UserProfile.vue
components/blog/BlogPostCard.vue
```

```ts
interface UserProfileData {}
type ApiResponse = {};
```

## camelCase

**Format**

```text
userProfile
getUserData
isAuthenticated
```

**Used for**

- Variables
- Functions
- Composables
- Reactive refs
- Computed values

**Examples**

```ts
const userProfile = ref(null)

function fetchUserData() {}

const isLoggedIn = computed(() => ...)
```

## kebab-case

**Format**

```text
user-profile
blog-post-card
auth-login-form
```

**Used for**

- File names
- Component tags in templates
- Routes
- CSS classes

**Examples**

```text
components/user-profile.vue
components/blog/blog-post-card.vue
pages/blog/my-first-post.vue
```

```vue
<blog-post-card />
```

```css
.user-profile-card {
}
```

## snake_case

**Format**

```text
user_profile
created_at
api_response
```

**Used for**

- API responses
- Database fields
- External backend data structures

**Examples**

```text
user_id
created_at
updated_at
```

## Quick Reference

| Context               | Case       |
| --------------------- | ---------- |
| Components            | PascalCase |
| Variables / Functions | camelCase  |
| Files / Routes        | kebab-case |
| CSS Classes           | kebab-case |
| API / Database fields | snake_case |

If a request conflicts with this document, this document takes precedence unless explicitly overridden.

## Pull Request Instructions

When creating a pull request:

- ALWAYS use the template defined in `.github/pull_request_template.md`
- The template is the single source of truth
- DO NOT invent, reformat, or restructure the PR description
- DO NOT skip any sections

Execution rules:

1. Read `.github/pull_request_template.md`
2. Reproduce its structure exactly
3. Only replace placeholder values (e.g. `<user_type>`, `<what changed>`)
4. Preserve all headings, spacing, and formatting exactly as written

Formatting rules:

- Markdown must render correctly on GitHub
- Lists must remain properly formatted (no collapsed lines)
- Sections must remain separated by blank lines
- Do not convert structured sections into paragraphs

Content rules:

- Context must be brief and non-technical (1–2 sentences)
- Fix must be brief and clear (1–2 sentences)
- Use plain language (e.g. "This happened because X and Y")

Failure handling:

- If `.github/pull_request_template.md` cannot be read or is missing:
    - STOP
    - Do NOT generate a PR body
    - Ask for clarification instead

- If using `gh pr create`:
    - DO NOT use `--body` with inline text
    - Prefer default template loading or `--body-file`

Strict rule:

- Any PR that does not follow the template exactly is invalid

---

End of AGENTS.md
