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
