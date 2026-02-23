# API Keys Setup Guide

This guide walks through obtaining each API key used by the application. All keys are optional — the app runs without them but with reduced functionality.

## Job Board APIs

### JSearch (RapidAPI)

1. Sign up at [rapidapi.com](https://rapidapi.com/)
2. Subscribe to the [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
3. Copy your RapidAPI key from the dashboard
4. Set `RAPIDAPI_KEY` in your `.env`

**Free tier:** 500 requests/month

### Adzuna

1. Register at [developer.adzuna.com](https://developer.adzuna.com/)
2. Create an application to get your App ID and API key
3. Set `ADZUNA_APP_ID` and `ADZUNA_API_KEY` in your `.env`

**Free tier:** 250 requests/day

### Reed

1. Apply for API access at [reed.co.uk/developers](https://www.reed.co.uk/developers/jobseeker)
2. You will receive an API key via email after approval
3. Set `REED_API_KEY` in your `.env`

**Free tier:** Unlimited for job search (rate-limited)

## People Enrichment APIs

### ProxyCurl (LinkedIn Data)

1. Sign up at [proxycurl.com](https://proxycurl.com)
2. Add a payment method (required, ~$0.03 per API call)
3. Copy your API key from the dashboard
4. Set `PROXYCURL_API_KEY` in your `.env`

**Pricing:** Pay-per-use, ~$0.03/call. No free tier (10 free credits on signup).

### Hunter.io (Email Finder)

1. Sign up at [hunter.io](https://hunter.io)
2. Copy your API key from Account > API
3. Set `HUNTER_API_KEY` in your `.env`

**Free tier:** 25 searches/month

### Generated.Photos (AI Headshots)

1. Register at [generated.photos](https://generated.photos)
2. Go to the API section and generate an API key
3. Set `GENERATED_PHOTOS_API_KEY` in your `.env`

**Free tier:** 100 images/month

### Brandfetch (Company Logos) — Optional

1. Sign up at [brandfetch.com](https://brandfetch.com)
2. Generate an API key from your dashboard
3. Set `BRANDFETCH_API_KEY` in your `.env`

**Free tier:** Limited requests/month

---

## Cloud Scheduler (Cron Jobs)

The app has two cron endpoints that should be triggered on a schedule in production. Both require a `CRON_SECRET` environment variable set on Cloud Run.

### Prerequisites

```bash
# Set your project and Cloud Run service URL
PROJECT_ID="clawjob"
REGION="us-central1"
SERVICE_URL="$(gcloud run services describe clawjob --region=$REGION --project=$PROJECT_ID --format='value(status.url)')"
CRON_SECRET="your-cron-secret-here"
```

### Create the scrape job (every 6 hours)

```bash
gcloud scheduler jobs create http clawjob-scrape \
  --project=$PROJECT_ID \
  --location=$REGION \
  --schedule="0 */6 * * *" \
  --uri="${SERVICE_URL}/api/cron/scrape" \
  --http-method=POST \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --time-zone="UTC" \
  --description="Scrape job boards for new listings every 6 hours" \
  --attempt-deadline="300s"
```

### Create the enrich job (every 5 minutes)

```bash
gcloud scheduler jobs create http clawjob-enrich \
  --project=$PROJECT_ID \
  --location=$REGION \
  --schedule="*/5 * * * *" \
  --uri="${SERVICE_URL}/api/cron/enrich" \
  --http-method=POST \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --time-zone="UTC" \
  --description="Enrich pending job listings every 5 minutes" \
  --attempt-deadline="120s"
```

### Verify

```bash
# List scheduled jobs
gcloud scheduler jobs list --project=$PROJECT_ID --location=$REGION

# Manually trigger a job to test
gcloud scheduler jobs run clawjob-scrape --project=$PROJECT_ID --location=$REGION
gcloud scheduler jobs run clawjob-enrich --project=$PROJECT_ID --location=$REGION
```
