# AWS Cost Estimate

Date basis: `April 29, 2026`

Region assumption for estimate: `Europe (Ireland) eu-west-1`

Why this region:

- it is a common low-latency, well-supported AWS region for South African-facing systems
- the AWS App Runner pricing page explicitly lists Europe (Ireland) pricing

## Recommended Production Stack for Costing

- Frontend: static frontend on `S3 + CloudFront`
- API: `.NET 8` on `AWS App Runner`
- Database: `PostgreSQL on Amazon RDS`
- Documents: `Amazon S3`
- Email: `Amazon SES`
- Encryption keys: `AWS KMS`
- Security: `AWS WAF`
- Monitoring: `CloudWatch`

## Official AWS Pricing Inputs Used

- App Runner: provisioned memory `$0.007 / GB-hour`, active compute `$0.064 / vCPU-hour`, active memory `$0.007 / GB-hour` in Europe (Ireland)  
  Source: https://aws.amazon.com/apprunner/pricing/
- App Runner example for a lightweight API: `$25.50/month` for `1 vCPU / 2 GB` under light daily traffic  
  Source: https://aws.amazon.com/apprunner/pricing/
- SES outbound email: `$0.10 / 1,000 emails` plus `$0.12 / GB` attachments  
  Source: https://aws.amazon.com/ses/pricing/
- KMS customer-managed key: `$1/month` per key  
  Source: https://aws.amazon.com/kms/pricing/
- AWS WAF example: one Web ACL with rules and 20 million requests is shown at `$25/month`  
  Source: https://aws.amazon.com/waf/pricing/
- CloudFront flat-rate plan page currently lists `Free $0/month` and `Pro $15/month` plans  
  Source: https://aws.amazon.com/cloudfront/pricing/
- S3 pricing is pay-as-you-go by storage, requests, and data transfer; the pricing page confirms no minimum charge and shows Europe (Ireland) internet egress example at `$0.09 / GB`  
  Source: https://aws.amazon.com/s3/pricing/

## Important Cost Note

`RDS PostgreSQL` is the biggest variable. The official pricing page is strongly calculator-driven and depends on:

- instance class
- Single-AZ vs Multi-AZ
- storage type and size
- backup retention
- region

Because of that, I recommend presenting RDS as a range unless you decide the exact topology up front.

## Scenario 1: Demo / Pilot Environment

Use case:

- stakeholder demo
- limited internal testing
- not public at scale

Estimated monthly range:

- Frontend hosting and CDN: `$0 to $15`
- App Runner API: `$10 to $30`
- RDS PostgreSQL small instance: `$35 to $80`
- S3 documents and exports: `$2 to $10`
- SES email: `$1 to $5`
- KMS keys: `$2 to $5`
- CloudWatch logs/alerts: `$5 to $15`
- WAF: optional for demo, `$0 to $25`

Estimated total:

- `about $55 to $185 per month`

## Scenario 2: Lean Production

Use case:

- real applicants
- around 5 staff reviewers
- moderate document uploads
- live for one application season

Estimated monthly range:

- Frontend hosting and CDN: `$15 to $30`
- App Runner API: `$25 to $60`
- RDS PostgreSQL: `$70 to $160`
- S3 documents, exports, and downloads: `$10 to $30`
- SES email: `$5 to $20`
- KMS keys: `$3 to $8`
- CloudWatch logs/alerts: `$10 to $25`
- WAF: `$25 to $40`

Estimated total:

- `about $163 to $373 per month`

## Scenario 3: Recommended Production with More Safety Margin

Use case:

- stronger availability expectations
- heavier audit retention
- more storage and monitoring
- room for traffic spikes

Estimated monthly range:

- Frontend hosting and CDN: `$15 to $40`
- App Runner API: `$40 to $100`
- RDS PostgreSQL with more headroom or HA: `$150 to $350`
- S3 documents and exports: `$15 to $50`
- SES email: `$10 to $30`
- KMS keys: `$4 to $10`
- CloudWatch logs/alerts: `$15 to $40`
- WAF: `$25 to $60`

Estimated total:

- `about $274 to $680 per month`

## Seasonal Annual Cost

If the system is active for `4 months` per year and kept in low-cost retention mode for the other `8 months`:

### Lean production annual estimate

- Active season: `4 x $163 to $373 = $652 to $1,492`
- Off-season reduced footprint: `8 x $40 to $120 = $320 to $960`
- Total annual infrastructure: `about $972 to $2,452`

### Recommended production annual estimate

- Active season: `4 x $274 to $680 = $1,096 to $2,720`
- Off-season reduced footprint: `8 x $70 to $180 = $560 to $1,440`
- Total annual infrastructure: `about $1,656 to $4,160`

## Maintenance and Support Pricing

A fixed monthly maintenance fee is recommended for ongoing monitoring, security updates, and general support.

- **Maintenance Fee:** `R4,500 / month` (including VAT)
- **Bug Fixes:** Included at no additional cost. Developer-related errors are not billed.
- **Support Window:** Email and dashboard support for applicants and staff during the active cycle.
- **Change Requests:** New feature requests outside the original scope will be quoted separately.

## Recommendation for Stakeholder Proposal

Use these numbers in the proposal (South African Rand, including VAT and POPIA implementation):

- **Development Build (Total):** `R120,000 to R130,000`
- **Monthly Hosting:** `R2,000 to R5,200` (depending on scale)
- **Fixed Maintenance:** `R4,500 / month`

That is realistic enough for early stakeholder approval and ensures all compliance and support needs are met without hidden costs for developer errors.
