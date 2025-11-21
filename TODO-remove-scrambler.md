# Remove Key Scrambler Completely

## Tasks
- [x] Delete `scripts/scramble-keys.js`
- [x] Remove scrambling logic from `.githooks/pre-push`
- [x] Verify no other references to scrambler

## Notes
- Scrambled keys in code (e.g., in `api/stock.js`) will remain scrambled after removal.
- If original keys are needed, they must be restored manually.
