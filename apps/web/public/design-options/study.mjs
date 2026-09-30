import { STUDY, VARIANTS, KEY, REPORT_KEY, newRecord, recordEvent, validateRecord, mergeRecords, summarize, isComplete } from './experiment.mjs';
const $ = id => document.getElementById(id);
const previewVariant = new URLSearchParams(location.search).get('preview');
const practice = VARIANTS.includes(previewVariant);
let record = null, imported = [], feedbackOpen = false;
function notice(message) { $('notice').textContent = message; }
function persist() {
  if (practice) return false;
  try { localStorage.setItem(KEY, JSON.stringify(record)); return true; }
  catch { notice('Browser storage is unavailable. You can still download this attempt before closing the page, but it may not be remembered.'); return false; }
}
function download(records, filename) {
  const blob = new Blob([JSON.stringify({ study: STUDY, records }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
try {
  const raw = practice ? null : localStorage.getItem(KEY);
  if (raw) record = validateRecord(JSON.parse(raw));
  const saved = practice ? null : localStorage.getItem(REPORT_KEY);
  if (saved) imported = mergeRecords([], JSON.parse(saved));
} catch { notice('Some saved study data could not be read. Export any visible result before leaving.'); }
function updateStatus() {
  $('status').textContent = isComplete(record) ? 'Task complete. Please tell us how the journey felt.' : 'Use fictional examples only. You can stop and give feedback at any time.';
}
function showSession() {
  $('intro').hidden = true; $('session').hidden = false;
  $('concept').src = '/design-options/' + record.variant + '.html?study=1';
  $('concept').hidden = false;
  if (record.feedback) {
    document.querySelector('input[name=clarity][value="' + record.feedback.clarity + '"]').checked = true;
    $('again').value = record.feedback.useAgain; $('comment').value = record.feedback.comment;
    $('feedback-status').textContent = 'Your feedback is saved in this browser. You can update it or download your result.';
    showFeedback();
  }
  updateStatus();
}
function showFeedback() {
  feedbackOpen = true; $('feedback-panel').hidden = false; $('concept').hidden = true;
  $('feedback-panel').scrollIntoView({ block: 'start' });
  $('feedback-panel').querySelector('h2').tabIndex = -1;
  $('feedback-panel').querySelector('h2').focus({ preventScroll: true });
}
window.addEventListener('message', event => {
  if (!record || feedbackOpen || event.origin !== location.origin || event.source !== $('concept').contentWindow || event.data?.type !== 'jobai-study-event') return;
  // The frame sends fixed milestones only; text fields and file metadata are never read.
  const updated = recordEvent(record, event.data.event, Date.now());
  if (updated !== record) { record = updated; persist(); updateStatus(); }
});
$('start-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!record) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    record = newRecord(crypto.randomUUID(), random, Date.now(), $('work').value);
    if (practice) record.variant = previewVariant;
    persist();
  }
  showSession();
});
$('end').onclick = showFeedback;
$('resume').onclick = () => { feedbackOpen = false; $('feedback-panel').hidden = true; $('concept').hidden = false; };
$('feedback-form').addEventListener('submit', event => {
  event.preventDefault();
  record = { ...record, updatedAt: Date.now(), feedback: { clarity: Number(new FormData(event.target).get('clarity')), useAgain: $('again').value, comment: $('comment').value.trim() } };
  const saved = persist();
  if (practice) { $('feedback-status').textContent = 'Practice feedback received. Nothing was saved or counted.'; return; }
  $('feedback-status').textContent = saved ? 'Thank you. Feedback saved in this browser. Download your result to share it.' : 'Thank you. Download your result now; browser storage is unavailable.';
});
$('export-own').onclick = () => download([record], 'jobai-test-' + record.id + '.json');
function combined() { return mergeRecords(imported, record ? [record] : []); }
function renderReport() {
  const filter = $('role-filter').value;
  const records = combined().filter(r => filter === 'all' || r.role === filter);
  $('results').replaceChildren(...summarize(records).map(row => {
    const tr = document.createElement('tr');
    const complete = row.started ? `${row.completed}/${row.started} (${Math.round(100 * row.completed / row.started)}%)` : '—';
    const values = [row.variant, row.assigned, row.started, row.review, row.decision, row.confirmed, complete, row.medianMs === null ? '—' : Math.round(row.medianMs / 1000) + ' sec', row.clarity === null ? '—' : row.clarity.toFixed(1) + ' (n=' + row.feedbackCount + ')'];
    values.forEach(value => { const td = document.createElement('td'); td.textContent = String(value); tr.append(td); }); return tr;
  }));
  const comments = records.filter(r => r.feedback).map(r => {
    const div = document.createElement('div'); div.className = 'comment';
    const title = document.createElement('strong'); title.textContent = `${r.variant} · ${r.role} · Clarity ${r.feedback.clarity}/5 · Would use: ${r.feedback.useAgain}`;
    const p = document.createElement('p'); p.textContent = r.feedback.comment || 'No written feedback.';
    div.append(title, p); return div;
  });
  $('comments').replaceChildren(...comments);
  if (!records.length) $('report-status').textContent = 'No results yet for this selection. Import tester files to begin.';
}
$('role-filter').onchange = () => { $('report-status').textContent = ''; renderReport(); };
$('copy-link').onclick = async () => {
  try { await navigator.clipboard.writeText($('test-link').value); $('report-status').textContent = 'Tester link copied.'; }
  catch { $('test-link').select(); $('report-status').textContent = 'Select and copy the tester link above.'; }
};
$('export-all').onclick = () => download(combined(), 'jobai-' + STUDY + '-combined.json');
$('import-results').onchange = async event => {
  const files = [...event.target.files];
  try {
    if (files.length > 100) throw new Error('Import at most 100 files at once.');
    const incoming = [];
    for (const file of files) {
      if (file.size > 2_000_000) throw new Error('Each result file must be smaller than 2 MB.');
      const data = JSON.parse(await file.text());
      if (data.study !== STUDY || !Array.isArray(data.records) || data.records.length > 1000) throw new Error('Choose a result export from this study round.');
      incoming.push(...data.records);
    }
    const merged = mergeRecords(combined(), incoming);
    if (merged.length > 5000) throw new Error('This local study supports up to 5,000 returned results.');
    // Keep the old report intact if validation or persistence fails.
    localStorage.setItem(REPORT_KEY, JSON.stringify(merged)); imported = merged;
    renderReport(); $('report-status').textContent = `${files.length} file(s) imported. ${merged.length} unique tester result(s); repeated exports count once.`;
  } catch (error) { $('report-status').textContent = 'Import failed: ' + (error instanceof Error ? error.message : 'Invalid result file.'); }
  event.target.value = '';
};
if (new URLSearchParams(location.search).get('view') === 'results') {
  $('report').hidden = false;
  $('test-link').value = location.origin + location.pathname;
  renderReport();
} else if (record) showSession();
else $('intro').hidden = false;

if (practice) { notice('Practice mode — ' + previewVariant + '. No assignment or result is saved or counted.'); $('export-own').hidden = true; }
