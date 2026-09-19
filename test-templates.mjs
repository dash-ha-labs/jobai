import { CV_TEMPLATES } from './packages/shared/src/cv-template-registry.ts';
console.log('Total templates:', CV_TEMPLATES.length);
CV_TEMPLATES.forEach((t, i) => console.log(i+1, t.id, t.name, t.category, t.layout, t.pdfFamily));