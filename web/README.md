# Fallback condivisione

Pubblicare `share/index.html` come `/minimal-sudoku/share`.

Copiare `.well-known/assetlinks.json.template` in
`/.well-known/assetlinks.json`, sostituendo fingerprint SHA-256 con certificato
firma release. File deve essere servito via HTTPS, senza redirect e con
`Content-Type: application/json`.

Prima pubblicazione reale, sostituire dominio sample `example.com` in:

- `src/features/sharing/config.ts`
- `app.json`
- `android/app/src/main/AndroidManifest.xml`
