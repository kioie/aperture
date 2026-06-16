# Aperture Growth Plan — 30-Day Launch

## Positioning

**One sentence:** Aperture is the tool that opens only the code your agent needs.

**The upstream context story:**
- Compression tools (quantize, summarize) run *after* the context is bloated
- Aperture runs *before* — it's upstream context selection, not downstream compression
- You never read the files you didn't need
- Citations make it auditable: the agent (and you) can see exactly why each file was included

**Stack story with Facet:**
Aperture and Facet are complementary, independently useful tools. Aperture bundles *code context* before the agent reads files. Facet routes *MCP tool schemas* under a token budget. They can be used together or separately — no dependency either way.

---

## Viral hooks

### Hook 1: The 98% reduction
> "Your agent just read 47,000 tokens of code to fix a 50-line bug. Aperture did it in 443."

Before/after numbers are the most shareable thing in developer tooling. The eval output is reproducible — anyone can run `npm run eval` and see 6/6. Make this the first thing in the README, the first tweet, the HN Show comment.

### Hook 2: Agents have a reading problem
> "We've given agents tools to search and read. We never gave them a tool that knows what to read."

This is the conceptual hook. It reframes the problem as architectural, not incidental. Resonance + cohesion packing is novel enough to warrant a blog post.

### Hook 3: One command, zero install
> "npx aperture demo" — runs in 5 seconds, no repo needed, shows exactly what it does.

The demo command is the killer friction-reducer. Anyone can try it from a tweet. The tree output is visually scannable and shareable as a screenshot.

---

## 30-Day Calendar

### Week 1: Foundation (Days 1–7)

**Day 1 — Repo goes public**
- [ ] `gh repo edit kioie/aperture --visibility public`
- [ ] Add GitHub topics (done in this sprint)
- [ ] Pin eval/results.md in README

**Day 2 — First distribution**
- [ ] Post to r/LocalLLaMA: "I built a tool that stops coding agents from over-reading"
  - Lead with the 47k → 443 token number
  - Link to `npx aperture demo`
  - Include terminal screenshot
- [ ] Post to r/programming: same angle, more algorithm detail

**Day 3 — HN Show HN**
```
Show HN: Aperture – budget-aware code bundles that stop agents from over-reading

Coding agents read too many files. When I profile Cursor/Claude Code on a simple
bug fix, I often see 30–50 file reads before the first edit. Most are noise.

Aperture is an MCP server + CLI that replaces recursive file reads with a single
aperture_focus() call. It builds a symbol graph, scores nodes by task relevance
(personalized propagation — like PageRank but for code), then packs the highest-
utility symbols under a token budget with cited line ranges.

Demo: npx aperture demo (no repo needed, 5 seconds)
Eval: 6/6 tasks correctly surface the right files, 443 tokens vs ~47k

Would love feedback on the algorithm and real-world task strings that break it.
```

**Day 4 — Twitter/X thread**
```
Tweet 1: Your coding agent read 47,000 tokens to fix a 50-line bug. Here's why — and a fix.

Tweet 2: When you run `aperture focus "fix login validation"` it:
  1. Builds a symbol graph (imports, calls, containment)
  2. Seeds nodes from task words
  3. Runs personalized propagation across the graph
  4. Packs highest-utility symbols under your budget
  Result: src/auth/login.ts:1-8 — 54 tokens, not 2,100

Tweet 3: [screenshot of demo output with tree format]

Tweet 4: It's MCP-native. Cursor, Claude Code, Codex — one JSON snippet.
  npx aperture demo to try it without a repo.
  npx aperture focus "your task" --format tree on yours.
  github.com/kioie/aperture

Tweet 5: The eval suite (6/6): [screenshot of eval results]
```

**Day 5 — Dev.to / Hashnode post**
Title: "Why your coding agent reads 40 files to fix a 10-line bug (and how to stop it)"
- Problem: agents over-read as default behavior
- What resonance scoring does differently vs. grep/glob
- Before/after token comparison with reproducible commands
- The MCP integration story
- CTA: try `npx aperture demo`

**Day 6 — Discord seeding**
Post in:
- Cursor Discord #general or #tools
- Claude Discord #developer-tools
- Latent Space Discord #tools-and-products
- AI Engineer Discord

**Day 7 — npm publish check**
- [ ] Verify `npm publish` worked and `npx aperture` works cold
- [ ] Check npx cache warmup time (should be < 3s)

---

### Week 2: Community & Integration (Days 8–14)

**Day 8 — Cursor forum post**
Title: "Aperture MCP: give Cursor a budget-aware context lens before it reads files"
- Post in Cursor community forum
- Include the `aperture cursor` one-liner
- Screenshot of tree output

**Day 9 — Claude.ai / Anthropic forums**
- Post in Claude developer community
- Focus on the `claude mcp add` story
- Include the CLAUDE.md snippet from integrations/claude-code.md

**Day 10 — GitHub Action story**
- Tweet/post the `integrations/github-action.yml`
- Angle: "Add Aperture to your PR reviews — your code review bot gets cited context bundles automatically"
- This is a B2B hook that reaches engineering teams

**Day 11 — Blog post: the algorithm**
Title: "Resonance scoring: how Aperture finds the right code for an agent task"
- Explain seed → resonate → pack without jargon
- Include a worked example (the login validation case)
- Publish on personal blog + cross-post to dev.to

**Day 12 — llms.txt ecosystem**
- Submit to llms.txt directory (llmstxt.org or similar registries)
- The llms.txt in the repo is the discovery artifact for LLM crawlers

**Day 13 — GitHub Awesome lists**
Submit PRs to:
- awesome-mcp-servers
- awesome-llm-apps
- awesome-cursor (if exists)
- awesome-claude-code (if exists)

**Day 14 — Week 2 retrospective**
- Check GitHub stars (target: 100+)
- Check npm weekly downloads
- Identify top referrers from GitHub insights
- Read all issues/comments and respond

---

### Week 3: Depth & Credibility (Days 15–21)

**Day 15 — Real-world eval expansion**
- Add 3–5 more eval fixtures against a real open-source repo (not sample-repo)
- Run `aperture index` on a popular repo (e.g., zod, commander) and add eval cases
- Update results.md with expanded score

**Day 16 — "Wrong selection" bug bounty**
- Twitter/HN post: "Tell me a task string that breaks Aperture — I'll fix it and credit you"
- This drives engagement, generates eval cases, and positions you as quality-focused

**Day 17 — Video demo**
- Record a 2-minute terminal recording (asciinema or similar)
- Show: `aperture demo`, `aperture focus <task> --format tree`, Cursor MCP in action
- Embed in README and SHOWCASE.md
- Post to Twitter and YouTube

**Day 18 — Cursor extension idea**
- Prototype or mock a Cursor sidebar showing the bundle tree
- Even a design mockup gets engagement ("would you use this?")

**Day 19 — Latent Space / TWIML outreach**
- Email or DM asking if Aperture fits their "tools and products" coverage
- Lead with the eval numbers and the novel algorithm angle

**Day 20 — Stack Overflow / GitHub Discussions**
- Answer questions about "how to reduce token usage in coding agents"
- Link to Aperture where genuinely relevant

**Day 21 — Blog post: "The citation standard"**
Title: "Why your coding agent should cite its sources (and how to make it)"
- Broader argument: agents that cite line ranges are more trustworthy and auditable
- Aperture as the tool that enforces this pattern
- Cross-post to dev.to, Hashnode

---

### Week 4: Amplification (Days 22–30)

**Day 22 — npm 1.0 prep**
- [ ] Cut v1.0.0 with changelog
- [ ] Update package.json version
- [ ] Create GitHub Release with formatted notes
- [ ] npm publish

**Day 23 — ProductHunt launch**
Title: "Aperture — open only the code your agent needs"
Tagline: Budget-aware cited code bundles for Cursor, Claude Code, and any MCP client
- Lead with the demo GIF
- First comment: the before/after token comparison
- Ask community for upvotes day-of

**Day 24 — HN second round**
- If first HN post got traction, post a follow-up: "Aperture 3 weeks later: what we learned from wrong selections"
- This is the "lessons learned" angle that HN likes

**Day 25 — Integration PRs**
Submit PRs to:
- Cursor docs (add Aperture to "community MCP servers")
- Anthropic docs (add to Claude Code integrations)

**Day 26 — Conference / meetup circuit**
- Submit talk proposals to local AI/dev meetups
- Title: "Context-first coding agents: stop reading before you start"

**Day 27 — Partnership outreach**
- Reach out to Cursor, Codeium, Continue.dev teams
- Angle: "We built an MCP tool your users are asking for — want to feature it?"

**Day 28 — npm stats milestone post**
- If > 1000 weekly downloads: post the number with a thank-you
- Social proof drives more social proof

**Day 29 — Docs polish sprint**
- Fill any gaps discovered from issues/comments
- Add FAQ based on most common questions
- Update SHOWCASE.md with real-world examples from community

**Day 30 — Retrospective post**
Title: "30 days of Aperture: numbers, learnings, and what's next"
- Stars, downloads, top eval improvements, top community contributions
- Roadmap for v0.2 (LSP adapters, more languages, streaming)

---

## Key metrics to track

| Metric | Day 7 target | Day 30 target |
|--------|-------------|---------------|
| GitHub stars | 50+ | 500+ |
| npm weekly downloads | 100+ | 2,000+ |
| GitHub issues | 5+ | 30+ |
| Eval score | 6/6 | 10/10+ |
| Community PRs | 0 | 3+ |

---

## Messaging cheat sheet

**For HN:** Lead with reproducible eval numbers. Show the algorithm. Invite wrong-selection reports.

**For Twitter:** Lead with the before/after token comparison. Include terminal screenshot. Link to `npx aperture demo`.

**For Reddit (r/LocalLLaMA):** Lead with the practical problem. Show the MCP JSON snippet. Keep it short.

**For Cursor/Claude communities:** Lead with the one-liner setup. Show the workflow. Don't over-sell.

**For engineering blogs:** Lead with the algorithm. The resonance + cohesion-pack story is technically interesting and hasn't been written about.

---

## What NOT to do

- Don't spam multiple communities on the same day
- Don't over-claim accuracy ("always finds the right files") — the eval shows 6/6 on the test suite, not universal perfection
- Don't position as a competitor to editors or agents — it's a complement
- Don't mention budget compression or summarization tools as competitors — different problem
