import data from './manual-data.json';
import assessmentAreas from './assessment-areas.json';
import options217 from './exs217-options.json';

export const STORAGE_KEY = 'exs-practice-local-v1';
export const BACKUP_FORMAT = 'exs-practice-backup';
export type Course = '215' | '217';
export type Settings = { requiredIds: string[]; equipmentKeys: string[]; rulesConfirmed: boolean };
export type Practice = { id: string; course: Course; date: string; techniqueIds: string[]; mode: 'partner' | 'self'; notes: string };
export type Observation = { id: string; course: Course; date: string; techniqueIds: string[]; rating: number; checkpoints: boolean[]; feedback: string };
export type Equipment = { course: Course; key: string; date: string; completed: boolean };
export type LocalRecord = { version: 1; revision: number; updatedAt: string; firstName: string; courses: Course[]; settings: Record<Course, Settings>; practices: Practice[]; observations: Observation[]; readyIds: string[]; equipment: Equipment[] };
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Phoenix', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const equipmentCourse = (key: string): Course => key.startsWith('Theragun') ? '217' : '215';
export const equipmentForCourse = (course: Course) => data.equipment.filter(key => equipmentCourse(key) === course);
const isTheragun = (id: string) => ['215-theragun', '215-theragun-pro-plus'].includes(id);
export const retired215 = new Set(['215-tennis-ball-lumbar-region', '215-tennis-ball-glutes', '215-tens-traps']);
export const retired217 = new Set(options217.retired);
export const retiredTechniques = new Set([...retired215, ...retired217]);
export const fixed217Settings = (): Settings => ({ requiredIds: [...assessmentAreas.map(a=>a.id), '215-theragun', '215-theragun-pro-plus'], equipmentKeys: [], rulesConfirmed: true });
export const defaultSettings = (course: Course): Settings => course === '217' ? fixed217Settings() : ({ requiredIds: data.catalog.filter(t => t.course === course && t.requiredDefault).map(t => t.id), equipmentKeys: course === '215' ? data.equipment.slice(0, 5) : [], rulesConfirmed: false });
export function emptyRecord(): LocalRecord { return { version: 1, revision: 0, updatedAt: new Date().toISOString(), firstName: '', courses: ['215', '217'], settings: { '215': defaultSettings('215'), '217': defaultSettings('217') }, practices: [], observations: [], readyIds: [], equipment: [] }; }
const fail = (message: string): never => { throw new Error(message); };
const object = (x: unknown): Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : fail('The file does not contain a valid record.');
function keys(x: Record<string, unknown>, allowed: string[]) { if (Object.keys(x).some(k => !allowed.includes(k))) fail('The file contains unsupported fields. Use a backup downloaded from this tracker.'); }
const string = (x: unknown, max = 1200): string => typeof x === 'string' && x.length <= max ? x.trim() : fail('A text field is missing or too long.');
const array = (x: unknown, max = 5000): unknown[] => Array.isArray(x) && x.length <= max ? x : fail('A record list is missing or too large.');
const bool = (x: unknown): boolean => typeof x === 'boolean' ? x : fail('A completion value is invalid.');
export const validCourse = (x: unknown): Course => x === '215' || x === '217' ? x : fail('Choose EXS215 or EXS217.');
export function validDate(x: unknown): string { const d = string(x, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d + 'T12:00:00Z')) || new Date(d + 'T12:00:00Z').toISOString().slice(0, 10) !== d || d > today()) fail('Use a real date on or before today.'); return d; }
function uniqueStrings(x: unknown, max: number) { const values = array(x, max).map(v => string(v, 180)); if (new Set(values).size !== values.length) fail('Duplicate entries were found.'); return values; }
export function validIds(x: unknown, course?: Course, allowEmpty = false, legacy = false): string[] { const ids = uniqueStrings(x, 100); if ((!allowEmpty && !ids.length) || ids.some(id => !data.catalog.some(t => t.id === id && (!course || (legacy && isTheragun(t.id) ? '215' : t.course) === course)))) fail('Choose valid techniques for this course.'); return ids; }
export function validateRecord(input: unknown, legacy = false): LocalRecord {
  const v = object(input); keys(v, ['version', 'revision', 'updatedAt', 'firstName', 'courses', 'settings', 'practices', 'observations', 'readyIds', 'equipment']);
  if (v.version !== 1 || !Number.isSafeInteger(v.revision) || Number(v.revision) < 0) fail('This backup version is not supported.');
  const updatedAt = string(v.updatedAt, 40); if (Number.isNaN(Date.parse(updatedAt))) fail('The saved timestamp is invalid.');
  const courses = uniqueStrings(v.courses, 2).map(validCourse); if (!courses.length) fail('Select at least one course.');
  const settingsObject = object(v.settings); keys(settingsObject, ['215', '217']);
  const settings = {} as Record<Course, Settings>;
  for (const c of ['215', '217'] as Course[]) { const s = object(settingsObject[c]); keys(s, ['requiredIds', 'equipmentKeys', 'rulesConfirmed']); const requiredIds = validIds(s.requiredIds, c, true, legacy), equipmentKeys = uniqueStrings(s.equipmentKeys, 7), rulesConfirmed = bool(s.rulesConfirmed); if (equipmentKeys.some(k => !data.equipment.includes(k) || (legacy ? '215' : equipmentCourse(k)) !== c)) fail('An equipment requirement is invalid.'); if (rulesConfirmed && !requiredIds.length) fail('Required techniques must be selected before requirements can be marked as reviewed.'); settings[c] = { requiredIds, equipmentKeys, rulesConfirmed }; }
  const practices = array(v.practices).map(input => { const p = object(input); keys(p, ['id', 'course', 'date', 'techniqueIds', 'mode', 'notes']); const course = validCourse(p.course); if (p.mode !== 'partner' && p.mode !== 'self') fail('A practice type is invalid.'); return { id: string(p.id, 160), course, date: validDate(p.date), techniqueIds: validIds(p.techniqueIds, course, false, legacy), mode: p.mode, notes: string(p.notes) } as Practice; });
  const observations = array(v.observations).map(input => { const p = object(input); keys(p, ['id', 'course', 'date', 'techniqueIds', 'rating', 'checkpoints', 'feedback']); const course = validCourse(p.course), rating = Number(p.rating), checkpoints = array(p.checkpoints, 5).map(bool), feedback = string(p.feedback); if (typeof p.rating !== 'number' || !Number.isInteger(rating) || rating < 0 || rating > 4 || checkpoints.length !== 5) fail('Use a rating from 0 to 4 and review all five checkpoints.'); if (rating >= 3 && !checkpoints.every(Boolean)) fail('Completion requires all five checkpoints to have been observed.'); return { id: string(p.id, 160), course, date: validDate(p.date), techniqueIds: validIds(p.techniqueIds, course, false, legacy), rating, checkpoints, feedback }; });
  for (const rows of [practices, observations]) if (rows.some(x => !x.id) || new Set(rows.map(x => x.id)).size !== rows.length) fail('A record ID is empty or duplicated.');
  const equipment = array(v.equipment, 7).map(input => { const e = object(input); keys(e, ['course', 'key', 'date', 'completed']); if (!data.equipment.includes(String(e.key)) || e.course !== (legacy ? '215' : equipmentCourse(String(e.key)))) fail('An equipment check is invalid.'); return { course: validCourse(e.course), key: string(e.key, 100), date: validDate(e.date), completed: bool(e.completed) }; });
  if (new Set(equipment.map(e => e.key)).size !== equipment.length) fail('An equipment check is duplicated.');
  return { version: 1, revision: Number(v.revision), updatedAt, firstName: string(v.firstName, 80), courses, settings, practices, observations, readyIds: validIds(v.readyIds, undefined, true), equipment };
}
export function summary(record: LocalRecord, course: Course) {
  const practices = record.practices.filter(p => p.course === course), observations = record.observations.filter(p => p.course === course), config = course === '217' ? fixed217Settings() : record.settings[course];
  const skills = data.catalog.filter(t => t.course === course && !retiredTechniques.has(t.id)).map(t => { const practiceCount = practices.filter(p => p.techniqueIds.includes(t.id)).length; const latest = observations.filter(o => o.techniqueIds.includes(t.id)).sort((a, b) => a.date.localeCompare(b.date)).at(-1); const acknowledged = !!latest && latest.rating >= 3 && latest.checkpoints.every(Boolean); const ready = record.readyIds.includes(t.id); return { ...t, required: config.requiredIds.includes(t.id), practiceCount, latest, acknowledged, ready, status: acknowledged ? 'Met · student recorded' : latest ? 'Not met · student recorded' : ready ? 'Ready for instructor check' : latest ? 'More practice needed' : practiceCount ? 'Practiced' : 'Not yet logged' }; });
  const required = skills.filter(t => t.required), acknowledged = required.filter(t => t.acknowledged).length, equipmentDone = config.equipmentKeys.filter(k => record.equipment.some(e => e.course === course && e.key === k && e.completed)).length;
  return { skills, practices, observations, required: required.length, acknowledged, practiced: skills.filter(t => t.practiceCount > 0).length, ready: skills.filter(t => t.ready && !t.acknowledged).length, equipmentDone, complete: config.rulesConfirmed && !config.requiredIds.some(id => retiredTechniques.has(id)) && required.length > 0 && acknowledged === required.length && equipmentDone === config.equipmentKeys.length };
}
export function addPractice(record: LocalRecord, entry: Omit<Practice, 'id'>): LocalRecord { if (entry.techniqueIds.some(id => retiredTechniques.has(id))) fail('This technique is no longer part of the current course. Earlier records are preserved in history.'); const duplicate = record.practices.some(p => p.course === entry.course && p.date === entry.date && p.mode === entry.mode && p.notes === entry.notes.trim() && [...p.techniqueIds].sort().join('|') === [...entry.techniqueIds].sort().join('|')); if (duplicate) fail('This exact practice entry is already saved. Add a different note if this was a separate encounter.'); return validateRecord({ ...record, practices: [...record.practices, { ...entry, id: crypto.randomUUID() }] }); }
export function addObservation(record: LocalRecord, entry: Omit<Observation, 'id'>): LocalRecord { if (entry.techniqueIds.some(id => retiredTechniques.has(id))) fail('This technique is no longer part of the current course. Earlier records are preserved in history.'); return validateRecord({ ...record, readyIds: record.readyIds.filter(id => !entry.techniqueIds.includes(id)), observations: [...record.observations, { ...entry, id: crypto.randomUUID() }] }); }
export function backup(record: LocalRecord): string { return JSON.stringify({ format: BACKUP_FORMAT, exportedAt: new Date().toISOString(), record: validateRecord(record) }, null, 2); }
export function restore(text: string): LocalRecord { if (text.length > 2 * 1024 * 1024) fail('Choose a tracker backup smaller than 2 MB.'); let v: unknown; try { v = JSON.parse(text); } catch { fail('This is not a valid JSON backup. Your current records have not changed.'); } const file = object(v); keys(file, ['format', 'exportedAt', 'record']); if (file.format !== BACKUP_FORMAT) fail('Choose a backup downloaded from this tracker. A PDF cannot restore editable progress.'); return validateRecord(file.record); }
export function courseTemplate(record: LocalRecord): string { return JSON.stringify({ format: 'exs-course-requirements', version: 1, settings: record.settings }, null, 2); }
export function restoreTemplate(text: string, record: LocalRecord): LocalRecord { if (text.length > 30000) fail('The course requirements file is too large.'); let input: unknown; try { input = JSON.parse(text); } catch { fail('Choose a valid course requirements JSON file.'); } const v = object(input); keys(v, ['format', 'version', 'settings']); if (v.format !== 'exs-course-requirements' || v.version !== 1) fail('Choose a course requirements file, not a student backup.'); return validateRecord({ ...record, settings: v.settings }); }
export type LocalStorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function readBrowserRecord(storage: LocalStorageAdapter) {
  let raw: string | null;
  try { raw = storage.getItem(STORAGE_KEY); } catch { return { record: emptyRecord(), raw: null, mode: 'unavailable' as const }; }
  try { return { record: raw ? validateRecord(JSON.parse(raw)) : emptyRecord(), raw, mode: 'ready' as const }; }
  catch { return { record: emptyRecord(), raw, mode: 'unreadable' as const }; }
}
export function writeBrowserRecord(storage: LocalStorageAdapter, next: LocalRecord, expectedRaw: string | null, override = false) {
  const record = validateRecord({ ...next, revision: next.revision + 1, updatedAt: new Date().toISOString() });
  let raw: string | null;
  try { raw = storage.getItem(STORAGE_KEY); } catch { raw = expectedRaw; }
  if (!override && raw !== expectedRaw) fail('Progress changed in another tab. Download a backup before reloading.');
  const serialized = JSON.stringify(record);
  try { storage.setItem(STORAGE_KEY, serialized); return { record, raw: serialized, saved: true }; }
  catch { return { record, raw: expectedRaw, saved: false }; }
}
export function clearBrowserRecord(storage: LocalStorageAdapter) { storage.removeItem(STORAGE_KEY); return emptyRecord(); }

// Independent course records. The combined v1 key is read only for migration.
export const coursePath = (_course: Course) => '/stretch/competency/';
export const manualPath = (_course: Course) => '/stretch/';
export const courseStorageKey = (course: Course) => 'exs-practice-' + course + '-v2';
export function emptyCourseRecord(course: Course): LocalRecord {
  const r = emptyRecord(), other = course === '215' ? '217' : '215';
  return { ...r, courses: [course], settings: { ...r.settings, [other]: { requiredIds: [], equipmentKeys: [], rulesConfirmed: false } } };
}
export function validateCourseRecord(input: unknown, course: Course): LocalRecord {
  const r = validateRecord(input), other = course === '215' ? '217' : '215';
  if (r.courses.length !== 1 || r.courses[0] !== course || [...r.practices, ...r.observations, ...r.equipment].some(e => e.course !== course) || r.readyIds.some(id => !data.catalog.some(t => t.id === id && t.course === course)) || r.settings[other].requiredIds.length || r.settings[other].equipmentKeys.length || r.settings[other].rulesConfirmed) fail('This record belongs to another course. Open its own checklist to restore it.');
  return course === '217' ? {...r, settings:{...r.settings, '217':fixed217Settings()}} : r;
}
export function scopeToCourse(record: LocalRecord, course: Course): LocalRecord {
  const r = validateRecord(record), scoped = emptyCourseRecord(course);
  return validateCourseRecord({ ...scoped, revision: r.revision, updatedAt: r.updatedAt, firstName: r.firstName, settings: { ...scoped.settings, [course]: r.settings[course] }, practices: r.practices.filter(e => e.course === course), observations: r.observations.filter(e => e.course === course), equipment: r.equipment.filter(e => e.course === course), readyIds: r.readyIds.filter(id => data.catalog.some(t => t.id === id && t.course === course)) }, course);
}
export function migrateCombinedRecord(input: unknown): LocalRecord {
  const r = validateRecord(input, true);
  const movingIds = r.settings['215'].requiredIds.filter(isTheragun), movingEquipment = r.settings['215'].equipmentKeys.filter(k => equipmentCourse(k) === '217');
  const split = <T extends Practice | Observation>(rows: T[]): T[] => rows.flatMap(row => {
    const courses = [...new Set(row.techniqueIds.map(id => data.catalog.find(t => t.id === id)!.course as Course))];
    return courses.map(course => ({ ...row, id: courses.length > 1 ? row.id + '-' + course : row.id, course, techniqueIds: row.techniqueIds.filter(id => data.catalog.find(t => t.id === id)!.course === course) }));
  });
  return validateRecord({ ...r, settings: {
    '215': { ...r.settings['215'], requiredIds: r.settings['215'].requiredIds.filter(id => !isTheragun(id)), equipmentKeys: r.settings['215'].equipmentKeys.filter(k => equipmentCourse(k) === '215'), rulesConfirmed: movingIds.length || movingEquipment.length ? false : r.settings['215'].rulesConfirmed },
    '217': { ...r.settings['217'], requiredIds: [...new Set([...r.settings['217'].requiredIds, ...movingIds])], equipmentKeys: [...new Set([...r.settings['217'].equipmentKeys, ...movingEquipment])], rulesConfirmed: movingIds.length || movingEquipment.length ? false : r.settings['217'].rulesConfirmed }
  }, practices: split(r.practices), observations: split(r.observations), equipment: r.equipment.map(e => ({ ...e, course: equipmentCourse(e.key) })) });
}
export function courseBackup(record: LocalRecord, course: Course): string { return JSON.stringify({ format: 'exs-course-practice-backup', version: 2, course, exportedAt: new Date().toISOString(), record: validateCourseRecord(record, course) }, null, 2); }
export function restoreCourseBackup(text: string, course: Course): LocalRecord {
  if (text.length > 2 * 1024 * 1024) fail('Choose a tracker backup smaller than 2 MB.');
  let input: unknown; try { input = JSON.parse(text); } catch { fail('This is not a valid JSON backup. Your current records have not changed.'); }
  const file = object(input);
  if (file.format === BACKUP_FORMAT) { keys(file, ['format', 'exportedAt', 'record']); return scopeToCourse(migrateCombinedRecord(file.record), course); }
  keys(file, ['format', 'version', 'course', 'exportedAt', 'record']);
  if (file.format !== 'exs-course-practice-backup' || file.version !== 2) fail('Choose a JSON backup downloaded from this tracker. A PDF cannot restore editable progress.');
  if (file.course !== course) fail('This is an EXS' + String(file.course) + ' backup. Open that course’s checklist; this course has not changed.');
  return validateCourseRecord(file.record, course);
}
export function courseRequirements(record: LocalRecord, course: Course): string { const r = validateCourseRecord(record, course); return JSON.stringify({ format: 'exs-course-requirements', version: 2, course, settings: r.settings[course] }, null, 2); }
export function restoreCourseRequirements(text: string, record: LocalRecord, course: Course): LocalRecord {
  if(course === '217') fail('EXS217 assessment requirements are fixed by the instructor and cannot be replaced.');
  if (text.length > 30000) fail('The course requirements file is too large.');
  let input: unknown; try { input = JSON.parse(text); } catch { fail('Choose a valid course requirements JSON file.'); }
  const v = object(input);
  if (v.format !== 'exs-course-requirements') fail('Choose a course requirements file, not a student backup.');
  let settings: Settings;
  if (v.version === 1) { keys(v, ['format', 'version', 'settings']); settings = scopeToCourse(migrateCombinedRecord({ ...emptyRecord(), settings: v.settings }), course).settings[course]; }
  else { keys(v, ['format', 'version', 'course', 'settings']); if (v.version !== 2 || v.course !== course) fail('Load the requirements file for EXS' + course + '. This course has not changed.'); settings = v.settings as Settings; }
  return validateCourseRecord({ ...record, settings: { ...record.settings, [course]: settings } }, course);
}
export function readCourseRecord(storage: LocalStorageAdapter, course: Course) {
  const key = courseStorageKey(course); let raw: string | null;
  try { raw = storage.getItem(key); } catch { return { record: emptyCourseRecord(course), raw: null, mode: 'unavailable' as const, migrated: false }; }
  if (raw !== null) { try { return { record: validateCourseRecord(JSON.parse(raw), course), raw, mode: 'ready' as const, migrated: false }; } catch { return { record: emptyCourseRecord(course), raw, mode: 'unreadable' as const, migrated: false }; } }
  let legacy: string | null;
  try { legacy = storage.getItem(STORAGE_KEY); } catch { return { record: emptyCourseRecord(course), raw, mode: 'unavailable' as const, migrated: false }; }
  if (!legacy) return { record: emptyCourseRecord(course), raw, mode: 'ready' as const, migrated: false };
  let record: LocalRecord;
  try { record = scopeToCourse(migrateCombinedRecord(JSON.parse(legacy)), course); } catch { return { record: emptyCourseRecord(course), raw, mode: 'unreadable' as const, migrated: false }; }
  const serialized = JSON.stringify(record);
  try { storage.setItem(key, serialized); return { record, raw: serialized, mode: 'ready' as const, migrated: true }; }
  catch { return { record, raw, mode: 'unavailable' as const, migrated: true }; }
}
export function writeCourseRecord(storage: LocalStorageAdapter, next: LocalRecord, expectedRaw: string | null, course: Course, override = false) {
  const key = courseStorageKey(course), record = validateCourseRecord({ ...next, revision: next.revision + 1, updatedAt: new Date().toISOString() }, course);
  let raw: string | null; try { raw = storage.getItem(key); } catch { raw = expectedRaw; }
  if (!override && raw !== expectedRaw) fail('Progress changed in another tab. Download a backup before reloading.');
  const serialized = JSON.stringify(record);
  try { storage.setItem(key, serialized); return { record, raw: serialized, saved: true }; } catch { return { record, raw: expectedRaw, saved: false }; }
}
export function clearCourseRecord(storage: LocalStorageAdapter, course: Course) {
  // Keep an empty course marker so old combined activity cannot reappear after clear.
  const record = emptyCourseRecord(course), raw = JSON.stringify(record); storage.setItem(courseStorageKey(course), raw); return { record, raw };
}
