# AutoTDP

AutoTDP is a Bash script that adjusts AMD APU TDP dynamically with `ryzenadj`. It is designed for Linux handheld PCs and uses real CPU utilization instead of raw load average, which gives more stable behavior on devices like Steam Deck, ROG Ally and Legion Go.

## Features

- Uses CPU utilization sampled from `/proc/stat` instead of relying on `loadavg`
- Reduces TDP oscillation with a stable-sample requirement before applying changes
- Supports an optional battery cap for handheld-friendly behavior away from the charger
- Loads device-specific presets from `known_devices.json`
- Supports custom profile JSON files for user-defined tuning
- Keeps configuration in `/etc/AutoTDP/AutoTDP.config`
- Logs all actions to `/etc/AutoTDP/logs/`
- Can install itself as an optional `systemd` service

## Linux Compatibility

The runtime logic is distro-agnostic and relies on standard Linux interfaces:

- `/proc/stat` for CPU utilization sampling
- `/sys/class/power_supply` for charger detection
- `ryzenadj` for AMD APU power control

That means the script can run on CachyOS, SteamOS, Bazzite, Nobara, Arch, Fedora-based handheld images, or most other Linux distributions, as long as the required tools are installed.

`systemd` is only required if you want to use `--install`. Running the script directly does not depend on a specific distro.

## Requirements

Install these commands on your system:

- `bash`
- `jq`
- `sudo`
- `ryzenadj`

## Default Config

Default config file path: `/etc/AutoTDP/AutoTDP.config`

```ini
MIN_TDP=5000
DEFAULT_TDP=10000
MAX_CPU_TDP=18000
STEP_TDP=1000
RYZENADJ_EXEC=ryzenadj
RYZENADJ_DELAY=4
MONITOR_INTERVAL=5
STABLE_SAMPLE_COUNT=2
BATTERY_MAX_TDP=18000
DEVICE_PROFILE=generic
DEVICE_PROFILE_FILE=/etc/AutoTDP/known_devices.json
```

Config meanings:

- `RYZENADJ_DELAY`: minimum seconds between TDP changes
- `MONITOR_INTERVAL`: CPU sampling window in seconds
- `STABLE_SAMPLE_COUNT`: how many consecutive matching samples are required before changing TDP
- `BATTERY_MAX_TDP`: max TDP when no external power is detected
- `DEVICE_PROFILE`: selected profile key or alias from the JSON file
- `DEVICE_PROFILE_FILE`: JSON file to read profiles from

## Known Device Profiles

The repo includes `known_devices.json` with presets for popular handheld PCs, including:

- `steam_deck`
- `rog_ally_z1_extreme`
- `rog_ally_z1`
- `legion_go_z1_extreme`
- `legion_go_z1`
- `gpd_win_4_7840u`
- `gpd_win_mini_7840u`
- `ayaneo_2s_7840u`
- `onexplayer_2_7840u`

There is also an `msi_claw_a1m` entry marked as unsupported because it uses Intel hardware and `ryzenadj` is for AMD APUs.

These presets are conservative starting points, not hard guarantees. Handheld firmware, BIOS limits, cooling and vendor EC behavior vary.

## Custom JSON Profiles

You can point AutoTDP to your own JSON file while keeping the same structure:

```json
{
  "version": 1,
  "profiles": {
    "my_handheld": {
      "display_name": "My Custom Handheld",
      "supported": true,
      "config": {
        "MIN_TDP": 6000,
        "DEFAULT_TDP": 12000,
        "MAX_CPU_TDP": 25000,
        "STEP_TDP": 1000,
        "RYZENADJ_DELAY": 4,
        "MONITOR_INTERVAL": 4,
        "STABLE_SAMPLE_COUNT": 2,
        "BATTERY_MAX_TDP": 18000
      }
    }
  }
}
```

Then set:

```ini
DEVICE_PROFILE=my_handheld
DEVICE_PROFILE_FILE=/path/to/my_profiles.json
```

## Service Installation

To install AutoTDP as a `systemd` service:

```bash
sudo ./AutoTDP.sh --install
```

Check service status with:

```bash
sudo systemctl status autotdp.service
```

## Logs

Log files are stored in `/etc/AutoTDP/logs/`.

## Notes

- AutoTDP currently targets AMD handhelds that work with `ryzenadj`.
- Device presets are intended to be editable and extended over time.
- If your handheld has unusual firmware behavior, create a custom JSON profile instead of editing the script.

## Contributing

Contributions are welcome. New handheld profiles, better conservative defaults, and distro-specific installation notes are especially useful.

