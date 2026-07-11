# Product Strategy: Dark Launch Scout

## Critical Verdict

This is a startup-grade validation MVP, not proof of product-market fit. It becomes a real product only if target users repeatedly use it during live operational decisions and trust the output enough to copy, share, or act on it.

## Ideal Customer Profile

- Team: SaaS or platform engineering team running Cloud Run, GitHub PRs, CI, and incident/release workflows.
- Buyer: Head of Engineering, Platform Lead, SRE Manager, or DevOps owner.
- Daily user: release manager, incident commander, on-call engineer, reviewer, or platform engineer.
- Urgent pain: dark launch readiness scout decisions require scattered evidence and are still made by whoever happens to be online.

## Job To Be Done

When hidden traffic, flag readiness, launch watchpoints create ambiguity, the user wants to turn raw operational evidence into a decision, owner, verification command, and shareable comment before the window closes.

## Wedge Hypothesis

If Dark Launch Scout can make one high-pressure hidden traffic decision faster and easier to explain, teams will first use it as a review/incident assistant, then ask for deeper integrations with GitHub, Cloud Logging, Cloud Monitoring, Slack, and audit storage.

## Activation Metric

A user reaches activation when they run an analysis and then copies a comment, exports a report, downloads JSON, or submits useful feedback in the same session.

## Retention Metric

Weekly retained team usage: at least three operational decisions per week from the same team, with at least one copied/exported artifact and one feedback event.

## Pricing Hypothesis

- Starter: free or low-cost single service/team workspace for validation.
- Team: paid per engineering team once GitHub/Cloud integrations and audit history are connected.
- Enterprise: SSO, retention controls, policy approvals, and centralized reporting.

## Two-Week Validation Plan

1. Recruit five teams with active release or incident pain.
2. Ask each team to bring one real recent decision and one upcoming decision.
3. Measure time-to-first-verdict, copied artifacts, feedback score, and whether the output changed the human conversation.
4. Interview users within 24 hours after each use.
5. Keep the product only if it earns repeat usage without the builder present.

## No-Go Or Pivot Criteria

- Users treat the output as a demo summary and do not copy or share it.
- Decisions require integrations before anyone will use the workflow.
- The team does not trust AI-generated evidence enough to put it in PRs, incident channels, or runbooks.
- The product saves less than ten minutes or does not reduce coordination load.

## Instrumentation

The app emits structured product events to `POST /api/events` for:

- `analysis_started`
- `analysis_completed`
- `analysis_failed`
- `feedback_submitted`
- `github_pr_collected`
- `copy_comment`
- `copy_markdown`
- `download_json`

In Cloud Run, these events appear in structured logs and can be exported to BigQuery or a product analytics system.
