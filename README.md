# Followup

**Your waiting room advocate.**

Followup is a mobile app for the person *accompanying* a patient to the emergency
room. While you wait — and you will wait — it interviews you about what you've
observed, then generates a timestamped, plain-language observation record you can
show to the triage nurse or provider, copy, share, or export as a PDF.

> The provider will ask one question. We'll help you answer the ones they didn't.

## Why this exists

Someone I love went to the ER unable to walk. She arrived in a wheelchair. The
medical record said she was ambulatory. Her severe cervical spinal cord compression
was initially attributed to anxiety, because her psychiatric history was the first
thing in her chart and nobody asked the person standing next to her — who had
watched her legs give out, helped her into the car, and pushed the wheelchair —
what actually happened.

The companion in the ER waiting room is an eyewitness with an hour of dead time
and no role. Followup gives them the role: capture what you saw, in the words
that matter, timestamped *before* the provider encounter — so the record reflects
what happened, not what a template assumed.

## What it does

- **12 chief-complaint categories** (trauma, abdominal, cardiac, breathing,
  pediatric, elderly, neurological, seizure, allergic reaction, overdose,
  psychiatric-with-possible-organic-cause, and a catch-all) — 190+ questions
- **Branching interviews** in plain language, one question at a time, with voice
  input — designed to be completed in 8–15 minutes under stress
- **Real-time red flags**: if an answer indicates something time-critical (stroke
  signs, anaphylaxis, seizure over 5 minutes), the app pauses and says so —
  *tell the triage nurse now, don't wait*
- **A timestamped observation record** organized by section, with specific
  documentation requests for the provider — show it, copy it, share it, or
  export a PDF
- **Draft resume** if you're interrupted, and locally saved records

## What it is not

Followup does not diagnose, triage, or give medical advice. It organizes and
documents a companion's observations. Every question traces to a validated
clinical decision rule, a national triage standard, or a documented judgment
call — see [docs/clinical-grounding.md](docs/clinical-grounding.md).

## Privacy

Records never leave the phone. No accounts, no backend, no analytics, no data
collection — the app makes zero network requests of its own (even the offline
indicator reads connectivity state from the OS). Storage is local
(AsyncStorage); sharing happens only through the OS share sheet, at the user's
explicit request. Voice input uses the device's
speech recognition service, which on some platforms processes audio off-device —
typing is always available instead. See [docs/privacy-policy.md](docs/privacy-policy.md).

## Development

React Native + Expo (expo-router). No backend.

```bash
npm install
npm start          # Expo dev server
npm run validate   # verify the question graph (branch targets, reachability,
                   # termination, red-flag alert integrity) — run after any
                   # change to lib/questions.ts
npx tsc --noEmit   # typecheck
```

The interview content lives in `lib/questions.ts`; the branching engine in
`lib/engine.ts`; summary generation in `lib/summary.ts`. When changing questions,
update `docs/clinical-grounding.md` in the same commit — every question should
trace to a source or a documented judgment call.

## License

See [LICENSE](LICENSE).
