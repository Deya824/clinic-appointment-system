# Reflection Essay

## My technical decision

I built a clinic appointment and billing system with Next.js, TypeScript and Firestore. For my new tool I chose Swagger/OpenAPI. The sessional already covered Git, design patterns, testing so I needed something new. My project is built around an API, so documenting it was useful.

I compared Swagger with Postman. Postman is quicker to start and good for manual testing, but its collections live outside the code and can go out of date. Swagger keeps the documentation in comments next to each route. Those comments are reviewed in pull requests and checked by CI like other code. That fit my Git workflow, so I chose it.

I also changed my database early, from MongoDB to Firestore. This was easy because I separated routes, services and repositories. Only the repository layer touches the database. This showed me why layering matters.

## Challenges

The first big challenge was the difference between "tests pass" and "the build passes". My Jest tests passed, but CI failed because next build checks types more strictly. I learned to run the build before pushing.

The second challenge was tooling. The jose library broke Jest because it is an ES module. A lock file mismatch broke npm ci. On Windows, locked files in node_modules stopped npm, and a locked .next folder crashed my dev server, so my first Selenium run failed with "connection refused". These problems taught me to read the error, find the real cause, and fix one thing at a time.

The third challenge was Git. My first merge conflict attempt failed because I used the wrong branch and the real README was not yet merged. I redid it and resolved a real conflict. The mistake taught me more than a perfect first try would have.

I also spent a long time on a 401 error on my login page. Swagger returned 200 for the same request, so I suspected cookies, caching and the router. The real cause was that I had registered deya@example.com but was typing deya@gmail.com. I learned to compare the exact request payloads before debugging the code.

## Evaluating my resources

I used an AI assistant CI logs and error messages. The AI was the fastest for explaining errors, but I could not trust it blindly. Some steps needed correction, and I had to run and check everything. CI logs were the most reliable because they showed the exact failing line.

For Swagger, I read the "Basic Structure" page on swagger.io and learned the rest by using Swagger UI and asking AI. I did not read the official documentation in depth. This was fast, but I may have missed features such as reusable schemas. Next time I will read the official guide first.

AI also helped generate parts of the code, tests and documents. I have declared this in my report, and I can explain what each part does.

## What I learned about my own work

Most of the work happened  24 and 25 October, . The Selenium tests looked finished until I actually ran them and they failed. Now I recheck output before I claim a feature works.My small commits and pull requests also made mistakes easy to find.

## My next skill

My next skill is Docker. Many of my problems came from differences between my Windows machine and the CI server. Docker gives both the same environment. After that I want to learn zod-to-openapi. My Swagger comments are written by hand and are not checked against my real code. This tool would generate the spec from my Zod schemas, so the docs and the code could not disagree.