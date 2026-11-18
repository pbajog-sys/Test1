# Slowenisch-Wortschatz neu bauen

Quellen (nicht im Repo, werden heruntergeladen):
- Universal Dependencies **UD_Slovenian-SSJ** (`sl_ssj-ud-{train,dev,test}.conllu`, CC BY-SA 4.0) – echte Formen + Häufigkeit
- **UniMorph slv** (`slv`, aus Wiktionary, CC BY-SA) – vollständige Tabellen für einen Teil der Nomen/Adjektive
- **FrequencyWords** `sl_50k.txt` (OpenSubtitles, CC BY-SA 4.0) – gesprochene Häufigkeit

Ablauf: `ud.json`, `kandidaten.json`, `liste_uniq.txt` wie im Commit-Verlauf beschrieben erzeugen, dann
`python3 baue_lex.py glossen1.txt glossen2.txt glossen3.txt` → `lex_roh.json` → kompakt als `slo-lex.json`.
`paradigma.py` erzeugt Formen nach Regeln und gleicht jede Zelle mit den Belegen ab; nur Belegtes bzw. sichere Regeln
werden in der App abgefragt. Die deutschen Bedeutungen (`glossen*.txt`) sind von Hand geschrieben.
`slo-lex.json` steht wegen der Quellen unter **CC BY-SA 4.0**.
