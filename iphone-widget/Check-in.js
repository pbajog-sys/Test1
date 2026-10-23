// Tages-Check-in für Scriptable (iPhone): Widget + Check-in + Wochenansicht.
// Daten liegen nur lokal in Scriptable (FileManager.local), keine Cloud, kein Konto.
// Gleiche Felder, Wochenziele und Ampel-Regeln wie die PC-App; Export als .xlsx
// im Spaltenformat der PC-App.

const FILE = "tagescheckin.json";
const MOVEMENTS = ["keine", "Spaziergang", "Lauf", "Krafttraining"];
const DEFAULT_SETTINGS = { runGoal: 90, g1name: "Fokus 1", g1goal: 180, g2name: "", g2goal: 0, reminder: "20:30" };
const YELLOW_RATIO = 0.7;
const REMINDER_DAYS = 7;
const NOTIFY_PREFIX = "tagescheckin-";

// ---------------------------------------------------------------- Speicher
const fm = FileManager.local();
const dataPath = fm.joinPath(fm.documentsDirectory(), FILE);

function loadState() {
  try {
    if (fm.fileExists(dataPath)) {
      const raw = JSON.parse(fm.readString(dataPath));
      return { entries: raw.entries || {}, settings: Object.assign({}, DEFAULT_SETTINGS, raw.settings || {}) };
    }
  } catch (e) { /* beschädigt: neu beginnen, alte Datei bleibt als .bak */
    try { fm.writeString(dataPath + ".bak", fm.readString(dataPath)); } catch (_) {}
  }
  return { entries: {}, settings: Object.assign({}, DEFAULT_SETTINGS) };
}
const state = loadState();
function persist() { fm.writeString(dataPath, JSON.stringify(state)); }

function activeGoals() {
  const s = state.settings, g = [];
  if ((s.g1name || "").trim()) g.push({ slot: 1, name: s.g1name.trim(), target: +s.g1goal || 0 });
  if ((s.g2name || "").trim()) g.push({ slot: 2, name: s.g2name.trim(), target: +s.g2goal || 0 });
  return g;
}

// ---------------------------------------------------------------- Datum
const pad = n => String(n).padStart(2, "0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const weekStart = d => addDays(d, -((d.getDay() + 6) % 7));
const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const fmtDM = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
const fmtNum = (x, digits = 1) => x.toFixed(digits).replace(".", ",");
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 86400000 + 1) / 7);
}
function parseTime(s) {
  const m = String(s || "").trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m || +m[1] > 23 || +m[2] > 59) return null;
  return { h: +m[1], m: +m[2] };
}

// ---------------------------------------------------------------- Auswertung
const runMin = e => (e && e.movement === "Lauf" ? (+e.run || 0) : 0);
function daysElapsed(start, now, todayRecorded) {
  if (now > addDays(start, 6)) return 7;
  if (now < start) return 0;
  return Math.round((now - start) / 86400000) + (todayRecorded ? 1 : 0);
}
function light(actual, expected) {
  if (expected <= 0) return "";
  if (actual >= expected) return "g";
  if (actual >= YELLOW_RATIO * expected) return "y";
  return "r";
}
function weightAvg(start) {
  const w = [];
  for (let i = 0; i < 7; i++) {
    const e = state.entries[keyOf(addDays(start, i))];
    if (e && typeof e.weight === "number") w.push(e.weight);
  }
  return w.length ? { avg: w.reduce((a, b) => a + b, 0) / w.length, n: w.length } : { avg: null, n: 0 };
}
function summarize(start) {
  const now = today();
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => state.entries[keyOf(addDays(start, i))] || null);
  const present = days.filter(Boolean);
  const elapsed = daysElapsed(start, now, !!state.entries[keyOf(now)]);
  const mk = (label, actual, target) => {
    target = Math.max(0, +target || 0);
    const expected = target * elapsed / 7;
    return { label, actual, target, expected, light: light(actual, expected) };
  };
  const goals = [mk("Lauf", present.reduce((a, e) => a + runMin(e), 0), state.settings.runGoal)];
  for (const g of activeGoals()) {
    const f = g.slot === 1 ? "g1" : "g2";
    goals.push(mk(g.name, present.reduce((a, e) => a + (+e[f] || 0), 0), g.target));
  }
  return { start, days, goals, w: weightAvg(start), wPrev: weightAvg(addDays(start, -7)),
           running: start <= now && now <= addDays(start, 6) };
}
function trendText(s) {
  if (s.w.avg === null || s.wPrev.avg === null) return null;
  const d = s.w.avg - s.wPrev.avg;
  const arrow = Math.abs(d) < 0.05 ? "→" : d > 0 ? "↑" : "↓";
  return `${arrow} ${d > 0 ? "+" : ""}${fmtNum(d)} kg`;
}

// ---------------------------------------------------------------- Erinnerung
// Plant Mitteilungen für die nächsten Tage; heute entfällt, wenn schon erfasst.
async function scheduleReminders() {
  const pending = await Notification.allPending();
  const ours = pending.filter(n => (n.identifier || "").startsWith(NOTIFY_PREFIX)).map(n => n.identifier);
  if (ours.length) Notification.removePending(ours);
  const t = parseTime(state.settings.reminder);
  if (!t) return;
  const now = new Date();
  for (let i = 0; i < REMINDER_DAYS; i++) {
    const day = addDays(today(), i);
    if (state.entries[keyOf(day)]) continue;
    const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.h, t.m);
    if (when <= now) continue;
    const n = new Notification();
    n.identifier = NOTIFY_PREFIX + keyOf(day);
    n.title = "Tages-Check-in";
    n.body = "Zeit für dein Check-in – dauert keine 30 Sekunden.";
    n.openURL = runURL("checkin");
    n.setTriggerDate(when);
    await n.schedule();
  }
}
function runURL(action) {
  return `scriptable:///run/${encodeURIComponent(Script.name())}?aktion=${action}`;
}

// ---------------------------------------------------------------- Check-in
async function checkin(day) {
  const k = keyOf(day);
  const old = state.entries[k] || null;
  const isToday = k === keyOf(today());
  const title = (isToday ? "Check-in heute" : `Check-in ${WD[day.getDay()]} ${fmtDM(day)}`);

  // 1) Gewicht
  const a1 = new Alert();
  a1.title = title;
  a1.message = old ? "Für diesen Tag gibt es schon einen Eintrag – er wird überschrieben." : "Gewicht (optional)";
  const wf = a1.addTextField("Gewicht in kg, z. B. 82,4", old && typeof old.weight === "number" ? fmtNum(old.weight) : "");
  wf.setDecimalPadKeyboard();
  a1.addAction("Weiter");
  a1.addCancelAction("Abbrechen");
  if (await a1.presentAlert() === -1) return false;
  let weight = null;
  const wt = a1.textFieldValue(0).trim().replace(",", ".");
  if (wt) {
    weight = Number(wt);
    if (!isFinite(weight) || weight < 20 || weight > 400) {
      await info("Bitte ein Gewicht zwischen 20 und 400 kg eingeben.");
      return checkin(day);
    }
    weight = Math.round(weight * 100) / 100;
  }

  // 2) Bewegung
  const a2 = new Alert();
  a2.title = "Bewegung";
  const curMove = old ? old.movement : null;
  for (const m of MOVEMENTS) a2.addAction(m === curMove ? `${m} ✓` : m);
  a2.addCancelAction("Abbrechen");
  const mi = await a2.presentSheet();
  if (mi === -1) return false;
  const movement = MOVEMENTS[mi];

  // 3) Minuten + Notiz
  const goals = activeGoals();
  const a3 = new Alert();
  a3.title = "Minuten";
  a3.message = goals.length ? "Leer = 0" : "Keine Fokusziele benannt – siehe Einstellungen.";
  const fields = [];
  if (movement === "Lauf") {
    a3.addTextField("Lauf (min)", old && old.run ? String(old.run) : "").setNumberPadKeyboard();
    fields.push("run");
  }
  for (const g of goals) {
    const prev = old ? +old["g" + g.slot] || 0 : 0;
    a3.addTextField(`${g.name} (min)`, prev ? String(prev) : "").setNumberPadKeyboard();
    fields.push("g" + g.slot);
  }
  a3.addTextField("Notiz (optional)", old ? old.note || "" : "");
  fields.push("note");
  a3.addAction("Speichern");
  a3.addCancelAction("Abbrechen");
  if (await a3.presentAlert() === -1) return false;

  const val = {};
  fields.forEach((f, i) => { val[f] = a3.textFieldValue(i); });
  const int = v => Math.max(0, Math.min(1440, Math.round(Number(String(v || "").replace(",", ".")) || 0)));
  // Nicht angezeigte Fokusziele behalten ihren bisherigen Wert.
  const e = { weight, movement, run: movement === "Lauf" ? int(val.run) : 0,
              g1name: old ? old.g1name || "" : "", g1: old ? +old.g1 || 0 : 0,
              g2name: old ? old.g2name || "" : "", g2: old ? +old.g2 || 0 : 0,
              note: (val.note || "").trim(), recorded: new Date().toISOString() };
  for (const g of goals) {
    e["g" + g.slot + "name"] = g.name;
    e["g" + g.slot] = int(val["g" + g.slot]);
  }
  state.entries[k] = e;
  persist();
  return true;
}

async function pickPastDay() {
  const a = new Alert();
  a.title = "Welcher Tag?";
  const days = [1, 2, 3, 4, 5, 6].map(i => addDays(today(), -i));
  for (const d of days) a.addAction(`${WD[d.getDay()]} ${fmtDM(d)}${state.entries[keyOf(d)] ? "  ✓" : ""}`);
  a.addCancelAction("Abbrechen");
  const i = await a.presentSheet();
  return i === -1 ? null : days[i];
}

async function info(msg) {
  const a = new Alert(); a.message = msg; a.addAction("OK"); await a.presentAlert();
}

// ---------------------------------------------------------------- Einstellungen
async function editSettings() {
  const s = state.settings;
  const a = new Alert();
  a.title = "Einstellungen";
  a.message = "Wochenziele in Minuten. Leerer Name = Fokusziel aus. Erinnerung als HH:MM, leer = aus.";
  a.addTextField("Lauf pro Woche (min)", String(s.runGoal)).setNumberPadKeyboard();
  a.addTextField("Fokusziel 1 – Name", s.g1name);
  a.addTextField("Fokusziel 1 pro Woche (min)", String(s.g1goal)).setNumberPadKeyboard();
  a.addTextField("Fokusziel 2 – Name", s.g2name);
  a.addTextField("Fokusziel 2 pro Woche (min)", String(s.g2goal)).setNumberPadKeyboard();
  a.addTextField("Erinnerung (HH:MM)", s.reminder || "");
  a.addAction("Speichern");
  a.addCancelAction("Abbrechen");
  if (await a.presentAlert() === -1) return;
  const int = v => Math.max(0, Math.round(Number(v) || 0));
  const rem = a.textFieldValue(5).trim();
  if (rem && !parseTime(rem)) { await info("Uhrzeit bitte als HH:MM, z. B. 20:30."); return editSettings(); }
  const t = parseTime(rem);
  state.settings = { runGoal: int(a.textFieldValue(0)), g1name: a.textFieldValue(1).trim(), g1goal: int(a.textFieldValue(2)),
                     g2name: a.textFieldValue(3).trim(), g2goal: int(a.textFieldValue(4)),
                     reminder: t ? `${pad(t.h)}:${pad(t.m)}` : "" };
  persist();
}

// ---------------------------------------------------------------- Wochenansicht
const COLORS = { g: "#2e9d4f", y: "#d9a300", r: "#d23c3c", "": "#9aa3a8" };
const LIGHT_TEXT = { g: "grün", y: "gelb", r: "rot", "": "–" };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function weekHtml(s) {
  let weight = '<span class="m">Keine Gewichtswerte.</span>';
  if (s.w.avg !== null) {
    const tr = trendText(s);
    weight = `<span class="big">${fmtNum(s.w.avg)} kg</span> <span class="m">aus ${s.w.n} Wert${s.w.n === 1 ? "" : "en"}</span><br>` +
      (tr ? `<b>${tr}</b> <span class="m">ggü. Vorwoche (${fmtNum(s.wPrev.avg)} kg)</span>` : '<span class="m">Vorwoche: keine Werte</span>');
  }
  const goals = s.goals.map(g => {
    const pct = g.target > 0 ? Math.round(100 * g.actual / g.target) : 0;
    let d = g.target > 0 ? `${g.actual} / ${g.target} min · ${pct} %` : `${g.actual} min · kein Wochenziel`;
    if (s.running && g.target > 0) d += `<br><span class="m">Soll bis heute: ${Math.round(g.expected)} min</span>`;
    return `<div class="g"><i style="background:${COLORS[g.light]}"></i><div><b>${esc(g.label)}</b> <span class="m">${LIGHT_TEXT[g.light]}</span><br>${d}</div></div>`;
  }).join("");
  const days = s.days.map((e, i) => {
    const d = addDays(s.start, i), parts = [];
    if (e) {
      if (typeof e.weight === "number") parts.push(fmtNum(e.weight) + " kg");
      parts.push(e.movement === "Lauf" && e.run ? `Lauf ${e.run} min` : e.movement);
      const l = (+e.g1 || 0) + (+e.g2 || 0); if (l) parts.push(`Lernen ${l} min`);
      if (e.note) parts.push(e.note);
    }
    return `<tr><td>${WD[d.getDay()]} ${fmtDM(d)}</td><td${e ? "" : ' class="m"'}>${e ? esc(parts.join(" · ")) : "–"}</td></tr>`;
  }).join("");
  return `<section><h2>KW ${isoWeek(s.start)} <span class="m">${fmtDM(s.start)} – ${fmtDM(addDays(s.start, 6))}${s.start.getFullYear()}</span></h2>
    <div class="c">${weight}</div><div class="c">${goals}</div><div class="c"><table>${days}</table></div></section>`;
}

async function showWeeks() {
  const weeks = [0, 1, 2, 3].map(i => summarize(addDays(weekStart(today()), -7 * i)));
  const html = `<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    :root{--bg:#f4f6f7;--c:#fff;--t:#1b1f22;--m:#6b7378;--l:#e2e6e8}
    @media (prefers-color-scheme:dark){:root{--bg:#16191b;--c:#212528;--t:#eef1f2;--m:#9aa3a8;--l:#33393d}}
    body{margin:0;padding:16px;background:var(--bg);color:var(--t);font:16px/1.4 -apple-system,system-ui,sans-serif}
    h2{font-size:20px;margin:18px 4px 8px}.m{color:var(--m);font-weight:400;font-size:14px}
    .c{background:var(--c);border-radius:12px;padding:12px 14px;margin-bottom:8px}.big{font-size:24px;font-weight:700}
    .g{display:flex;gap:10px;align-items:flex-start}.g+.g{margin-top:10px}.g i{width:14px;height:14px;border-radius:50%;flex:none;margin-top:4px}
    table{width:100%;border-collapse:collapse;font-size:15px}td{padding:5px 0;border-top:1px solid var(--l);vertical-align:top}
    tr:first-child td{border-top:0}td:first-child{width:72px;white-space:nowrap}
  </style></head><body>${weeks.map(weekHtml).join("")}
  <p class="m">Ampel: Vergleich mit dem Soll bis heute (heute zählt, sobald erfasst). Grün ≥ Soll, Gelb ≥ 70 %, sonst Rot.</p></body></html>`;
  const wv = new WebView();
  await wv.loadHTML(html);
  await wv.present();
}

// ---------------------------------------------------------------- Widget
function dyn(light, dark) { return Color.dynamic(new Color(light), new Color(dark)); }

function buildWidget(family) {
  const s = summarize(weekStart(today()));
  const done = !!state.entries[keyOf(today())];
  const w = new ListWidget();
  w.backgroundColor = dyn("#ffffff", "#1c1f21");
  w.setPadding(12, 14, 12, 14);
  w.url = runURL("checkin");
  const text = dyn("#1b1f22", "#eef1f2"), muted = dyn("#6b7378", "#9aa3a8");

  const head = w.addStack();
  head.centerAlignContent();
  const t = head.addText(`KW ${isoWeek(s.start)}`);
  t.font = Font.boldSystemFont(15); t.textColor = text;
  head.addSpacer();
  const st = head.addText(done ? "heute ✓" : "heute offen");
  st.font = Font.semiboldSystemFont(12);
  st.textColor = done ? new Color(COLORS.g) : new Color("#2a7f8f");
  w.addSpacer(8);

  for (const g of s.goals) {
    const row = w.addStack();
    row.centerAlignContent();
    const dot = row.addText("●");
    dot.font = Font.systemFont(12); dot.textColor = new Color(COLORS[g.light]);
    row.addSpacer(5);
    const name = row.addText(g.label);
    name.font = Font.mediumSystemFont(13); name.textColor = text; name.lineLimit = 1;
    row.addSpacer();
    const v = row.addText(g.target > 0 ? `${g.actual}/${g.target}` : `${g.actual}`);
    v.font = Font.systemFont(13); v.textColor = muted;
    w.addSpacer(4);
  }

  w.addSpacer();
  const wl = w.addText(s.w.avg === null ? "Gewicht: –"
    : `Ø ${fmtNum(s.w.avg)} kg` + (family === "small" ? "" : (trendText(s) ? `  ·  ${trendText(s)}` : "")));
  wl.font = Font.systemFont(12); wl.textColor = muted; wl.lineLimit = 1;
  if (family === "small" && trendText(s)) {
    const tl = w.addText(trendText(s));
    tl.font = Font.systemFont(12); tl.textColor = muted;
  }
  // Nach Mitternacht neu zeichnen, sonst etwa stündlich
  const next = new Date(Date.now() + 60 * 60 * 1000);
  const midnight = addDays(today(), 1);
  w.refreshAfterDate = next < midnight ? next : midnight;
  return w;
}

// ---------------------------------------------------------------- Excel-Export
const HEADERS = ["Datum", "Gewicht (kg)", "Bewegung", "Lauf (min)", "Fokusziel 1", "Fokus 1 (min)",
                 "Fokusziel 2", "Fokus 2 (min)", "Lernzeit gesamt (min)", "Notiz", "Erfasst am"];
const WIDTHS = [12, 13, 14, 11, 18, 13, 18, 13, 20, 40, 17];
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const serialFromKey = k => { const [y, m, d] = k.split("-").map(Number); return (Date.UTC(y, m - 1, d) - EXCEL_EPOCH) / 86400000; };
const serialFromDate = dt => (Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds()) - EXCEL_EPOCH) / 86400000;
const xmlEsc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
                              .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
function colName(i) { let s = ""; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

function utf8(str) {
  const out = [];
  for (const ch of str) {
    let c = ch.codePointAt(0);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(out);
}
function base64(bytes) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    s += A[(n >> 18) & 63] + A[(n >> 12) & 63] + (i + 1 < bytes.length ? A[(n >> 6) & 63] : "=") + (i + 2 < bytes.length ? A[n & 63] : "=");
  }
  return s;
}

function sheetXml() {
  const cell = (r, c, v, style) => {
    const ref = colName(c) + r, s = style ? ` s="${style}"` : "";
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "number") return `<c r="${ref}"${s}><v>${v}</v></c>`;
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  };
  const rows = [`<row r="1">${HEADERS.map((h, c) => cell(1, c, h, 4)).join("")}</row>`];
  Object.keys(state.entries).sort().forEach((k, i) => {
    const e = state.entries[k], r = i + 2;
    const g1 = e.g1name ? (+e.g1 || 0) : null, g2 = e.g2name ? (+e.g2 || 0) : null;
    const vals = [
      [serialFromKey(k), 1], [typeof e.weight === "number" ? e.weight : null, 2], [e.movement, 0],
      [runMin(e) || null, 0], [e.g1name || null, 0], [g1, 0], [e.g2name || null, 0], [g2, 0],
      [(g1 || 0) + (g2 || 0), 0], [e.note || null, 0],
      [e.recorded ? Math.round(serialFromDate(new Date(e.recorded)) * 86400) / 86400 : null, 3],
    ];
    rows.push(`<row r="${r}">${vals.map(([v, st], c) => cell(r, c, v, st)).join("")}</row>`);
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${WIDTHS.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>
<sheetData>${rows.join("")}</sheetData></worksheet>`;
}

function xlsxBytes() {
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Daten" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="DD.MM.YYYY"/><numFmt numFmtId="165" formatCode="0.0"/><numFmt numFmtId="166" formatCode="DD.MM.YYYY HH:MM"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    "xl/worksheets/sheet1.xml": sheetXml(),
  };
  return zipStore(files);
}

const CRC_TABLE = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files) {
  const chunks = [], central = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const name of Object.keys(files)) {
    const nameB = utf8(name), data = utf8(files[name]), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nameB.length, true);
    chunks.push(new Uint8Array(lh.buffer), nameB, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nameB.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nameB);
    offset += 30 + nameB.length + data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  const count = Object.keys(files).length;
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, count, true); end.setUint16(10, count, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0));
  let p = 0; for (const c of all) { out.set(c, p); p += c.length; }
  return out;
}

async function exportXlsx() {
  if (!Object.keys(state.entries).length) { await info("Noch keine Einträge zum Exportieren."); return; }
  const data = Data.fromBase64String(base64(xlsxBytes()));
  await DocumentPicker.exportData(data, `checkin-${keyOf(today())}.xlsx`);
}

// ---------------------------------------------------------------- Ablauf
async function mainMenu() {
  const done = !!state.entries[keyOf(today())];
  const a = new Alert();
  a.title = "Tages-Check-in";
  a.message = done ? "Heute schon erfasst ✓" : "Heute noch offen";
  const actions = [
    [done ? "Heutigen Eintrag ändern" : "Check-in heute", async () => checkin(today())],
    ["Vortag nachtragen", async () => { const d = await pickPastDay(); if (d) await checkin(d); }],
    ["Wochenansicht", showWeeks],
    ["Einstellungen & Erinnerung", editSettings],
    ["Als Excel-Datei exportieren", exportXlsx],
  ];
  for (const [label] of actions) a.addAction(label);
  a.addCancelAction("Schließen");
  const i = await a.presentSheet();
  if (i !== -1) await actions[i][1]();
}

async function run() {
  if (config.runsInWidget) {
    Script.setWidget(buildWidget(config.widgetFamily));
  } else {
    const action = (args.queryParameters || {}).aktion;
    if (action === "checkin") {
      if (await checkin(today())) await showWeeks();
    } else {
      await mainMenu();
    }
  }
  try { await scheduleReminders(); } catch (e) { console.log("Erinnerungen: " + e); }
  Script.complete();
}

await run();
