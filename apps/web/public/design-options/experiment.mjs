// Shared, versioned study rules. No CV text or file metadata belongs in a record.
export const STUDY = 'cv-directions-v2';
export const VARIANTS = ['neutral', 'blueprint', 'signal'];
export const EVENTS = ['started', 'processing', 'review', 'decision', 'layout', 'layout_confirmed'];
export const ROLES = ['first-job', 'business', 'creative', 'tech', 'logistics', 'service', 'prefer-not'];
export const KEY = 'jobai-study-' + STUDY;
export const REPORT_KEY = KEY + '-reports';
export function newRecord(id, random, now, role) {
  return { study: STUDY, id, variant: VARIANTS[Math.min(2, Math.floor(random * 3))], role, createdAt: now, updatedAt: now, events: {}, feedback: null };
}
export function recordEvent(record, event, now) {
  if (!EVENTS.includes(event) || record.events[event] !== undefined) return record;
  return { ...record, updatedAt: Math.max(now, record.updatedAt), events: { ...record.events, [event]: Math.max(0, now - record.createdAt) } };
}
export function isComplete(record) {
  return ['started', 'review', 'decision', 'layout', 'layout_confirmed'].every(event => Number.isFinite(record.events[event]));
}
export function completionMs(record) {
  return isComplete(record) ? Math.max(record.events.decision, record.events.layout_confirmed) - record.events.started : null;
}
export function validateRecord(input) {
  if (!input || input.study !== STUDY || typeof input.id !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(input.id) || !VARIANTS.includes(input.variant) || !ROLES.includes(input.role)) throw new Error('This is not a result from this study.');
  if (![input.createdAt, input.updatedAt].every(n => Number.isSafeInteger(n) && n > 0) || input.updatedAt < input.createdAt || !input.events || typeof input.events !== 'object') throw new Error('Invalid result dates.');
  const events = {};
  for (const event of EVENTS) {
    if (input.events[event] === undefined) continue;
    const time = input.events[event];
    if (!Number.isSafeInteger(time) || time < 0 || time > input.updatedAt - input.createdAt) throw new Error('Invalid journey timing.');
    events[event] = time;
  }
  if (Object.keys(events).length && events.started === undefined) throw new Error('Missing journey start.');
  if (Object.values(events).some(time => time < events.started)) throw new Error('Journey event precedes the start.');
  let feedback = null;
  if (input.feedback !== null) {
    const f = input.feedback;
    if (!f || !Number.isInteger(f.clarity) || f.clarity < 1 || f.clarity > 5 || !['yes', 'maybe', 'no'].includes(f.useAgain) || typeof f.comment !== 'string' || f.comment.length > 600) throw new Error('Invalid feedback.');
    feedback = { clarity: f.clarity, useAgain: f.useAgain, comment: f.comment };
  }
  return { study: STUDY, id: input.id, variant: input.variant, role: input.role, createdAt: input.createdAt, updatedAt: input.updatedAt, events, feedback };
}
export function mergeRecords(existing, incoming) {
  const records = new Map();
  for (const raw of [...existing, ...incoming]) {
    const record = validateRecord(raw);
    const previous = records.get(record.id);
    if (previous && (previous.variant !== record.variant || previous.createdAt !== record.createdAt || previous.role !== record.role)) throw new Error('Conflicting assignment for the same tester.');
    if (!previous || record.updatedAt > previous.updatedAt) records.set(record.id, record);
  }
  return [...records.values()];
}
function median(values) {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b), middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}
export function summarize(records) {
  return VARIANTS.map(variant => {
    const assigned = records.filter(r => r.variant === variant);
    const started = assigned.filter(r => r.events.started !== undefined);
    const finished = started.filter(isComplete);
    const ratings = started.filter(r => r.feedback);
    return { variant, assigned: assigned.length, started: started.length, review: started.filter(r => r.events.review !== undefined).length, decision: started.filter(r => r.events.decision !== undefined).length, confirmed: started.filter(r => r.events.layout_confirmed !== undefined).length, completed: finished.length, medianMs: median(finished.map(completionMs)), feedbackCount: ratings.length, clarity: ratings.length ? ratings.reduce((sum, r) => sum + r.feedback.clarity, 0) / ratings.length : null };
  });
}
