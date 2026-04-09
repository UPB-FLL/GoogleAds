# Google Ads Policy Guard

A starter Next.js GUI for drafting Google Ads with local policy checks before submission.

This project is aimed at businesses like a brewery/taproom that need safer ad workflows. It is built to **reduce policy risk**, not to bypass or hide policy-sensitive content.

## What it does

- Draft headlines and descriptions in a simple GUI
- Choose campaign mode:
  - Food / Pizza / Lunch / Private Events
  - Brewery Brand / Taproom
  - Beer Release / Beer Menu
  - Mixed
- Block or warn on risky copy
- Warn on alcohol-forward landing pages for food-first campaigns
- Block common audience mistakes for alcohol-related campaign modes
- Optionally attempt a Google Ads **validate-only** call when credentials are present

## Local rules included

- Blocks obviously unsafe alcohol phrasing
- Warns on alcohol-heavy terms in food-first campaigns
- Blocks remarketing, Customer Match, and custom segments for alcohol-related modes in this starter app
- Warns on long headlines/descriptions and editorial-looking formatting
- Scans the destination page for alcohol and food/event signals

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Fill these in only if you want to test the server-side Google Ads validate-only call:

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
```

## Important production note

The validate-only route currently includes **placeholder ad group wiring**. Before using this in production, connect:

- real customer selection
- real campaign selection
- real ad group selection
- stored drafts and auth
- approval status polling and logging

## Suggested next steps

- Add login
- Save drafts to a database
- Add multi-user approvals
- Add campaign and ad group pickers from the Google Ads API
- Add more precise landing-page text extraction
- Add change history and policy decision logs
