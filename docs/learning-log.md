# Learning Log

**Tool I chose to learn:** Swagger / OpenAPI (next-swagger-doc + swagger-ui-react)
**Alternative I rejected:** Postman collections
**Note:** Most of the work happened in a few intense sessions on 2026-10-24 and 2026-10-25, as the Git dates show.

---

## Entry 1: Learning Swagger/OpenAPI
- **Date:** 2026-10-25
- **Resources I used:** swagger.io OpenAPI "Basic Structure" page, my own /api-docs page, the /api/doc spec, and AI help. I did not read the other official docs in depth.
- **Learned:** An OpenAPI spec has openapi, info and paths. Each path has methods, and each method has a requestBody and responses by status code. With next-swagger-doc I write this as @swagger comments above each route. createSwaggerSpec collects them from src/app/api into one spec, shown at /api-docs.
- **Confusing:** Why Swagger returned 200 for login while my login page returned 401 for what I thought was the same request (explained below).
- **Problem:** I registered deya@example.com in Swagger, but login on the page kept returning 401 while Swagger showed 200. I suspected cookies, caching and the router. In the end I had been typing deya@gmail.com on the page, an email that was never registered.
- **Fix:** I compared the exact request payloads in Swagger and in the browser.
- **Lesson:** Compare the exact inputs before debugging the code.
- **Another problem:** next build failed because swagger-ui-react had no type definitions. I installed @types/swagger-ui-react.
- **Ratings (1-5):** Basic Structure page 4, Swagger UI "Try it out" 4, AI help 4. Try it out was easiest because I could see results straight away. AI help was very fast at explaining errors, but I gave 4, not 5, because some steps needed correction and I had to run and check every fix myself.

## Entry 2: jose library breaking Jest
- **Date:** 2026-10-25
- **Learned:** Some libraries are ES modules. Jest uses CommonJS and cannot load them unless told to convert them.
- **Problem:** auth.test.ts failed with "Must use import to load ES Module" for jose.
- **Fix:** Added transformIgnorePatterns for jose and allowed .js files in the ts-jest transform.
- **Resource:** Jest error text and AI help

## Entry 3: CI caught errors my tests missed
- **Date:** 2026-10-25
- **Learned:** Jest passing does not mean the build passes. next build checks types more strictly.
- **Problem:** CI failed on 3 type errors in DoctorService and appointment.test.ts.
- **Fix:** Cast dayOfWeek to the schedule type, and narrowed the reschedule input type.
- **Resource:** GitHub Actions log

## Entry 4: Lint error for any
- **Date:** 2026-10-25
- **Learned:** ESLint can forbid any. Casting through unknown is the safe way.
- **Problem:** CI lint failed on "as any" in billRoutes.test.ts.
- **Fix:** Changed it to "as unknown as NextRequest".
- **Resource:** CI log and AI help

## Entry 5: npm ci failing in CI
- **Date:** 2026-10-25
- **Learned:** npm ci needs package.json and package-lock.json to match. swagger-ui-react expects React 18 and I use React 19, so I need legacy-peer-deps.
- **Problem:** CI failed with "Missing: openapi-types from lock file".
- **Fix:** Added .npmrc with legacy-peer-deps=true, ran npm install, and committed the lock file.
- **Resource:** CI log and AI help

## Entry 6: Locked node_modules on Windows
- **Date:** 2026-10-25
- **Learned:** Windows can lock files, so npm and rmdir fail with EPERM or "Access denied".
- **Problem:** npm install dotenv failed, and 8 files in node_modules could not be deleted.
- **Fix:** Deleted node_modules in File Explorer, reinstalled, and used Node's built-in process.loadEnvFile instead of dotenv.
- **Resource:** AI help

## Entry 7: Dev server crash from .next
- **Date:** 2026-10-25
- **Learned:** If the server is down, Selenium gets ERR_CONNECTION_REFUSED.
- **Problem:** npm run dev crashed on a locked .next folder, so all 4 E2E tests failed.
- **Fix:** Deleted .next in File Explorer and restarted. All 4 tests then passed.
- **Resource:** Terminal output

## Entry 8: Merge conflict
- **Date:** 2026-10-25
- **Learned:** A conflict happens when two branches change the same line. I choose what to keep and remove the markers.
- **Problem:** My first attempt used the wrong branch while the real README was not yet merged, so no real conflict happened.
- **Fix:** I redid it: edited the same README line on two branches, merged one, merged main into the other, and resolved the markers (PRs #12 and #13).
- **Resource:** Git output and AI help

## Honest evaluation of my resources
| Resource | Useful for | Limit |
|---|---|---|
| AI assistant (Claude) and coding agent | Explaining errors, giving fixes, drafting code | I had to run and check everything myself; some steps needed correction |
| GitHub Actions logs | Exact failing lines | Only shows problems after I push |
| swagger.io "Basic Structure" page | Understanding paths, requestBody, responses | Only one page; I did not read the rest |
| Swagger UI "Try it out" | Seeing results straight away | Does not replace tests |