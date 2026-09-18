var e=`http://127.0.0.1:3000`,t=`jobai_extension_state`,n=`jobai_auth_token`;
async function r(){
let e=await chrome.storage.local.get(t);
return e&&e[t]?e[t]:{
status:`awaiting_setup`,reason:`not_paired`,message:`Connect to your local JobAI server to tailor CVs.`
}

}
async function i(e){
await chrome.storage.local.set({
[t]:e
}
)
}
async function a(){
return(await chrome.storage.local.get(n))?.[n]||null
}
async function o(e){
e?await chrome.storage.local.set({
[n]:e
}
):await chrome.storage.local.remove(n)
}
function s(e){
let t=new Uint8Array(e),n=``,r=8192;
for(let e=0;
e<t.length;
e+=r){
let i=t.subarray(e,Math.min(e+r,t.length));
n+=String.fromCharCode.apply(null,Array.from(i))
}
return btoa(n)
}
async function c(){
let t=await a();
if(!t){
let e={
status:`awaiting_setup`,reason:`not_paired`,message:`Extension is not paired with your local JobAI server. Click 'Connect JobAI' to generate a connection code.`
}
;
return await i(e),e
}
try{
let n=await fetch(`${
e
}
/api/status`,{
headers:{
Authorization:`Bearer ${
t
}
`
}

}
);
if(!n.ok){
if(n.status===401||n.status===403){
await o(null);
let e={
status:`awaiting_setup`,reason:`not_paired`,message:`Pairing expired or invalid. Please re-pair with the local server.`
}
;
return await i(e),e
}
throw Error(`Server returned status ${
n.status
}
`)
}
let a=await n.json();
if(!a.hasProfile){
let e={
status:`awaiting_setup`,reason:`no_profile`,message:`Extension is paired. Save and sync your Master CV in the JobAI editor to enable AI tailoring.`
}
;
return await i(e),e
}
if(!a.aiConfigured){
let e={
status:`awaiting_setup`,reason:`no_ai`,message:`OPENAI_API_KEY is not configured on the local server. Configure it in your server environment to enable AI tailoring.`
}
;
return await i(e),e
}
let c=await r();
if(c.status===`tailoring`&&c.jobId)try{
let n=c.jobId,r=await fetch(`${
e
}
/api/tailor/jobs/${
n
}
`,{
headers:{
Authorization:`Bearer ${
t
}
`
}

}
);
if(r.ok){
let n=await r.json();
if(n.job?.status===`completed`&&n.job.result){
let r=n.job.result,a=await fetch(`${
e
}
/api/pdf/${
r.draftId
}
`,{
headers:{
Authorization:`Bearer ${
t
}
`
}

}
);
if(a.ok){
let e=s(await a.arrayBuffer()),t={
status:`ready`,draftId:r.draftId,job:c.job,tailoredCV:r.tailoredCV,changes:r.changes||[],unapprovedSuggestedSummary:r.unapprovedSuggestedSummary,templateId:r.templateId||`modern`,pdfBase64:e
}
;
return await i(t),t
}

}
else if(n.job?.status===`failed`){
let e={
status:`error`,message:n.job.error||`Background tailoring failed`,retryable:!0,lastJob:c.job
}
;
return await i(e),e
}

}

}
catch{

}
if(c.status===`awaiting_setup`||c.status===`error`){
let e={
status:`idle`,hasProfile:!0,aiConfigured:!0
}
;
return await i(e),e
}
return c
}
catch(t){
let n={
status:`error`,message:`Cannot connect to JobAI server at ${
e
}
: ${
t?.message||String(t)
}
. Ensure 'npm run dev' or 'npm start' is running.`,retryable:!0
}
;
return await i(n),n
}

}
async function l(t,n){
let r=await a();
if(!r){
await i({
status:`awaiting_setup`,reason:`not_paired`,message:`Extension is not paired. Enter the pairing code in setup.`
}
);
return
}
await i({
status:`tailoring`,job:t
}
);
try{
let a=await fetch(`${
e
}
/api/tailor`,{
method:`POST`,headers:{
"Content-Type":`application/json`,Authorization:`Bearer ${
r
}
`
}
,body:JSON.stringify({
job:t,templateId:n
}
)
}
);
if(!a.ok){
let e=await a.json().catch(()=>({

}
));
if(e.error===`AI_CREDENTIALS_REQUIRED`||a.status===503){
await i({
status:`awaiting_setup`,reason:`no_ai`,message:e.message||`OPENAI_API_KEY is missing from server environment.`
}
);
return
}
throw Error(e.message||`Server error during tailoring (HTTP ${
a.status
}
)`)
}
let o=await a.json(),c=o.draftId,l=o.jobId;
await i({
status:`generating_pdf`,draftId:c,job:t,jobId:l
}
);
let u=await fetch(`${
e
}
/api/pdf/${
c
}
`,{
headers:{
Authorization:`Bearer ${
r
}
`
}

}
);
if(!u.ok)throw Error(`Failed to retrieve generated PDF from server (HTTP ${
u.status
}
)`);
let d=s(await u.arrayBuffer());
await i({
status:`ready`,draftId:c,job:t,tailoredCV:o.tailoredCV,changes:o.changes||[],unapprovedSuggestedSummary:o.unapprovedSuggestedSummary,templateId:o.templateId||`modern`,pdfBase64:d
}
)
}
catch(e){
await i({
status:`error`,message:e?.message||String(e),retryable:!0,lastJob:t
}
)
}

}
function u(e,t){
let n=Array.from(document.querySelectorAll(`input[type="file"]`));
if(n.length===0)return{
success:!1,message:`No file upload inputs found on this page. Please use the Download button to upload your CV manually.`
}
;
let r=n.find(e=>!e.disabled)||n[0];
try{
let n=atob(e),i=Array(n.length);
for(let e=0;
e<n.length;
e++)i[e]=n.charCodeAt(e);
let a=new Uint8Array(i),o=new File([a],t,{
type:`application/pdf`
}
),s=new DataTransfer;
return s.items.add(o),r.files=s.files,r.dispatchEvent(new Event(`input`,{
bubbles:!0
}
)),r.dispatchEvent(new Event(`change`,{
bubbles:!0
}
)),{
success:!0,message:`Attached tailored CV (${
t
}
) to the upload field.`
}

}
catch(e){
return{
success:!1,message:`Could not attach automatically: ${
e?.message||String(e)
}
. Please use 'Download PDF' and select the file manually.`
}

}

}
chrome.runtime.onMessage.addListener((t,n,i)=>t.type===`GET_STATE`?(r().then(e=>i({
state:e
}
)),!0):t.type===`CHECK_STATUS`?(c().then(e=>i({
state:e
}
)),!0):t.type===`PAIR`?((async()=>{
try{
let n=await fetch(`${
e
}
/api/pair`,{
method:`POST`,headers:{
"Content-Type":`application/json`
}
,body:JSON.stringify({
code:t.code
}
)
}
),r=await n.json();
if(!n.ok||!r.token)throw Error(r.message||`Failed to pair with server`);
await o(r.token),i({
success:!0,state:await c()
}
)
}
catch(e){
i({
success:!1,error:e?.message||String(e)
}
)
}

}
)(),!0):t.type===`START_TAILORING`?(l(t.job,t.templateId),i({
started:!0
}
),!1):t.type===`RESET_STATE`?(c().then(e=>i({
state:e
}
)),!0):t.type===`ATTACH_TO_PAGE`&&((async()=>{
try{
let[e]=await chrome.tabs.query({
active:!0,currentWindow:!0
}
);
if(!e||!e.id){
i({
success:!1,message:`No active tab found.`
}
);
return
}
let n=(await chrome.scripting.executeScript({
target:{
tabId:e.id
}
,func:u,args:[t.pdfBase64,t.filename||`tailored-cv.pdf`]
}
))?.[0]?.result;
i(n||{
success:!1,message:`Attachment script returned no result.`
}
)
}
catch(e){
i({
success:!1,message:`Attachment failed: ${
e?.message||String(e)
}
`
}
)
}

}
)(),!0)),c();
