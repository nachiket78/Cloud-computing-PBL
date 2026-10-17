# Lumen

Lumen is a campus incident desk. Reporters file a case with a photo or PDF. Reviewers move it from Open to Investigating to Resolved and leave a note. Accounts, case records, and the audit log live in Supabase. Evidence files live in a private Storage bucket. The browser never reads that bucket directly.

## Architecture

The React app talks to Supabase Auth for sign-in, then sends the access token to the Express API. The API checks the token and the role, hashes the file, uploads the bytes, and writes the row.

| Lumen piece | Supabase | Syllabus name |
| --- | --- | --- |
| Evidence bucket | Storage, private | Amazon S3 |
| Cases, profiles, audit log | Postgres | Amazon RDS |
| Sign-in | Auth | Amazon Cognito |
| This API | your machine, or any host | a PaaS app on EC2 or Elastic Beanstalk |

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In Authentication → Providers → Email, turn off **Confirm email** so a demo account can sign in immediately.
3. Open the SQL editor and run [supabase/schema.sql](supabase/schema.sql). That creates `profiles`, `incidents`, `audit_log`, the signup trigger, row policies, and the private `evidence` bucket.
4. In Project Settings → API, copy the project URL, the anon key, and the service role key.
5. Create `server/.env`:

```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

6. Create `web/.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=
```

Keep the service role key in `server/.env` only. The variable names are listed again in [.env.example](.env.example).

## Live site on Vercel

In the Vercel project, set:

- Root Directory: empty
- Framework Preset: Other
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `public`

Environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — the secret key from `server/.env`

Redeploy after saving. Evidence files on the live site need to be under 4 MB.

## Run

```
npm install --prefix server
npm install --prefix web
npm run dev
```

The API listens on [http://localhost:4000](http://localhost:4000). The dashboard listens on [http://localhost:5173](http://localhost:5173).

Create one reporter and one reviewer from the signup page. File a report as the reporter, then sign in as the reviewer and change the status. The note is required, and it shows up under Audit.

## What to say in the viva

- **Confidentiality.** The storage bucket has no public policy. A download works only after the API checks the caller, then it returns a signed URL that expires in five minutes.
- **Integrity.** The API computes a SHA-256 hash before upload and stores the hash on the case. The bytes and the hash are in different services, so you can say whether the file still matches.
- **Availability.** The rows and the files stay in the cloud when the laptop is off. If the API process stops, the cloud data is still there; the dashboard just cannot reach it.
- **Auditability.** Status changes are inserts. The app does not edit old audit rows.
- **Access control.** Reporters only receive their own cases. Reviewer routes return 403 for a reporter token.
- **Why the browser does not upload straight to the bucket.** The hash, the role check, and the database row happen in one place. Swapping Storage for S3 later means changing the API upload call, not the screens.

## Limits

There is no email notification, no payment, and no AWS account. Those are future work. A production version would invite reviewers instead of letting signup choose that role.
