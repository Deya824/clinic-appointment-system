# Swagger vs Postman — Comparison and Honest Limits

> **In simple words:** This document compares two tools for documenting and testing APIs, and explains what we learned using Swagger in this project.

---

## What are These Tools?

- **Postman** is a separate desktop app. You manually create a "collection" of requests and test them by clicking buttons.
- **Swagger (OpenAPI)** is a standard format for describing an API. `next-swagger-doc` reads JSDoc comments in our route files and generates the OpenAPI spec automatically. `swagger-ui-react` then shows it as an interactive web page at `/api-docs`.

Think of it this way:
- Postman is like a **handwritten recipe book** — you type every step yourself.
- Swagger is like a **recipe that the chef generates from the actual ingredients** — it stays in sync with the code.

---

## Comparison Table

| Feature | Swagger (next-swagger-doc) | Postman |
|---------|---------------------------|---------|
| **Setup effort** | Write `@swagger` JSDoc blocks in each route file. One-time `/api/doc` route setup. | Import or manually create a collection. No code changes needed. |
| **Sync with code** | **Automatic** — spec is generated from JSDoc at request time. | **Manual** — you must update the collection when routes change. |
| **UI** | Interactive web page at `/api-docs` — click "Try it out" and call real endpoints. | Dedicated desktop GUI with history, environments, and variables. |
| **Authentication testing** | Cookie-based auth works in the browser but Swagger UI cannot easily send httpOnly cookies. Tokens must be pasted manually. | Easy — Postman can store tokens, set cookie headers, and chain requests. |
| **Collaboration** | Anyone with the URL sees the latest docs. | Share by exporting a `.json` collection file. |
| **Team features** | None in the free open-source version. | Workspaces, comments, version history (paid tier for full features). |
| **CI integration** | Spec endpoint (`/api/doc`) can be validated in CI with a JSON schema checker. | Postman has a CLI (`newman`) for running collections in CI. |
| **Learning curve** | Must learn OpenAPI YAML/JSON syntax inside JSDoc comments. | Simple point-and-click UI — very beginner friendly. |
| **Offline use** | Requires the dev server running. | Works fully offline. |

---

## Our Experience with `next-swagger-doc`

### What went well
- The `/api-docs` page is auto-generated. When we add a route and its JSDoc, the docs update immediately — no manual work.
- It is useful for viva demonstrations: open the browser, show the spec, click "Try it out".
- The `@swagger` JSDoc format is readable and lives next to the route code, so it is easy to keep in sync.

### Honest Limits We Found

| Limit | Detail |
|-------|--------|
| **httpOnly cookie auth** | Swagger UI sends requests from the browser. Our JWT is in an httpOnly cookie, so the browser includes it automatically — but only if you first log in through the `/login` page in the same browser session. Swagger's "Authorize" button (Bearer token) does not work for cookie-based auth without extra configuration. |
| **Complex Zod schemas** | `next-swagger-doc` does not automatically read Zod schemas and convert them to OpenAPI. We had to duplicate the schema properties inside the `@swagger` JSDoc comment. This means the JSDoc and the Zod schema can drift apart if not updated together. |
| **No request chaining** | Postman lets you use the response of one request (e.g. a patient ID) directly in the next request. Swagger UI does not. You must copy-paste IDs manually. |
| **No environment variables** | Postman collections can have `{{BASE_URL}}` and switch between dev and production. Swagger always uses the same server URL. |
| **JSDoc verbosity** | Each route needs a long JSDoc block. For 14 routes this is a lot of repetitive YAML-in-comments. |

---

## Verdict

| Situation | Better tool |
|-----------|------------|
| Quick interactive demo during viva | Swagger |
| Complex auth flows (login → use token → next request) | Postman |
| Always in sync with the code | Swagger |
| Beginner learning APIs for the first time | Postman |
| CI validation of the API contract | Both (Swagger spec + Newman) |

For this project, **Swagger was the right choice** as the new tool to learn. It forced us to think about the API contract while writing route files, and produced live documentation that anyone can view in a browser. Postman would be the better choice for advanced testing workflows.
