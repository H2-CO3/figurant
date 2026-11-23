// A fiche: the brief of one scene, a plain text file kept in the project. The
// person writes directions in it from the atelier page; the LLM reads them,
// changes the scene, and answers in the same file. No account, no service:
// anything that can read and write a file can take part.
//
//   # tea
//   status: draft
//
//   ## 2026-11-20T14:02:00Z person
//   decision: redo
//   The cup is too small.
//
//   ## 2026-11-20T14:10:00Z llm
//   Enlarged the cup by a third.
//   ? Should it drink twice? (yes / no)
//   => props/cup          (optional: where to look, when the answer made something else)
//
// `status` is draft, checked (the machine found nothing wrong) or approved
// (a person watched it move and said yes). Only a person approves.

export const STATUSES = ['draft', 'checked', 'approved'];
// brief: an order for something that does not exist yet.
export const DECISIONS = ['approve', 'redo', 'note', 'brief'];
const AUTHORS = ['person', 'llm'];

/** A scene name that is safe as a file name. */
export const isFicheName = name => typeof name === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(name);

/**
 * @returns {{ scene, status, entries: Array<{ date, author, decision, text, questions }> }}
 */
export function parseFiche(text, scene = '') {
    const fiche = { scene, status: 'draft', entries: [] };
    let entry = null;
    for (const raw of String(text).split(/\r?\n/)) {
        const line = raw.trimEnd();
        const title = /^# (.+)$/.exec(line);
        const head = /^## (\S+) (\S+)$/.exec(line);
        if (head && AUTHORS.includes(head[2])) {
            entry = { date: head[1], author: head[2], decision: null, text: '', questions: [] };
            fiche.entries.push(entry);
        } else if (!entry) {
            if (title) fiche.scene = title[1].trim();
            const status = /^status:\s*(\S+)$/.exec(line);
            if (status && STATUSES.includes(status[1])) fiche.status = status[1];
        } else {
            const decision = /^decision:\s*(\S+)$/.exec(line);
            const question = /^\? (.+?)(?:\s*\(([^()]+)\))?$/.exec(line);
            // Where the result is, when it is not the item the fiche is about: "=> props/lounger".
            const see = /^=> (scenes|characters|emoji|props|compositions)\/([a-z0-9][a-z0-9_-]{0,63})$/i.exec(line);
            if (decision && DECISIONS.includes(decision[1]) && entry.decision === null && !entry.text) entry.decision = decision[1];
            else if (see && entry.author === 'llm') entry.see = `${see[1]}/${see[2]}`;
            else if (question && entry.author === 'llm') {
                entry.questions.push({ text: question[1].trim(), choices: question[2] ? question[2].split('/').map(c => c.trim()).filter(Boolean) : [] });
            } else entry.text += (entry.text ? '\n' : '') + line;
        }
    }
    for (const e of fiche.entries) e.text = e.text.trim();
    return fiche;
}

export function serializeFiche(fiche) {
    const out = [`# ${fiche.scene}`, `status: ${fiche.status}`, ''];
    for (const entry of fiche.entries) {
        out.push(`## ${entry.date} ${entry.author}`);
        if (entry.decision) out.push(`decision: ${entry.decision}`);
        if (entry.text) out.push(entry.text);
        if (entry.see) out.push(`=> ${entry.see}`);
        for (const q of entry.questions || []) out.push(`? ${q.text}${q.choices?.length ? ` (${q.choices.join(' / ')})` : ''}`);
        out.push('');
    }
    return out.join('\n');
}

// What a person typed must not be read back as structure.
// (Trimmed first, then guarded: trimming afterwards took the guard off the first line.)
const plain = text => String(text ?? '').trim().split(/\r?\n/).map(line => line.replace(/^\s*(#+ |\? |=> |decision:|status:)/, ' $1')).join('\n');

/**
 * Adds what a person said in the atelier, and moves the status accordingly:
 * approving sets `approved`; asking to redo sets `draft`; a plain note leaves it.
 * @param {{ decision, note?, answers?: Array<{ question, answer }> }} said
 */
export function addPersonEntry(fiche, said, date = new Date().toISOString()) {
    if (!DECISIONS.includes(said.decision)) throw new Error(`Unknown decision "${said.decision}". Use one of: ${DECISIONS.join(', ')}.`);
    const answers = (said.answers || []).filter(a => a && a.answer).map(a => `> ${plain(a.question)}: ${plain(a.answer)}`);
    const text = [...answers, plain(said.note)].filter(Boolean).join('\n');
    const status = said.decision === 'approve' ? 'approved' : said.decision === 'note' ? fiche.status : 'draft';
    return { ...fiche, status, entries: [...fiche.entries, { date, author: 'person', decision: said.decision, text, questions: [] }] };
}

/** What the LLM has to do next, in one line; null when nothing is asked of it. */
export function pending(fiche) {
    const last = fiche.entries[fiche.entries.length - 1];
    if (!last || last.author !== 'person') return null;
    if (last.decision === 'approve') {
        // Approved, but with something said besides the answers: it must not be lost.
        // (The moment it was given at, which the page adds by itself, is not something said.)
        const remark = last.text.split('\n').filter(line => line && !line.startsWith('> ') && !/^At: [\d.]+ s$/.test(line));
        return remark.length ? `${fiche.scene}: approved, with a remark — ${remark[0]}` : null;
    }
    const what = { redo: 'to redo', brief: 'to create', note: 'a note' }[last.decision] ?? 'a note';
    return `${fiche.scene}: ${what} — ${last.text.split('\n')[0] || '(no text)'}`;
}
