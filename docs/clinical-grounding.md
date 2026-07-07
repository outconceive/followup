# Clinical Grounding — Followup Question Library

This document maps every interview category in `lib/questions.ts` to the validated clinical
decision rules, triage standards, and red-flag guidance it is cross-referenced against.
It exists so that the question library is auditable: anyone — clinician, advocate, or
contributor — can check what each question is *for* and what evidence base it traces to.

**Last cross-referenced:** July 2026

## What this app is, and is not

Followup helps a companion organize and timestamp their **observations** for the provider.
It does not diagnose, triage, or give medical advice. The urgent lines it generates are
framed as documentation requests to the provider ("please evaluate for…"), never as
instructions to the patient or companion. The clinical rules below are used to decide
*which questions are worth asking* — the questions collect exactly the history items those
rules score — not to compute or display any score or disposition.

## Methodology model

The library's structure — chief-complaint-based branching question sets designed to be
answered without a physical exam — follows the model of the **Schmitt-Thompson telephone
triage protocols** (the nurse-line standard; pediatric version published as Barton Schmitt,
*Pediatric Telephone Protocols*, AAP). No Schmitt-Thompson content is copied; the protocols
are licensed. They are cited here as the structural precedent.

Two EMS history mnemonics audit the preamble and cross-category coverage:

- **SAMPLE** (Signs/Symptoms, Allergies, Medications, Past history, Last oral intake,
  Events leading up) — the preamble collects allergies, age, and last oral intake;
  every category collects symptoms, medications, relevant history, and events.
- **OPQRST** (Onset, Provocation, Quality, Radiation, Severity, Time) — the pain-oriented
  categories (cardiac, abdominal, trauma) collect onset, radiation, severity, and timing.

## Per-category grounding

### 🧠 Neurological (`neurological`)
- **BE-FAST** (Balance, Eyes, Face, Arm, Speech, Time — [Cleveland Clinic](https://health.clevelandclinic.org/be-fast-stroke),
  [Mayo Clinic](https://newsnetwork.mayoclinic.org/discussion/recognize-the-sudden-warning-signs-of-stroke-and-be-fast/)):
  the one-sided-weakness triage question routes into face droop (`neuro_stroke_face`),
  speech (`neuro_stroke_speech`), vision (`neuro_stroke_vision`), and time last known well
  (`neuro_stroke_last_normal`). Balance is covered by `neuro_balance` in the main flow.
  Time last known well is asked because it determines thrombolysis eligibility.
- **Cauda equina red flags**: bowel/bladder dysfunction (`neuro_bowel_bladder`) generates
  an URGENT cord-compression line.
- **Spinal epidural abscess triad** (fever + spine pain + neuro deficit): `neuro_fever`
  plus the neck-pain questions.
- **Cervical myelopathy pattern** (the founding case): hand/arm clumsiness
  (`neuro_hands_arms`), gait/balance, neck symptoms, prior imaging context.

### ❤️ Cardiac (`cardiac`)
- **AHA heart attack warning signs**: pain radiation to jaw/arm/back
  (`cardiac_pain_radiation`), sweating/pallor/dyspnea (`cardiac_appearance` multichoice).
- **Wells criteria / PERC rule** for pulmonary embolism
  ([MDCalc Wells](https://www.mdcalc.com/calc/115/wells-criteria-pulmonary-embolism),
  [MDCalc PERC](https://www.mdcalc.com/calc/347/perc-rule-pulmonary-embolism)):
  `cardiac_pe_risk` collects the companion-reportable factors — surgery/immobilization
  within 4 weeks, prior DVT/PE, leg swelling, cancer/treatment within 6 months,
  hormone use, long travel.
- Onset question nudges for a clock time (symptom-onset time anchors troponin timing
  and STEMI pathways).

### 🫁 Breathing (`breathing`)
- **NHS severity markers**: can't speak in full sentences, cyanosis (bluish lips),
  accessory muscle use, tripod positioning (`br_appearance`).
- **Wells/PERC**: `br_pe_risk` (same factor set as cardiac) plus hemoptysis
  (`br_cough_blood`) — a Wells and PERC criterion.
- Choking/foreign-body pathway (`br_choking`), asthma/COPD + inhaler response
  (`br_lung_history`), infectious context (`br_fever_cough`).

### 💫 Seizure (`seizure`)
- **Status epilepticus** — ≥5 minutes of seizure or recurrence without recovery is the
  operational emergency definition ([Epilepsy Foundation](https://www.epilepsy.com/complications-risks/emergencies/status-epilepticus),
  [StatPearls/NIH](https://www.ncbi.nlm.nih.gov/books/NBK430686/)): `seiz_over_five`
  generates an URGENT line.
- Witness description drives seizure classification (focal vs. generalized onset:
  one side vs. whole body, staring spells, eye deviation, cyanosis, incontinence,
  tongue biting — `seiz_features`) and the post-ictal state (`seiz_after`).
- First seizure vs. known epilepsy with missed medication (`seiz_first_time` branch),
  provocation factors (alcohol, sleep deprivation, illness — `seiz_before_episode`),
  and head impact during the event.
- **Eclampsia**: possible pregnancy (`seiz_pregnancy`) generates an URGENT line —
  a seizure in pregnancy is an obstetric emergency.

### 🤢 Abdominal (`abdominal`)
- **NHS emergency red flags for abdominal pain** ([nhs.uk/conditions/stomach-ache](https://www.nhs.uk/conditions/stomach-ache/)):
  sudden severe pain (`abd_severity`), tenderness/rigidity (`abd_tender`), blood or
  coffee-ground vomit (`abd_vomit_blood`), bloody or black tarry stool (`abd_blood_stool`),
  can't urinate / can't pass stool or gas / diabetic and vomiting (`abd_red_flags`).
- **Ectopic pregnancy**: possible pregnancy (`abd_pregnancy`) generates a workup-request line.
- Pain-location choices map to the classic differentials (RUQ/gallbladder,
  epigastric, RLQ/appendix with migration, LLQ/diverticulitis).

### 🐝 Allergic reaction (`allergic`)
- **NHS anaphylaxis criteria** ([nhs.uk/conditions/anaphylaxis](https://www.nhs.uk/conditions/anaphylaxis/)):
  throat/tongue swelling, breathing difficulty, blue/grey/pale skin, faintness
  (`all_symptoms`); rapid onset after exposure (`all_speed`).
- Epinephrine timing and response (`all_epi`) — including the case where symptoms
  return after a dose, which the NHS flags for a second dose and which providers
  need documented.

### 💊 Overdose / poisoning (`overdose`)
- Toxicology history essentials: substance, estimated dose (pill-count method),
  **time of ingestion** (drives acetaminophen nomograms and charcoal windows),
  co-ingestion of alcohol, evidence to physically bring.
- Respiratory depression and unresponsiveness (`od_state`) generate URGENT lines;
  naloxone given and response (`od_naloxone`).
- **Poison Control 1-800-222-1222** (free, 24/7 — [poisonhelp.org](https://www.poisonhelp.org/))
  is printed on every overdose summary.
- Intentionality is asked because it changes the clinical pathway (psychiatric hold,
  safety assessment) — the provider must know.

### ⚡ Psychiatric with possible organic cause (`psychiatric_organic`)
- Built around **diagnostic overshadowing** — the founding failure mode of this app.
  The category's structure (baseline episode pattern → what is different this time)
  gives the provider the comparison a chart cannot.
- Top organic mimics screened: recent head injury (`psych_head_injury` — subdural),
  substance use *and withdrawal* (`psych_substances` — delirium tremens),
  fever/infection (`psych_fever` — delirium, encephalitis), medication changes,
  new focal signs (speech `psych_speech`, gait `psych_gait`).

### 👶 Pediatric (`pediatric`)
- **AAP fever guidance** ([healthychildren.org](https://www.healthychildren.org/English/health-issues/conditions/fever/Pages/When-to-Call-the-Pediatrician.aspx)):
  fever ≥100.4°F (38°C) in an infant under 3 months triggers an urgent summary line
  (age comes from the preamble).
- **NHS meningitis signs** ([nhs.uk/conditions/meningitis](https://www.nhs.uk/conditions/meningitis/)):
  non-blanching rash — the glass test — (`ped_rash_detail` asks whether it fades under
  pressure), stiff neck, photophobia, bulging fontanelle, high-pitched cry, cold
  hands/feet (`ped_meningitis_signs`). Rash + fever generates an URGENT line.
- **NHS pediatric sepsis flags** ([nhs.uk/conditions/sepsis](https://www.nhs.uk/conditions/sepsis/)):
  grunting/labored breathing (`ped_breathing`), hard to wake (`ped_sleeping`),
  reduced wet diapers (`ped_dehydration`).
- **PECARN head-injury predictors** ([WikEM summary](https://wikem.org/wiki/EBQ:PECARN_Pediatric_Head_CT_Rule)):
  the parent-reportable predictor "not acting normally per parent" is `ped_different`;
  a child with head trauma should use the **trauma** category, which collects LOC,
  vomiting, and mechanism severity.
- Dehydration markers (wet diapers, tears, dry mouth, sunken fontanelle) and
  toddler ingestion screening (`ped_ingestion`).

### 🤍 Elderly (`elderly`)
- **Fall + anticoagulation = intracranial bleed until proven otherwise**:
  `elder_blood_thinners` is asked unconditionally; fall + blood thinners generates
  an URGENT line. (Note: the Canadian CT Head Rule *excludes* anticoagulated
  patients precisely because they can't be cleared clinically.)
- **NHS sepsis flags in the elderly** ([nhs.uk/conditions/sepsis](https://www.nhs.uk/conditions/sepsis/)):
  new confusion (`elder_confusion`), rapid/labored breathing (`elder_breathing`),
  fever/urinary symptoms (`elder_uti_fever`), reduced or absent urination
  (`elder_urination` — the NHS ≥18h flag); breathing + confusion/fever generates
  a sepsis-consideration line, and barely/no urination generates its own.
- **Delirium workup drivers**: baseline cognition vs. now (the companion is the only
  reliable source for this), medication changes, UTI symptoms, reduced intake,
  "last time they were their normal self" (`elder_last_normal` — critical for
  patients living alone).

### 🩹 Trauma (`trauma`)
- **Canadian CT Head Rule** ([MDCalc](https://www.mdcalc.com/calc/608/canadian-ct-head-injury-trauma-rule)):
  ≥2 vomiting episodes (`trauma_vomiting`), amnesia for the event (`trauma_amnesia`),
  dangerous mechanism — fall >3 ft or >5 stairs, pedestrian struck, ejected
  (`trauma_mechanism`), age ≥65 (preamble), anticoagulation (`trauma_blood_thinners`,
  which also *excludes* the rule and forces imaging consideration).
- **NEXUS c-spine criteria** ([MDCalc](https://www.mdcalc.com/calc/703/nexus-criteria-c-spine-imaging)):
  midline neck pain (`trauma_neck_back` → spinal-precautions line), altered alertness
  (`trauma_alertness_now`), intoxication (`trauma_intoxication`), focal deficit
  (`trauma_movement`).
- Witnessed vs. found-down pathways; LOC; visible bleeding.

### 📋 Something else (`general`)
- The catch-all applies the SAMPLE/OPQRST skeleton generically: event, onset, course,
  direct observations, change from baseline, pain, fever, possible pregnancy,
  intake/function, urination (`gen_urination` — NHS sepsis flag), conditions,
  medications, prior episodes, primary concern.
- It exists so no companion hits a dead end; its summary emphasizes the two things
  that matter in every encounter — *direct observations* and *change from baseline*.

## Known gaps and judgment calls

Documented deliberately, so they are decisions rather than accidents:

1. **No scoring.** The app collects the inputs to rules like Wells or PECARN but never
   computes them. Scoring is clinical judgment and would move the app toward being a
   medical device.
2. **Duration parsing.** Free-text durations (seizure length, fever duration) are not
   parsed; the explicit `seiz_over_five` question exists because the 5-minute threshold
   is too important to leave to parsing.
3. **The infant-fever heuristic** in the summary keys off the age text containing
   "week"/"month"/"newborn" and the fever answer not starting with "no". It can
   under-trigger; the fever answer itself always appears in the summary regardless.
4. **Pregnancy** is asked in abdominal, seizure, and general — the categories where it
   changes the emergency differential (ectopic, eclampsia). It is deliberately not
   asked in every category to keep interviews short.
5. **Urination** is asked in elderly, general (adults; the NHS flag is no urination
   for ~18h), and pediatric (wet diapers). Not asked in the acute-event categories
   (trauma, allergic, overdose) where it is rarely companion-observable.
6. **No positioning/first-aid advice** (e.g., NHS anaphylaxis "lie flat, don't stand").
   Giving in-the-moment care instructions is out of scope by design — the app documents;
   it does not direct care. Two deliberate exceptions, both referrals rather than
   advice: surfacing the Poison Control number, and the real-time red-flag alerts
   (`urgentAlert` on ~10 time-critical questions — stroke signs, cord compression,
   status epilepticus, anaphylaxis, respiratory depression, declining alertness,
   meningitis signs, severe breathing distress) which pause the interview to say
   "tell the triage nurse now." Alerting on-site staff is always safe.
7. **Estimate minutes** per category are rough and have not been re-timed since the
   question count grew.

## Maintenance

When adding or changing questions, update this file in the same commit: state which
rule or guidance the question traces to, or add it to the judgment-calls list. If a
cited rule is updated (e.g., a new AHA/AAP guideline), re-verify the mapped questions.
