# Changelog

All notable changes to this project should be documented in this file.

## v1.0.0 - 2026-04-10

Initial public release of AutoTDP.

Highlights:

- Added AMD handheld and laptop profiles through `known_devices.json`
- Added selectable runtime modes: `silent`, `battery`, `balanced`, `performance`, and `turbo`
- Added Steam launch wrapper support with `-- %command%`
- Added single-run CLI overrides with `--override KEY=VALUE`
- Added game-aware tuning through `game_profiles.json`
- Added automatic game detection using Steam AppID, executable name, and Wine/Proton fallback detection
- Added deterministic configuration priority to resolve contradictions between defaults, device profiles, game profiles, modes, and explicit overrides
- Published `v1.0.0` GitHub release assets for direct download
