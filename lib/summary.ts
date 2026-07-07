import { getCategoryById, preambleQuestions } from './questions';
import { Question } from './types';

export function generateSummary(
  categoryId: string,
  answers: Record<string, string>
): string {
  const category = getCategoryById(categoryId);
  if (!category) return '';

  const companion = answers['companion_name'] || 'Companion';
  const relationship = answers['relationship'] || 'companion';
  const patient = answers['patient_name'] || 'the patient';
  const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const allQuestions = [...preambleQuestions, ...category.questions];
  const categoryQuestions = category.questions;

  const sections = new Map<string, string[]>();

  for (const question of categoryQuestions) {
    const answer = answers[question.id];
    if (!answer) continue;

    const section = question.section;
    if (!sections.has(section)) {
      sections.set(section, []);
    }

    if (answer === 'Skipped' || !answer) continue;
    const line = formatAnswerLine(question, answer, patient);
    if (line) {
      sections.get(section)!.push(line);
    }
  }

  let summary = '';
  summary += '═══════════════════════════════════════\n';
  summary += '   COMPANION OBSERVATION RECORD\n';
  summary += '═══════════════════════════════════════\n\n';
  summary += `Generated: ${timestamp}\n`;
  summary += `Companion: ${companion} (${relationship})\n`;
  const age = answers['patient_age'];
  summary += `Patient: ${patient}${age && age !== 'Skipped' ? `, age ${age}` : ''}\n`;
  const allergies = answers['allergies'];
  if (allergies && allergies !== 'Skipped') {
    summary += `Known medication allergies: ${allergies}\n`;
  }
  const lastIntake = answers['last_oral_intake'];
  if (lastIntake && lastIntake !== 'Skipped') {
    summary += `Last ate or drank: ${lastIntake}\n`;
  }
  summary += `Presenting concern: ${category.label}\n\n`;

  for (const [sectionName, lines] of sections) {
    summary += `── ${sectionName.toUpperCase()} ──\n`;
    for (const line of lines) {
      summary += `• ${line}\n`;
    }
    summary += '\n';
  }

  summary += '── COMPANION REQUESTS ──\n';
  summary += generateRequests(categoryId, answers, patient);
  summary += '\n';

  summary += '───────────────────────────────────────\n';
  summary += `This record was generated at ${timestamp},\n`;
  summary += 'before the provider encounter, based on\n';
  summary += `observations reported by ${companion}.\n`;
  summary += 'It is a record of companion observations,\n';
  summary += 'not medical advice or a diagnosis.\n';
  summary += '───────────────────────────────────────\n';

  return summary;
}

function formatAnswerLine(
  question: Question,
  answer: string,
  _patient: string
): string {
  if (answer === 'Skipped' || !answer) return '';

  const cleanText = cleanQuestionText(question.text);

  if (question.answerType === 'yesno') {
    return answer === 'Yes' ? cleanText : `${cleanText}: No`;
  }

  const truncated = answer.length > 200
    ? answer.substring(0, 200) + '...'
    : answer;

  return `${cleanText}: ${truncated}`;
}

function cleanQuestionText(text: string): string {
  return text
    .replace(/\?$/, '')
    .replace(/\(.*?\)/g, '')
    .replace(/—.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateRequests(
  categoryId: string,
  answers: Record<string, string>,
  patient: string
): string {
  const requests: string[] = [];

  switch (categoryId) {
    case 'neurological': {
      if (answers['neuro_sides']?.startsWith('One side')) {
        const strokeSigns = [
          answers['neuro_stroke_face'] === 'Yes' ? 'facial droop' : '',
          answers['neuro_stroke_speech'] === 'Yes' ? 'speech changes' : '',
          answers['neuro_stroke_vision'] === 'Yes' ? 'vision changes' : '',
        ].filter(Boolean);
        if (strokeSigns.length > 0) {
          requests.push(`• URGENT: One-sided weakness with ${strokeSigns.join(', ')} — please evaluate for stroke immediately`);
        }
        if (answers['neuro_stroke_last_normal']) {
          requests.push(`• Time last known well, per companion: ${answers['neuro_stroke_last_normal']}`);
        }
      }
      if (answers['neuro_fever'] === 'Yes') {
        requests.push(`• Companion reports fever or recent infection alongside weakness — please consider spinal infection in the workup`);
      }
      if (answers['neuro_bowel_bladder'] === 'Yes') {
        requests.push(`• URGENT: Companion reports bowel/bladder dysfunction — please evaluate for cord compression emergency`);
      }
      if (answers['neuro_weight_bearing'] === 'No') {
        requests.push(`• Please document that ${patient} was unable to bear weight on arrival`);
      }
      if (answers['neuro_wheelchair'] === 'Yes') {
        requests.push(`• Please document that ${patient} arrived by wheelchair`);
      }
      if (answers['neuro_hands_arms'] === 'Yes') {
        requests.push(`• Companion reports upper extremity involvement — hand/arm weakness or clumsiness`);
      }
      if (answers['neuro_last_normal']) {
        requests.push(`• Please document that companion reports ${patient} last walked normally: ${answers['neuro_last_normal']}`);
      }
      if (answers['neuro_imaging'] === 'Yes' && answers['neuro_imaging_detail']) {
        requests.push(`• Please note prior imaging context: ${answers['neuro_imaging_detail']}`);
      }
      break;
    }
    case 'cardiac': {
      if (answers['cardiac_consciousness'] === 'Yes') {
        requests.push(`• Please document that ${patient} lost consciousness, as witnessed by companion`);
      }
      if (answers['cardiac_pain_radiation'] === 'Yes') {
        requests.push(`• Companion reports pain radiation to: ${answers['cardiac_radiation_where'] || 'see details above'}`);
      }
      if (answers['cardiac_prior_heart']) {
        requests.push(`• Companion reports cardiac history: ${answers['cardiac_prior_heart']}`);
      }
      if (answers['cardiac_pe_risk'] && !answers['cardiac_pe_risk'].includes('None of these') && !answers['cardiac_pe_risk'].includes("I'm not sure")) {
        requests.push(`• Companion reports blood clot risk factors: ${answers['cardiac_pe_risk']}`);
      }
      break;
    }
    case 'psychiatric_organic': {
      requests.push(`• Companion specifically reports this presentation is different from ${patient}'s usual psychiatric episodes`);
      if (answers['psych_speech'] === 'Yes') {
        requests.push(`• Companion reports speech changes — please evaluate for neurological cause`);
      }
      if (answers['psych_gait'] === 'Yes') {
        requests.push(`• Companion reports gait/movement changes — please evaluate for neurological cause`);
      }
      if (answers['psych_physical_symptoms']) {
        requests.push(`• Please evaluate the following physical symptoms that companion reports are new: ${answers['psych_physical_symptoms']}`);
      }
      if (answers['psych_head_injury'] === 'Yes') {
        requests.push(`• Companion reports recent head injury — please rule out intracranial cause before attributing symptoms to psychiatric history`);
      }
      if (answers['psych_substances']?.startsWith('Yes — recently stopped')) {
        requests.push(`• Companion reports recent cessation of alcohol or substances — please consider withdrawal`);
      }
      if (answers['psych_fever'] === 'Yes') {
        requests.push(`• Companion reports recent fever or infection — please consider organic/infectious cause of behavior change`);
      }
      if (answers['psych_concern']) {
        requests.push(`• Companion's primary concern: ${answers['psych_concern']}`);
      }
      break;
    }
    case 'pediatric': {
      if (answers['ped_rash'] === 'Yes' && answers['ped_fever']) {
        requests.push(`• URGENT: Parent reports rash with fever — please evaluate for meningococcal disease`);
      }
      const infantAge = /\b(week|month|newborn)/i.test(answers['patient_age'] || '');
      const feverReported = answers['ped_fever'] && !/^(no|none)/i.test(answers['ped_fever'].trim());
      if (infantAge && feverReported) {
        requests.push(`• Note: per AAP guidance, fever of 100.4°F (38°C) or higher in an infant under 3 months warrants immediate evaluation — parent reports: ${answers['ped_fever']}`);
      }
      if (answers['ped_meningitis_signs'] && !answers['ped_meningitis_signs'].includes('None of these')) {
        requests.push(`• URGENT: Parent reports possible meningitis signs — please evaluate: ${answers['ped_meningitis_signs']}`);
      }
      if (answers['ped_dehydration'] && !answers['ped_dehydration'].includes('None of these')) {
        requests.push(`• Parent reports possible dehydration signs: ${answers['ped_dehydration']}`);
      }
      if (answers['ped_ingestion'] && !answers['ped_ingestion'].startsWith('No')) {
        requests.push(`• Parent reports possible ingestion of a harmful substance — please evaluate: ${answers['ped_ingestion']}`);
      }
      if (answers['ped_breathing'] && answers['ped_breathing'] !== 'Breathing looks normal') {
        requests.push(`• Parent reports respiratory distress: ${answers['ped_breathing']}`);
      }
      if (answers['ped_cant_do']) {
        requests.push(`• Please document functional change reported by parent: ${answers['ped_cant_do']}`);
      }
      if (answers['ped_concern']) {
        requests.push(`• Parent's primary concern: ${answers['ped_concern']}`);
      }
      break;
    }
    case 'elderly': {
      if (answers['elder_uti_fever'] === 'Yes') {
        requests.push(`• Companion reports urinary symptoms or fever — please evaluate for UTI as cause of acute change`);
      }
      if (answers['elder_baseline_walk']) {
        requests.push(`• Please document baseline mobility per companion: ${answers['elder_baseline_walk']}`);
      }
      if (answers['elder_falls'] === 'Yes' && answers['elder_blood_thinners'] === 'Yes') {
        requests.push(`• URGENT: Recent fall in a patient on blood thinners — please evaluate for intracranial bleeding`);
      } else if (answers['elder_falls'] === 'Yes') {
        requests.push(`• Companion reports recent fall — please evaluate`);
      }
      if (answers['elder_blood_thinners'] === 'Yes') {
        requests.push(`• Patient is on blood thinners per companion report`);
      }
      if (answers['elder_confusion'] === 'Yes') {
        requests.push(`• Companion reports new or worsened confusion — please evaluate for organic cause`);
      }
      if (answers['elder_breathing'] === 'Yes' && (answers['elder_confusion'] === 'Yes' || answers['elder_uti_fever'] === 'Yes')) {
        requests.push(`• Companion reports rapid or labored breathing alongside confusion or fever — please consider sepsis`);
      }
      if (answers['elder_urination']?.startsWith('Barely')) {
        requests.push(`• Companion reports little or no urination in the past day — please evaluate for sepsis or kidney involvement`);
      }
      if (answers['elder_pain'] === 'Yes') {
        requests.push(`• Companion reports pain: ${answers['elder_pain_detail'] || 'see details above'}`);
      }
      break;
    }
    case 'trauma': {
      if (answers['trauma_vomiting'] === 'Yes') {
        requests.push(`• URGENT: Companion reports post-injury vomiting or worsening headache — evaluate for elevated intracranial pressure`);
      }
      if (answers['trauma_consciousness']?.includes('unconscious')) {
        requests.push(`• Companion reports witnessed loss of consciousness`);
      }
      if (answers['trauma_head_hit']?.includes('Yes')) {
        requests.push(`• Companion confirms head impact occurred — please evaluate`);
      }
      if (answers['trauma_blood_thinners'] === 'Yes') {
        requests.push(`• Patient is on blood thinners per companion report`);
      }
      if (answers['trauma_neck_back'] === 'Yes') {
        requests.push(`• Companion reports neck or back pain since the injury — please consider spinal precautions`);
      }
      break;
    }
    case 'breathing': {
      const look = answers['br_appearance'] || '';
      if (look.includes('bluish') || look.includes("Can't speak in full sentences")) {
        requests.push(`• URGENT: Companion reports signs of severe respiratory distress: ${look}`);
      }
      if (answers['br_choking'] === 'Yes') {
        requests.push(`• Companion reports possible choking event: ${answers['br_choking_detail'] || 'see details above'}`);
      }
      if (answers['br_pe_risk'] && !answers['br_pe_risk'].includes('None of these') && !answers['br_pe_risk'].includes("I'm not sure")) {
        requests.push(`• Companion reports blood clot risk factors — please consider pulmonary embolism: ${answers['br_pe_risk']}`);
      }
      if (answers['br_cough_blood'] === 'Yes') {
        requests.push(`• Companion reports coughing up blood — please evaluate urgently`);
      }
      if (answers['br_lung_history']) {
        requests.push(`• Lung history per companion: ${answers['br_lung_history']}`);
      }
      break;
    }
    case 'seizure': {
      if (answers['seiz_witnessed'] === 'Yes') {
        requests.push(`• Companion directly witnessed the episode and can describe it — please ask for their account`);
      }
      if (answers['seiz_duration']) {
        requests.push(`• Episode duration per companion: ${answers['seiz_duration']}`);
      }
      if (answers['seiz_over_five'] === 'Yes') {
        requests.push(`• URGENT: Episode lasted over 5 minutes or recurred without recovery — meets criteria for status epilepticus`);
      }
      if (answers['seiz_pregnancy'] === 'Yes — possibly') {
        requests.push(`• URGENT: Companion reports possible pregnancy — please consider eclampsia`);
      }
      if (answers['seiz_first_time'] === 'Yes') {
        requests.push(`• This is the first known episode per companion`);
      }
      if (answers['seiz_head_hit'] === 'Yes') {
        requests.push(`• Companion reports possible head impact during the episode — please evaluate`);
      }
      if (answers['seiz_after'] === 'Still not back to normal') {
        requests.push(`• URGENT: Companion reports patient has not returned to baseline since the episode`);
      }
      break;
    }
    case 'abdominal': {
      if (answers['abd_severity']?.startsWith('Severe')) {
        requests.push(`• Companion reports the worst pain of the patient's life — please evaluate urgently`);
      }
      if (answers['abd_tender'] === 'Yes') {
        requests.push(`• Companion reports the abdomen is tender to touch or rigid`);
      }
      if (answers['abd_red_flags'] && !answers['abd_red_flags'].includes('None of these')) {
        requests.push(`• URGENT: Companion reports: ${answers['abd_red_flags']}`);
      }
      if (answers['abd_vomit_blood'] === 'Yes') {
        requests.push(`• URGENT: Companion reports blood or coffee-ground material in vomit — please evaluate for GI bleeding`);
      }
      if (answers['abd_blood_stool'] === 'Yes') {
        requests.push(`• Companion reports blood in stool or black tarry stools — please evaluate for GI bleeding`);
      }
      if (answers['abd_pregnancy'] === 'Yes — possibly') {
        requests.push(`• Companion reports possible pregnancy — please consider ectopic pregnancy in the workup`);
      }
      if (answers['abd_vomit_detail']) {
        requests.push(`• Vomiting detail per companion: ${answers['abd_vomit_detail']}`);
      }
      break;
    }
    case 'allergic': {
      const sx = answers['all_symptoms'] || '';
      if (sx.includes('Throat tightness') || sx.includes('Trouble breathing') || sx.includes('Swelling of the face') || sx.includes('Blue, grey, or pale')) {
        requests.push(`• URGENT: Companion reports possible anaphylaxis symptoms: ${sx}`);
      }
      if (answers['all_epi']?.startsWith('Yes')) {
        requests.push(`• Epinephrine was given before arrival — please document: ${answers['all_epi']}`);
      }
      if (answers['all_trigger']) {
        requests.push(`• Suspected trigger and exposure time per companion: ${answers['all_trigger']}`);
      }
      break;
    }
    case 'overdose': {
      if (answers['od_state']?.includes('Breathing seems slow or shallow') || answers['od_state']?.includes('Unresponsive')) {
        requests.push(`• URGENT: Companion reports ${answers['od_state']}`);
      }
      if (answers['od_what']) {
        requests.push(`• Substance(s) per companion: ${answers['od_what']}`);
      }
      if (answers['od_when']) {
        requests.push(`• Time of ingestion (or last known well) per companion: ${answers['od_when']}`);
      }
      if (answers['od_amount']) {
        requests.push(`• Estimated amount per companion: ${answers['od_amount']}`);
      }
      if (answers['od_naloxone']?.startsWith('Yes')) {
        requests.push(`• Naloxone given before arrival: ${answers['od_naloxone']}`);
      }
      requests.push(`• Poison Control (1-800-222-1222) is free and available 24/7 for guidance on any exposure`);
      break;
    }
    case 'general': {
      if (answers['gen_pregnancy'] === 'Yes — possibly') {
        requests.push(`• Companion reports possible pregnancy — please account for this in the workup`);
      }
      if (answers['gen_urination']?.startsWith('Barely')) {
        requests.push(`• Companion reports little or no urination in the past day — please evaluate for sepsis or kidney involvement`);
      }
      if (answers['gen_observed']) {
        requests.push(`• Please document companion's direct observations: ${answers['gen_observed']}`);
      }
      if (answers['gen_baseline']) {
        requests.push(`• Change from baseline per companion: ${answers['gen_baseline']}`);
      }
      if (answers['gen_concern']) {
        requests.push(`• Companion's primary concern: ${answers['gen_concern']}`);
      }
      break;
    }
  }

  if (requests.length === 0) {
    requests.push(`• Please document companion's observations in the medical record`);
  }

  return requests.join('\n') + '\n';
}
