---
name: i18n
description: Translation/message-file-only changes.
---

## purpose
Keep locale message files synchronized.

## load
- overlay for supported locales and message paths

## scope
- Locale/message files only.

## deny
- Source code edits unless user requests.
- Removing keys without usage check.

## procedure
1. Read all locale files.
2. Add/update same keys in same order.
3. Preserve JSON formatting.
4. Validate JSON syntax.

## done
- Locale files synced.
- JSON validation passes.
