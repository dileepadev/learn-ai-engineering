# Phase 4 — Production Quality, Reliability & Safety

**Goal:** Measure AI quality systematically rather than relying on demonstrations; diagnose, monitor, and improve the behavior of production AI systems; and keep them inside clear security, privacy, and permission boundaries.
**You build:** An AI reliability and cost lab around your Phase 3 systems — versioned holdout evaluations with confidence intervals, tracing dashboards, SLOs, failure drills, and red-team tests.
**Effort:** ~90–130 hours (months 7–8).

## Why this phase exists

The difference between a demo and a product is a number you trust: how often it succeeds, what a success costs, how fast it is at p95, and whether anyone outside a tenant boundary can see what they should not. This phase makes those numbers defensible — statistically, operationally, and under attack.

Start with error analysis, not tooling: read real traces before choosing any metric, because metrics should follow the failures you actually find. Then treat every guardrail as a claim to test rather than a control to trust. Evaluation is the core skill of the whole field; this is where it stops being a habit and becomes a release gate.

> **Reading the tags:** untagged items are the core baseline. **[MUST]** essential production skill · **[IMPORTANT]** strong employability advantage · **[SPECIALIST]** deep skill for selected jobs · **[WATCH]** emerging, monitor rather than prioritize.

## 7. AI Evaluation Engineering

### LLM Evaluation

- Error analysis first: read 30–50 real traces, label every failure, and let failure categories emerge before you build any metric
- Correctness, relevance, completeness
- Hallucination and factual consistency
- Instruction following, format compliance
- Safety, toxicity and policy adherence
- LLM-as-a-judge, rubric-based scoring
- **[MUST]** Human-labeled holdouts, judge calibration, inter-rater agreement and contamination/label leakage controls
- **[MUST]** Confidence intervals, bootstrap estimates, sampling bias and meaningful sample sizes
- **[IMPORTANT]** Counterfactual and adversarial test sets, judge disagreement analysis and cost-aware evaluation

### RAG Evaluation

- Retrieval precision, recall, hit rate, MRR, NDCG
- Context relevance
- Faithfulness, groundedness
- Answer relevance, citation accuracy
- End-to-end RAG quality
- **[MUST]** ACL-leakage evals, stale-source evals, citation span verification and negative/unanswerable test cases

### Agent Evaluation

- Task success and goal completion
- Tool selection and argument correctness
- Agent trajectory and step efficiency
- Handoff quality, recovery behavior
- Security and permission compliance
- **[MUST]** Unauthorized side-effect rate, safe-stop behavior, interrupt/approval adherence and tool-boundary tests
- **[IMPORTANT]** Replay-based agent trajectory comparison, step budgets and unnecessary-tool-call frequency

### Evaluation Pipelines

- Golden datasets and test-case generation
- Offline and online evaluation
- Deterministic and model-based checks
- Regression testing
- A/B testing
- Human evaluation and feedback
- Continuous evaluation in CI/CD
- **[MUST]** Statistically defensible release gates with representative slices, CIs and rollback criteria
- **[IMPORTANT]** A/B test design, randomization, power, guardrail metrics, sequential-testing pitfalls and experiment analysis
- **[MUST]** Product KPIs: successful-task rate, human escalation, adoption/retention, time saved and error impact

**Outcome:** Measure AI quality systematically rather than relying on demonstrations.

## 8. AI Observability Engineering

### Distributed Tracing

- LLM request traces
- Retrieval traces
- Tool calls, agent steps, handoffs
- End-to-end execution paths
- Trace correlation and debugging

### Metrics & Monitoring

- Latency: p50, p95, p99
- Tokens and cost per request
- Success and failure rates
- Tool usage and error rates
- Retrieval quality and production quality signals
- **[MUST]** Service-level indicators/objectives (SLI/SLO), error budgets, burn-rate alerts and alert hygiene
- **[IMPORTANT]** Evaluation-based production quality monitoring with privacy-safe sampling and drift/root-cause slices

### Logs & Instrumentation

- Application and API logs
- Tool and agent execution logs
- Structured logging, audit logs
- OpenTelemetry: traces, spans, metrics
- Trace context and semantic conventions
- **[MUST]** Secure tracing: PII filtering, prompt/response retention policy, trace access and correlation IDs
- **[IMPORTANT]** Version-tagged traces for models, prompts, embeddings, indexes, tools and datasets

### Observability Platforms

- LangSmith
- Langfuse
- Arize Phoenix
- OpenTelemetry-based cloud monitoring

### AI Site Reliability Engineering (SRE) · MUST

- Define realistic availability, latency, correctness and dependency SLOs; distinguish user-visible service health from model quality
- Load testing, p95/p99 behavior, saturation, concurrency limits, autoscaling and capacity forecasting
- Provider outage simulation, retrieval/index degradation, queue backlog, timeout budgets and safe fallback
- Incident response, on-call runbooks, rollback drills, backups and recovery objectives (RTO/RPO)
- Cost and usage anomaly detection; rate-limit coordination and abuse incident handling

**Outcome:** Diagnose, monitor and improve the behavior of production AI systems.

## 9. AI Security & Guardrails

### LLM Threats

- Prompt injection and indirect injection
- Jailbreaking
- Data leakage, unauthorized disclosure
- Tool-output manipulation
- Excessive agency and untrusted inputs
- **[MUST]** Treat retrieved content, browser pages, MCP tool output and repository files as untrusted
- **[IMPORTANT]** Agent-specific attack chains: tool confusion, malicious tool metadata, dependency compromise, cross-agent privilege escalation
- **[MUST]** Map threats to current OWASP LLM/GenAI and agentic-security guidance; test mitigations rather than trust guardrails alone
- The dangerous combination: never give one agent access to private data, exposure to untrusted content, and a way to send data out — all three at once

### Data & Application Security

- PII detection and redaction
- Authentication and authorization
- Tenant isolation
- Encryption and secret management
- Input/output validation and guardrails
- **[MUST]** Enterprise SSO, RBAC/ABAC, policy-as-code, delegated identity, row/document-level authorization
- **[MUST]** Privacy engineering: purpose limitation, minimization, retention/deletion, consent, geographic residency and data-flow maps
- **[IMPORTANT]** Data protection impact assessments, provider processing terms and vendor-risk review

### Agent & Tool Security

- Tool permissions and least privilege
- Agent sandboxing
- MCP security
- Restricted execution environments
- Approval gates for sensitive actions
- Rate limiting and abuse prevention
- **[MUST]** Credential isolation per tool/user/tenant, egress controls and strict execution sandboxes
- **[IMPORTANT]** AI supply-chain security: trusted model artifacts, licenses, dataset provenance, SBOM/ML-BOM and artifact signing

### Security Testing

- AI red teaming
- Adversarial evaluations
- Threat modeling
- Audit trails and incident response
- **[MUST]** Security acceptance tests for cross-tenant leaks, ACL bypass, prompt injection and unauthorized side effects
- **[IMPORTANT]** Release review checklists, threat-model updates and evidence preservation

### Responsible AI, Model Risk & Governance · MUST for enterprise AI

- Model/system cards, intended-use boundaries, known limitations, risk registers and owners
- NIST AI RMF and GenAI Profile; ISO/IEC 42001 awareness; emerging AI governance standards
- EU AI Act risk classification, transparency requirements, documentation and human oversight **where applicable**; also check relevant local privacy, consumer, sector and employment laws
- Bias/fairness testing and accessibility for use cases involving people; high-stakes decision escalation
- Audit-evidence generation: dataset/source lineage, model/prompt versions, evaluation results and decision logs
- Vendor/model procurement: licensing, subprocessors, security posture, lock-in, residency, privacy, price and exit plan

**Outcome:** Deploy AI applications that operate within clear security, privacy, and permission boundaries.

## Hands-on project: AI reliability and cost lab

Retrofit the Phase 3 RAG system and agent: load-test them, give them provider fallback and SLOs, drill their failures, measure cost per successful task, and write the rollback report.

1. **Error analysis:** run 50+ realistic queries through both systems, read every trace, and write a taxonomy of the top failure modes with counts.
2. **Evaluation suite:** a versioned, human-labeled holdout set aimed at those failures — code checks where they work, a rubric-based LLM judge where they do not — reported with bootstrap confidence intervals and per-slice breakdowns. Cover RAG (ACL leakage, stale sources, citation spans, unanswerable questions) and agents (unauthorized side effects, approval adherence, trajectories).
3. **Judge calibration:** hand-label 30+ outputs, measure judge–human agreement, and tune the rubric until you would trust it with a release.
4. **Release gate:** CI runs the suite on every prompt, model, or pipeline change and blocks a release that falls outside the gate; prove it by shipping a plausible regression and watching it get caught.
5. **Tracing and SLOs:** OpenTelemetry traces across retrieval, generation, and every agent step, version-tagged and PII-filtered; dashboards for p50/p95/p99, cost per successful task, error rates, and tool usage; SLOs with error budgets and a burn-rate alert.
6. **Failure drills:** load-test to saturation, simulate a provider outage, degrade the index, and back up the queue; confirm the fallbacks hold, then write the runbook and a postmortem for one drill.
7. **Security:** a threat model and data-flow map; red-team tests (direct and indirect prompt injection, cross-tenant probes, ACL bypass, unauthorized side effects) added to the suite as acceptance tests; a risk register with owners.

**Stretch:** design an online A/B test with a power calculation and guardrail metrics; or write a model/system card for the Phase 3 RAG system.

## Exit criteria

- [ ] I can report my system's success rate with a confidence interval and explain why the sample size is enough
- [ ] My LLM judge is calibrated against human labels, and I can state how often it agrees with them
- [ ] CI has blocked one of my own changes because the evaluation gate caught a regression
- [ ] I can trace one request end to end — retrieval, generation, every agent step — with model and prompt versions attached
- [ ] I have SLOs with an error budget, and a burn-rate alert that has fired in a drill
- [ ] I ran a provider-outage drill and a rollback drill, and wrote the runbook and a postmortem
- [ ] My security acceptance tests cover prompt injection, cross-tenant leaks, ACL bypass, and unauthorized side effects, and they pass
- [ ] I can map my system's threats to OWASP's LLM and agentic-security guidance and name the control that covers each
