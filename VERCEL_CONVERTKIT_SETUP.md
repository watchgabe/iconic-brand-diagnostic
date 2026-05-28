# Vercel + ConvertKit setup

This project is now ready for `fscreative.live` on Vercel.

## What changed

- The quiz still runs as a static front-end in `index.html`.
- The capture form now sends the full diagnostic payload to `/api/subscribe`.
- `/api/subscribe` is a Vercel serverless function at `api/subscribe.js`.
- The API route creates/updates the subscriber in Kit, adds them to a Kit form, and optionally tags them.
- The workbook still unlocks instantly on-page even if email delivery fails.

## Vercel environment variables

Add these in Vercel:

```txt
KIT_API_KEY=your_kit_v4_api_key
KIT_FORM_ID=your_kit_form_id
KIT_TAG_ID=optional_tag_id
```

Use `Production`, `Preview`, and `Development` if you want the same behavior everywhere.

Do not put these values in `index.html`. They belong only in Vercel environment variables.

## Kit custom fields to create

Create these custom fields in Kit before going live if you want the email to include the personalized answers.

```txt
iconic_result_category
iconic_total_score
iconic_first_gap
iconic_first_move
iconic_dimension_scores
iconic_workbook_markdown
```

If these fields do not exist, the serverless route will still subscribe the person to the form, but it will return `custom_fields_saved: false`. The user will still get the workbook on the page, but the Kit email will not have the personalized fields.

## Recommended Kit email

Subject:

```txt
Your Iconic Brand Diagnostic
```

Body:

```txt
Hey {{ subscriber.first_name }},

Your result: {{ subscriber.iconic_result_category }}

Score: {{ subscriber.iconic_total_score }}
First gap to fix: {{ subscriber.iconic_first_gap }}

Your first move:
{{ subscriber.iconic_first_move }}

Scorecard:
{{ subscriber.iconic_dimension_scores }}

Here is the working doc:

{{ subscriber.iconic_workbook_markdown }}

If you want to lock this in with me, book a 30-minute strategy call:
https://calendly.com/golocalgroup/watchgabe?month=2026-05

Or learn more about the brand build:
https://fscreative.live/

Gabe
```

If Kit uses a different merge-tag format for your account, insert these same custom fields through the editor's personalization menu instead of typing them manually.

## Local test

Without Vercel env vars, the page will still unlock the workbook and show this message:

```txt
Workbook unlocked here. Email delivery will work once this is running on Vercel with Kit env vars.
```

Once deployed on Vercel with env vars, submit a test email and check:

- Subscriber appears in Kit.
- Subscriber is added to the configured form.
- Custom fields populate.
- The incentive/email sequence sends the result and workbook.

## Files that matter

```txt
index.html
api/subscribe.js
VERCEL_CONVERTKIT_SETUP.md
```
