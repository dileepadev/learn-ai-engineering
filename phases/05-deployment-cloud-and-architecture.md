# Phase 5 — Deployment, Cloud & Architecture

**Goal:** Build repeatable, tested, and maintainable AI delivery pipelines; deploy complete AI systems on one cloud platform with the ability to adapt the architecture to others; and design production AI systems from measurable requirements and sound engineering trade-offs.
**You build:** Your Phase 3–4 systems deployed to one cloud from Infrastructure as Code, with gated CI/CD, canary releases with automated rollback, FinOps dashboards, runbooks, and a written architecture that defends its trade-offs.
**Effort:** ~90–130 hours (months 9–10).

## Why this phase exists

Running AI in production is mostly operations: immutable deployments, canaries that roll themselves back, budgets that stop a runaway tenant, and an architecture you can defend with numbers. Pick one cloud and go deep — the concepts transfer, and the other two become a mapping exercise rather than new material.

Start with managed containers or serverless; reach for Kubernetes only when requirements justify the complexity. And treat design as economics as much as engineering: cost per completed workflow, build vs buy, managed vs self-hosted inference. The architecture write-up at the end of this phase is the document an interviewer will want to argue with — make every box earn its place.

> **Reading the tags:** untagged items are the core baseline. **[MUST]** essential production skill · **[IMPORTANT]** strong employability advantage · **[SPECIALIST]** deep skill for selected jobs · **[WATCH]** emerging, monitor rather than prioritize.

## 10. AI Operations (AI/LLMOps)

### Development & Delivery

- GitHub Actions and CI/CD
- Docker, container registries
- Infrastructure as Code
- Kubernetes fundamentals
- Automated testing and deployments
- **[MUST]** IaC workflows, environment parity and immutable deployments; artifact attestations and vulnerability gates
- **[IMPORTANT]** Data orchestration (Airflow/Dagster/Prefect) vs agent orchestration (LangGraph) vs durable business workflows (Temporal)

### AI Artifact Management

- Model versioning
- Prompt versioning
- Dataset versioning
- Experiment tracking
- Evaluation result tracking
- Reproducible builds and releases
- **[IMPORTANT]** MLflow model/experiment registry, deployment approvals and dataset lineage across training/GenAI lifecycles
- **[SPECIALIST]** Traditional MLOps: feature stores, training pipelines, serving schemas, concept/data drift and point-in-time correctness

### Production Operations

- Model and application deployment
- Staging, canary releases, rollbacks
- Scaling and load balancing
- Reliability, alerting and monitoring
- Incident handling and disaster recovery
- Cost and resource optimization
- **[MUST]** FinOps: per-request/tenant usage, cost per successful outcome, spend quotas, model/provider budgets
- **[IMPORTANT]** Load/capacity plans, GPU unit economics, compute reservation and autoscaling break-even analysis
- **[IMPORTANT]** Automated rollback triggers using safety, task quality, latency, errors and cost

### Continuous Improvement

- Production feedback collection
- Failure analysis and dataset updates
- Evaluation-driven prompt/model changes
- Controlled retraining or fine-tuning
- Drift monitoring and regression prevention
- **[IMPORTANT]** Internal AI platform golden paths: common model gateways, permissions, evaluation hooks, observability and deployment templates
- **[SPECIALIST]** Kubernetes-native model serving and platform services (KServe, Ray, Kubeflow) when scale warrants complexity

**Outcome:** Build repeatable, tested and maintainable AI delivery pipelines.

## 11. Cloud AI Engineering

### Common Cloud Fundamentals

- IAM, networking, VPCs
- Object storage, managed databases
- Containers, serverless computing
- Queues and event-driven services
- Monitoring and cost management
- **[MUST]** Private networking, encryption keys/KMS, audit logs, workload identity and data residency boundaries
- **[IMPORTANT]** Managed inference/model gateways, artifact registries, GPU quotas and cross-region continuity

### AWS

- Amazon Bedrock
- Amazon SageMaker AI
- ECS, EKS, Lambda
- S3, RDS, ElastiCache
- CloudWatch, IAM
- **[IMPORTANT]** Amazon Bedrock AgentCore production agent patterns; managed evaluation/guardrails, if AWS chosen

### Microsoft Azure

- Microsoft Foundry
- Azure AI Search
- Azure Kubernetes Service (AKS)
- Azure Functions, Blob Storage
- Azure Monitor, Azure identity services
- **[IMPORTANT]** Enterprise Entra ID, agent governance and evaluation/monitoring in Microsoft Foundry, if Azure chosen

### Google Cloud

- Vertex AI, Gemini
- Cloud Run, Google Kubernetes Engine (GKE)
- Cloud Storage, BigQuery
- Pub/Sub, Cloud Monitoring
- **[IMPORTANT]** Gemini Enterprise Agent Platform (the 2026 evolution of Vertex AI) and managed agent operations, if GCP chosen

### Enterprise Data & AI Platforms · IMPORTANT

- Know the role of Databricks/Snowflake/BigQuery in governed enterprise AI; choose one if target roles use it
- Lakehouse data governance, catalog/lineage, access policy propagation and batch/stream processing
- Platform capability comparisons: managed retrieval/search, model registry, AI gateways, evals, tracing and cost reporting

**Outcome:** Deploy complete AI systems using one cloud platform, with the ability to adapt the architecture to others.

## 12. AI System Design & Architecture

### Architecture Decisions

- Business requirements and system boundaries
- Functional and non-functional requirements
- Model and provider selection
- **[MUST]** Model economics and provider procurement: SLA, licensing, privacy, export/exit, vendor risk, regional availability
- RAG vs fine-tuning
- Agents vs deterministic workflows
- Single-agent vs multi-agent systems
- Database and vector-store selection

### System Design

- API and service architecture
- Data and knowledge pipelines
- Event-driven architecture
- Message queues, background workers
- State management and caching
- Multi-tenancy and access control
- **[MUST]** Cross-region/data-residency planning; tenant-scoped search, caching, tracing and secrets
- **[MUST]** Distributed systems failure modes and workflow boundary decisions; idempotency by design
- **[IMPORTANT]** Build-vs-buy, managed vs self-hosted inference, and internal platform vs product-team ownership

### Quality Attributes

- Reliability, fault tolerance, scalability
- Security, privacy and compliance
- Observability and maintainability
- Latency and throughput optimization
- Cost engineering
- Disaster recovery and failure handling
- **[MUST]** Capacity plans, load-test results and SLO evidence; budget vs model-quality trade-offs
- **[MUST]** Business metrics: ROI/TCO, adoption, time saved, cost per completed workflow and human-review costs
- **[IMPORTANT]** Energy/GPU efficiency metrics and responsible resource consumption

**Outcome:** Design production AI systems based on measurable requirements and sound engineering trade-offs.

## Hands-on project: deploy it for real

Take the Phase 3 systems, with their Phase 4 evaluations and dashboards, to a production-like deployment on one cloud.

1. **Pick one cloud** and write down why; everything below targets it.
2. **Infrastructure as Code:** network, workload identity (no long-lived keys), secrets in a managed vault with KMS-backed encryption, managed Postgres, object storage, a queue, and container hosting — all in Terraform/OpenTofu, with staging and production built from the same code.
3. **CI/CD:** build once, sign and attest the image, scan it for vulnerabilities, run the Phase 4 evaluation gate, deploy to staging, smoke-test, then promote the same immutable artifact to production.
4. **Releases:** canary releases with automated rollback triggered by safety, task-quality, latency, error, or cost regressions; prove it by shipping a bad prompt and watching it roll back.
5. **Managed AI services:** add the cloud's managed model platform as one provider route, and compare its managed search service against your own retrieval on the Phase 3 golden set.
6. **FinOps:** per-tenant usage attribution, spend quotas, model and provider budgets, and a dashboard of cost per successful outcome.
7. **Architecture write-up:** a diagram and design document covering requirements, SLOs, a capacity plan built from load-test results, data residency, multi-tenancy, build-vs-buy per component, and ROI/TCO — plus a mapping of every box to its equivalent on the other two clouds.
8. **Runbooks and recovery:** runbooks for provider down, cost spike, quality drop, and region or dependency failure, plus a restore-from-backup drill with measured RTO and RPO.

**Stretch:** an optional self-hosted inference route with vLLM behind the same gateway, with a benchmark and an honest cost comparison against the hosted routes.

## Exit criteria

- [ ] My system runs on one cloud, built entirely from Infrastructure as Code, with staging and production from the same code
- [ ] CI/CD builds one signed, scanned artifact, gates it on evaluations, and promotes it unchanged from staging to production
- [ ] A canary release has rolled itself back on a quality or cost regression I introduced
- [ ] I can state cost per successful outcome per tenant from a dashboard, and spend quotas stop a runaway tenant
- [ ] I can map every box in my architecture to its AWS, Azure, and Google Cloud equivalent, with a build-vs-buy opinion per box
- [ ] I can defend RAG vs fine-tuning, agent vs workflow, single- vs multi-agent, and managed vs self-hosted inference with numbers from my own systems
- [ ] I ran a restore drill and know my RTO and RPO
