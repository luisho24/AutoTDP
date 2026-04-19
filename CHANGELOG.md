# Changelog

All notable changes to this project should be documented in this file.

## v1.2.0 - 2026-04-19

Decky plugin upgrade focused on handheld usability and HHD coexistence.

Highlights:

- Replaced quick numeric text inputs with gamepad-friendly sliders
- Removed experimental LED controls from plugin UI
- Added full-size advanced editor for automation, HHD compatibility, battery telemetry, and active game profile editing
- Added battery time estimation from live device battery telemetry
- Added automatic battery profile switching with low-battery mode support
- Added HHD compatibility mode that disables only HHD TDP control while keeping HHD controller and button features active
- Added optional automatic saving of quick profile changes to active game overrides
- Added SteamDB-backed game metadata lookup for Steam titles, with fallback to Steam store appdetails
- Added experimental desired FPS target to scale TDP heuristics

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
