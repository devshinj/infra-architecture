# Task 5 report: explain API

Implemented POST and GET /api/diagrams/[id]/explain.
Files: src/app/api/diagrams/[id]/explain/route.ts, tests/integration/explain-route.test.ts.

- POST: auth 401, JSON content-type and zod body ({targetKind: node|edge, targetId, instruction?}) else 400, explainTarget with signal=request.signal. NotFoundError 404, ValidationError 400 (message passed through), other errors 500. Returns the ExplainResult JSON with 200 (including ok:false).
- GET: auth 401, listSignatures, NotFoundError 404.
- Deps: explainTarget resolves defaultChatDeps() itself, so setChatDepsForTest works.
- runtime nodejs, dynamic force-dynamic, maxDuration 150 (the chat route sets none).

TDD: RED = test file failed on missing route module import. GREEN = 4/4 (owner-only, bad body, post returns explanation, get returns signatures).
Suites: npm test 399 pass; tsc clean; lint 0 errors (6 pre-existing warnings); test:int 92 pass. LF endings.
Concern: 401 for no session is also enforced by the route itself (middleware not relied on).
