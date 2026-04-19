import asyncio
import copy
import json
import os
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from html import unescape
from typing import Any, Dict, List, Optional, Tuple

import decky


DEFAULT_CONFIG: Dict[str, Any] = {
    "MIN_TDP": 5000,
    "DEFAULT_TDP": 10000,
    "MAX_CPU_TDP": 18000,
    "STEP_TDP": 1000,
    "RYZENADJ_EXEC": "ryzenadj",
    "RYZENADJ_DELAY": 4,
    "MONITOR_INTERVAL": 5,
    "STABLE_SAMPLE_COUNT": 2,
    "BATTERY_MAX_TDP": 18000,
    "PERFORMANCE_MODE": "balanced",
    "DESIRED_FPS": 60,
}

PERFORMANCE_MODES: Tuple[str, ...] = ("silent", "battery", "balanced", "performance", "turbo")
PROFILE_OVERRIDE_KEYS: Tuple[str, ...] = (
    "DEFAULT_TDP",
    "BATTERY_MAX_TDP",
    "MONITOR_INTERVAL",
    "PERFORMANCE_MODE",
    "DESIRED_FPS",
)
PLUGIN_DEFAULTS: Dict[str, Any] = {
    "enabled": False,
    "device_profile": "generic",
    "performance_mode": "balanced",
    "profile_overrides": {},
    "game_overrides": {},
    "auto_save_game_profiles": True,
    "auto_battery_switch": True,
    "battery_mode": "battery",
    "battery_low_mode": "silent",
    "battery_low_threshold": 25,
    "desired_fps": 60,
    "desired_fps_enabled": False,
    "hhd_compatibility_mode": True,
    "restore_hhd_tdp_on_disable": True,
    "steamdb_cache": {},
    "hhd_auto_disabled_tdp": False,
    "hhd_previous_tdp_enabled": None,
}


class Plugin:
    def __init__(self) -> None:
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.monitor_task: Optional[asyncio.Task[Any]] = None
        self.plugin_dir = os.path.dirname(os.path.abspath(__file__))
        user_home = os.path.expanduser("~")
        fallback_settings_dir = os.path.join(user_home, ".config", "autotdp-decky")
        fallback_runtime_dir = os.path.join(user_home, ".local", "share", "autotdp-decky")
        fallback_logs_dir = os.path.join(user_home, ".local", "state", "autotdp-decky")
        self.settings_dir = getattr(decky, "decky_SETTINGS_DIR", None) or getattr(decky, "decky_settings_dir", None) or getattr(decky, "DECKY_SETTINGS_DIR", None) or fallback_settings_dir
        self.runtime_dir = getattr(decky, "decky_RUNTIME_DIR", None) or getattr(decky, "decky_runtime_dir", None) or getattr(decky, "DECKY_RUNTIME_DIR", None) or fallback_runtime_dir
        self.logs_dir = getattr(decky, "decky_LOG_DIR", None) or getattr(decky, "decky_log_dir", None) or getattr(decky, "DECKY_LOG_DIR", None) or fallback_logs_dir
        self.settings_path = os.path.join(self.settings_dir, "autotdp_settings.json")
        self.device_profiles_path = os.path.join(self.plugin_dir, "known_devices.json")
        self.game_profiles_path = os.path.join(self.plugin_dir, "game_profiles.json")

        self.settings: Dict[str, Any] = {}
        self.device_profiles: Dict[str, Any] = {}
        self.game_profiles: Dict[str, Any] = {}
        self.current_state: Dict[str, Any] = {
            "enabled": False,
            "current_tdp": None,
            "cpu_usage": 0,
            "external_power": None,
            "active_game": None,
            "active_device_profile": None,
            "resolved_config": copy.deepcopy(DEFAULT_CONFIG),
            "battery": {},
            "hhd": {},
        }
        self._candidate_tdp: Optional[int] = None
        self._stable_samples = 0
        self._last_adjustment = 0.0

    async def _main(self):
        self.loop = asyncio.get_event_loop()
        os.makedirs(self.settings_dir, exist_ok=True)
        os.makedirs(self.runtime_dir, exist_ok=True)
        os.makedirs(self.logs_dir, exist_ok=True)
        self._load_profiles()
        self._load_settings()
        self._refresh_state()
        self.monitor_task = self.loop.create_task(self._monitor_loop())
        decky.logger.info("AutoTDP Decky plugin loaded")

    async def _unload(self):
        if self.monitor_task is not None:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass

        if self.current_state.get("current_tdp") is not None:
            config = self.current_state.get("resolved_config", DEFAULT_CONFIG)
            self._set_tdp_sync(int(config.get("ACTIVE_DEFAULT_TDP", config.get("DEFAULT_TDP", 10000))))

        self._restore_hhd_tdp_if_needed()
        decky.logger.info("AutoTDP Decky plugin unloaded")

    async def _uninstall(self):
        await self._unload()

    async def get_state(self) -> Dict[str, Any]:
        self._refresh_state()
        return self._compose_state()

    async def set_enabled(self, enabled: bool) -> Dict[str, Any]:
        self.settings["enabled"] = bool(enabled)
        self._save_settings()
        self._refresh_state()
        if enabled:
            self._ensure_hhd_compatibility(force=False)
        else:
            self._restore_hhd_tdp_if_needed()
        self._refresh_state()
        return self._compose_state()

    async def set_device_profile(self, profile: str) -> Dict[str, Any]:
        self.settings["device_profile"] = profile
        self._save_settings()
        self._refresh_state()
        return self._compose_state()

    async def set_performance_mode(self, mode: str) -> Dict[str, Any]:
        if mode not in PERFORMANCE_MODES:
            raise ValueError(f"Unknown mode: {mode}")
        self.settings["performance_mode"] = mode
        self._save_settings()
        self._refresh_state()
        return self._compose_state()

    async def set_profile_override(self, key: str, value: Optional[int]) -> Dict[str, Any]:
        if key not in PROFILE_OVERRIDE_KEYS:
            raise ValueError(f"Unsupported profile override key: {key}")

        target_game = self.current_state.get("active_game") if self.settings.get("auto_save_game_profiles", True) else None
        if target_game:
            target_key = self._build_game_override_key(target_game)
            game_overrides = self.settings.setdefault("game_overrides", {})
            entry = game_overrides.setdefault(target_key, {})
            if value is None:
                entry.pop(key, None)
            else:
                entry[key] = int(value) if key != "PERFORMANCE_MODE" else value
            if not entry:
                game_overrides.pop(target_key, None)
        else:
            overrides = self.settings.setdefault("profile_overrides", {})
            if value is None:
                overrides.pop(key, None)
            else:
                overrides[key] = int(value) if key != "PERFORMANCE_MODE" else value

        self._save_settings()
        self._refresh_state()
        return self._compose_state()

    async def set_plugin_settings(self, patch: Dict[str, Any]) -> Dict[str, Any]:
        for key, value in patch.items():
            if key in {
                "auto_save_game_profiles",
                "auto_battery_switch",
                "desired_fps_enabled",
                "hhd_compatibility_mode",
                "restore_hhd_tdp_on_disable",
            }:
                self.settings[key] = bool(value)
            elif key in {"battery_low_threshold", "desired_fps"}:
                self.settings[key] = int(value)
            elif key in {"battery_mode", "battery_low_mode"}:
                if value not in PERFORMANCE_MODES:
                    raise ValueError(f"Unknown mode: {value}")
                self.settings[key] = value

        self._save_settings()
        self._refresh_state()
        if self.settings.get("enabled"):
            self._ensure_hhd_compatibility(force=False)
        return self._compose_state()

    async def update_active_game_profile(self, patch: Dict[str, Any]) -> Dict[str, Any]:
        active_game = self._detect_active_game()
        if not active_game:
            raise ValueError("No active game detected")

        target_key = self._build_game_override_key(active_game)
        game_overrides = self.settings.setdefault("game_overrides", {})
        entry = game_overrides.setdefault(target_key, {})

        for key, value in patch.items():
            if key == "clear" and value:
                game_overrides.pop(target_key, None)
                continue
            if key not in PROFILE_OVERRIDE_KEYS:
                continue
            if value is None or value == "":
                entry.pop(key, None)
            elif key == "PERFORMANCE_MODE":
                if value not in PERFORMANCE_MODES:
                    raise ValueError(f"Unknown mode: {value}")
                entry[key] = value
            else:
                entry[key] = int(value)

        if target_key in game_overrides and not game_overrides[target_key]:
            game_overrides.pop(target_key, None)

        self._save_settings()
        self._refresh_state()
        return self._compose_state()

    async def sync_hhd_tdp(self, enable_hhd_tdp: bool) -> Dict[str, Any]:
        self._set_hhd_tdp_enabled(enable_hhd_tdp)
        if enable_hhd_tdp:
            self.settings["hhd_auto_disabled_tdp"] = False
            self.settings["hhd_previous_tdp_enabled"] = None
        else:
            self.settings["hhd_auto_disabled_tdp"] = True
            self.settings["hhd_previous_tdp_enabled"] = True
        self._save_settings()
        self._refresh_state()
        return self._compose_state()

    def _load_profiles(self) -> None:
        self.device_profiles = self._read_json_file(self.device_profiles_path, {"profiles": {}})
        self.game_profiles = self._read_json_file(
            self.game_profiles_path,
            {"steam_appids": {}, "executables": {}, "launcher_types": {}, "profiles": {}},
        )

    def _load_settings(self) -> None:
        self.settings = self._read_json_file(self.settings_path, copy.deepcopy(PLUGIN_DEFAULTS))
        for key, value in PLUGIN_DEFAULTS.items():
            self.settings.setdefault(key, copy.deepcopy(value))

    def _save_settings(self) -> None:
        with open(self.settings_path, "w", encoding="utf-8") as handle:
            json.dump(self.settings, handle, indent=2, sort_keys=True)

    def _read_json_file(self, path: str, fallback: Dict[str, Any]) -> Dict[str, Any]:
        try:
            with open(path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except Exception:
            return copy.deepcopy(fallback)

    def _compose_state(self) -> Dict[str, Any]:
        return {
            "settings": self.settings,
            "profiles": self._list_device_profiles(),
            "modes": list(PERFORMANCE_MODES),
            "gameProfiles": self.game_profiles,
            "state": self.current_state,
        }

    def _list_device_profiles(self) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        for key, value in self.device_profiles.get("profiles", {}).items():
            items.append(
                {
                    "key": key,
                    "display_name": value.get("display_name", key),
                    "supported": value.get("supported", True),
                    "aliases": value.get("aliases", []),
                    "notes": value.get("notes", ""),
                }
            )
        items.sort(key=lambda item: item["display_name"].lower())
        return items

    def _resolve_device_profile_name(self, requested_name: str) -> Optional[str]:
        profiles = self.device_profiles.get("profiles", {})
        if requested_name in profiles:
            return requested_name
        for key, value in profiles.items():
            if requested_name in value.get("aliases", []):
                return key
        return None

    def _apply_device_profile(self, config: Dict[str, Any], profile_name: str) -> Dict[str, Any]:
        resolved_name = self._resolve_device_profile_name(profile_name)
        if not resolved_name:
            raise ValueError(f"Unknown device profile: {profile_name}")

        profile = self.device_profiles.get("profiles", {}).get(resolved_name, {})
        if not profile.get("supported", True):
            raise ValueError(profile.get("unsupported_reason", "Unsupported device profile"))

        merged = copy.deepcopy(config)
        merged.update(profile.get("config", {}))
        merged["DEVICE_PROFILE"] = resolved_name
        return merged

    def _coerce_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        coerced = copy.deepcopy(config)
        for key in (
            "MIN_TDP",
            "DEFAULT_TDP",
            "MAX_CPU_TDP",
            "STEP_TDP",
            "RYZENADJ_DELAY",
            "MONITOR_INTERVAL",
            "STABLE_SAMPLE_COUNT",
            "BATTERY_MAX_TDP",
            "DESIRED_FPS",
        ):
            coerced[key] = int(coerced[key])
        coerced["PERFORMANCE_MODE"] = str(coerced["PERFORMANCE_MODE"])
        coerced["RYZENADJ_EXEC"] = str(coerced["RYZENADJ_EXEC"])
        return coerced

    def _align_to_step(self, value: int, step: int, minimum: int) -> int:
        if value < minimum:
            value = minimum
        return int((value // step) * step)

    def _apply_mode(self, config: Dict[str, Any], mode: str) -> Dict[str, Any]:
        min_tdp = int(config["MIN_TDP"])

        def scale(value: int, percent: int) -> int:
            scaled = max(min_tdp, int((value * percent) / 100))
            return self._align_to_step(scaled, int(config["STEP_TDP"]), min_tdp)

        active_max = int(config["MAX_CPU_TDP"])
        active_default = int(config["DEFAULT_TDP"])
        active_battery = int(config["BATTERY_MAX_TDP"])
        threshold_offset = 0
        active_delay = int(config["RYZENADJ_DELAY"])
        active_interval = int(config["MONITOR_INTERVAL"])
        active_stable = int(config["STABLE_SAMPLE_COUNT"])

        if mode == "silent":
            active_max = scale(active_max, 60)
            active_default = scale(active_default, 75)
            active_battery = scale(active_battery, 75)
            threshold_offset = 15
            active_delay += 2
            active_stable += 1
        elif mode == "battery":
            active_max = scale(active_max, 75)
            active_default = scale(active_default, 85)
            active_battery = scale(active_battery, 85)
            threshold_offset = 8
            active_delay += 1
        elif mode == "performance":
            active_default = scale(active_default, 115)
            threshold_offset = -8
            active_delay = max(1, active_delay - 1)
            active_stable = 1
        elif mode == "turbo":
            active_default = scale(active_default, 130)
            active_battery = scale(active_battery, 110)
            threshold_offset = -15
            active_delay = max(1, active_delay - 2)
            active_interval = max(1, active_interval - 1)
            active_stable = 1

        active_default = min(active_default, active_max)
        active_battery = min(active_battery, active_max)
        out = copy.deepcopy(config)
        out.update(
            {
                "ACTIVE_MODE": mode,
                "ACTIVE_MAX_TDP": active_max,
                "ACTIVE_DEFAULT_TDP": active_default,
                "ACTIVE_BATTERY_MAX_TDP": active_battery,
                "ACTIVE_THRESHOLD_OFFSET": threshold_offset,
                "ACTIVE_RYZENADJ_DELAY": max(1, active_delay),
                "ACTIVE_MONITOR_INTERVAL": max(1, active_interval),
                "ACTIVE_STABLE_SAMPLE_COUNT": max(1, active_stable),
            }
        )
        return out

    def _apply_desired_fps(self, config: Dict[str, Any], fps_value: int, enabled: bool) -> Dict[str, Any]:
        out = copy.deepcopy(config)
        out["DESIRED_FPS"] = fps_value
        out["DESIRED_FPS_ENABLED"] = enabled
        if not enabled:
            return out

        fps = max(30, min(120, int(fps_value)))
        if fps <= 30:
            percent = 70
        elif fps <= 40:
            percent = 80
        elif fps <= 45:
            percent = 87
        elif fps <= 50:
            percent = 93
        elif fps <= 60:
            percent = 100
        elif fps <= 72:
            percent = 105
        elif fps <= 90:
            percent = 110
        else:
            percent = 115

        min_tdp = int(out["MIN_TDP"])
        step = int(out["STEP_TDP"])
        out["ACTIVE_MAX_TDP"] = self._align_to_step(max(min_tdp, int(out["ACTIVE_MAX_TDP"] * percent / 100)), step, min_tdp)
        out["ACTIVE_DEFAULT_TDP"] = min(
            out["ACTIVE_MAX_TDP"],
            self._align_to_step(max(min_tdp, int(out["ACTIVE_DEFAULT_TDP"] * percent / 100)), step, min_tdp),
        )
        out["ACTIVE_BATTERY_MAX_TDP"] = min(
            out["ACTIVE_MAX_TDP"],
            self._align_to_step(max(min_tdp, int(out["ACTIVE_BATTERY_MAX_TDP"] * percent / 100)), step, min_tdp),
        )
        return out

    def _resolve_runtime_config(self, active_game: Optional[Dict[str, Any]], battery: Dict[str, Any]) -> Dict[str, Any]:
        config = copy.deepcopy(DEFAULT_CONFIG)
        config = self._apply_device_profile(config, str(self.settings.get("device_profile", "generic")))
        config["PERFORMANCE_MODE"] = str(self.settings.get("performance_mode", config["PERFORMANCE_MODE"]))
        config["DESIRED_FPS"] = int(self.settings.get("desired_fps", config["DESIRED_FPS"]))

        for key, value in self.settings.get("profile_overrides", {}).items():
            config[key] = value

        if active_game and active_game.get("profile"):
            bundled = self.game_profiles.get("profiles", {}).get(active_game["profile"], {})
            config.update(bundled.get("config", {}))

        if active_game:
            game_override_key = self._build_game_override_key(active_game)
            for key, value in self.settings.get("game_overrides", {}).get(game_override_key, {}).items():
                config[key] = value

        config = self._coerce_config(config)
        base_mode = config["PERFORMANCE_MODE"]

        if self.settings.get("auto_battery_switch", True) and battery.get("status") == "Discharging":
            if battery.get("percent") is not None and battery["percent"] <= int(self.settings.get("battery_low_threshold", 25)):
                base_mode = str(self.settings.get("battery_low_mode", "silent"))
            else:
                base_mode = str(self.settings.get("battery_mode", "battery"))

        config = self._apply_mode(config, base_mode)
        config = self._apply_desired_fps(
            config,
            int(config.get("DESIRED_FPS", self.settings.get("desired_fps", 60))),
            bool(self.settings.get("desired_fps_enabled", False)),
        )
        return config

    def _read_cpu_times(self) -> Tuple[int, int]:
        with open("/proc/stat", "r", encoding="utf-8") as handle:
            parts = handle.readline().split()
        values = [int(part) for part in parts[1:9]]
        total = sum(values)
        idle_total = values[3] + values[4]
        return total, idle_total

    def _get_cpu_usage(self, previous_total: int, previous_idle: int) -> Tuple[int, int, int]:
        current_total, current_idle = self._read_cpu_times()
        total_delta = current_total - previous_total
        idle_delta = current_idle - previous_idle
        if total_delta <= 0:
            return 0, current_total, current_idle
        busy_delta = max(0, total_delta - idle_delta)
        return int((busy_delta * 100) / total_delta), current_total, current_idle

    def _read_battery(self) -> Dict[str, Any]:
        power_root = "/sys/class/power_supply"
        empty = {
            "present": False,
            "percent": None,
            "status": None,
            "power_w": None,
            "energy_wh": None,
            "seconds_remaining": None,
            "formatted_time_remaining": None,
        }
        if not os.path.isdir(power_root):
            return empty

        battery_path = None
        for name in os.listdir(power_root):
            candidate = os.path.join(power_root, name)
            type_path = os.path.join(candidate, "type")
            if not os.path.isfile(type_path):
                continue
            try:
                with open(type_path, "r", encoding="utf-8") as handle:
                    if handle.read().strip() == "Battery":
                        battery_path = candidate
                        break
            except OSError:
                continue

        if not battery_path:
            return empty

        def read_value(*filenames: str) -> Optional[float]:
            for filename in filenames:
                path = os.path.join(battery_path, filename)
                if not os.path.isfile(path):
                    continue
                try:
                    with open(path, "r", encoding="utf-8") as handle:
                        raw = handle.read().strip()
                    if raw == "":
                        continue
                    return float(raw)
                except OSError:
                    continue
            return None

        percent = read_value("capacity")
        status = None
        status_path = os.path.join(battery_path, "status")
        if os.path.isfile(status_path):
            try:
                with open(status_path, "r", encoding="utf-8") as handle:
                    status = handle.read().strip()
            except OSError:
                status = None

        energy_now = read_value("energy_now", "charge_now")
        energy_full = read_value("energy_full", "charge_full")
        power_now = read_value("power_now")
        current_now = read_value("current_now")
        voltage_now = read_value("voltage_now")

        if power_now is None and current_now is not None and voltage_now is not None:
            power_now = current_now * voltage_now / 1000000000000.0
        elif power_now is not None:
            power_now = power_now / 1000000.0

        energy_wh = None
        if energy_now is not None:
            if os.path.isfile(os.path.join(battery_path, "energy_now")):
                energy_wh = energy_now / 1000000.0
            elif voltage_now is not None:
                energy_wh = energy_now * voltage_now / 1000000000000.0

        seconds_remaining = None
        if status == "Discharging" and power_now and power_now > 0 and energy_wh and energy_wh > 0:
            seconds_remaining = int((energy_wh / power_now) * 3600)
        elif status == "Charging" and power_now and power_now > 0 and energy_full and energy_now is not None:
            if os.path.isfile(os.path.join(battery_path, "energy_full")):
                remaining_wh = max(0.0, (energy_full - energy_now) / 1000000.0)
            elif voltage_now is not None:
                remaining_wh = max(0.0, (energy_full - energy_now) * voltage_now / 1000000000000.0)
            else:
                remaining_wh = 0.0
            if remaining_wh > 0:
                seconds_remaining = int((remaining_wh / power_now) * 3600)

        formatted = None
        if seconds_remaining is not None:
            hours = seconds_remaining // 3600
            minutes = (seconds_remaining % 3600) // 60
            formatted = f"{hours}h {minutes}m"

        return {
            "present": True,
            "percent": int(percent) if percent is not None else None,
            "status": status,
            "power_w": round(power_now, 2) if power_now is not None else None,
            "energy_wh": round(energy_wh, 2) if energy_wh is not None else None,
            "seconds_remaining": seconds_remaining,
            "formatted_time_remaining": formatted,
        }

    def _is_on_external_power(self) -> bool:
        power_root = "/sys/class/power_supply"
        if not os.path.isdir(power_root):
            return False
        for name in os.listdir(power_root):
            base = os.path.join(power_root, name)
            type_path = os.path.join(base, "type")
            online_path = os.path.join(base, "online")
            if not (os.path.isfile(type_path) and os.path.isfile(online_path)):
                continue
            try:
                with open(type_path, "r", encoding="utf-8") as handle:
                    supply_type = handle.read().strip()
                if supply_type not in {"Mains", "USB", "USB_C", "USB_PD", "Wireless"}:
                    continue
                with open(online_path, "r", encoding="utf-8") as handle:
                    online = handle.read().strip()
                if online == "1":
                    return True
            except OSError:
                continue
        return False

    def _command_exists(self, command: str) -> bool:
        return shutil.which(command) is not None

    def _set_tdp_sync(self, value: int) -> None:
        command = str(self.current_state.get("resolved_config", {}).get("RYZENADJ_EXEC", DEFAULT_CONFIG["RYZENADJ_EXEC"]))
        if not self._command_exists(command):
            decky.logger.warning("ryzenadj not found, skipping TDP update")
            return
        try:
            subprocess.run(
                [command, "--stapm-limit", str(value), "--fast-limit", str(value), "--slow-limit", str(value)],
                check=False,
                capture_output=True,
                text=True,
            )
        except Exception as error:
            decky.logger.error(f"Failed to set TDP: {error}")

    def _get_hhd_state(self) -> Dict[str, Any]:
        state = {
            "available": self._command_exists("hhdctl"),
            "service_active": False,
            "tdp_enabled": None,
            "compatibility_mode": bool(self.settings.get("hhd_compatibility_mode", True)),
            "auto_disabled_by_plugin": bool(self.settings.get("hhd_auto_disabled_tdp", False)),
        }
        if not state["available"]:
            return state

        try:
            service = subprocess.run(
                ["systemctl", "list-units", "--type=service", "--all", "hhd@*.service", "hhd_local@*.service"],
                check=False,
                capture_output=True,
                text=True,
            )
            state["service_active"] = "active" in service.stdout
        except Exception:
            state["service_active"] = False

        try:
            result = subprocess.run(
                ["hhdctl", "get", "hhd.settings.tdp_enable", "--values", "--sep", ""],
                check=False,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                state["tdp_enabled"] = result.stdout.strip().lower() == "true"
        except Exception:
            state["tdp_enabled"] = None

        return state

    def _set_hhd_tdp_enabled(self, enabled: bool) -> bool:
        if not self._command_exists("hhdctl"):
            return False
        try:
            result = subprocess.run(
                ["hhdctl", "set", f"hhd.settings.tdp_enable={'true' if enabled else 'false'}"],
                check=False,
                capture_output=True,
                text=True,
            )
            return result.returncode == 0
        except Exception as error:
            decky.logger.error(f"Failed to set HHD TDP state: {error}")
            return False

    def _ensure_hhd_compatibility(self, force: bool) -> None:
        if not self.settings.get("enabled", False):
            return
        if not self.settings.get("hhd_compatibility_mode", True):
            return
        hhd_state = self._get_hhd_state()
        if not hhd_state.get("available"):
            return
        if hhd_state.get("tdp_enabled") is True or force:
            if hhd_state.get("tdp_enabled") is True:
                self.settings["hhd_previous_tdp_enabled"] = True
            if self._set_hhd_tdp_enabled(False):
                self.settings["hhd_auto_disabled_tdp"] = True
                self._save_settings()

    def _restore_hhd_tdp_if_needed(self) -> None:
        if not self.settings.get("restore_hhd_tdp_on_disable", True):
            return
        if not self.settings.get("hhd_auto_disabled_tdp", False):
            return
        if not self.settings.get("hhd_previous_tdp_enabled"):
            return
        if self._set_hhd_tdp_enabled(True):
            self.settings["hhd_auto_disabled_tdp"] = False
            self.settings["hhd_previous_tdp_enabled"] = None
            self._save_settings()

    def _steamdb_cache_get(self, appid: str) -> Optional[Dict[str, Any]]:
        cache = self.settings.setdefault("steamdb_cache", {})
        entry = cache.get(appid)
        if not entry:
            return None
        return entry

    def _steamdb_cache_set(self, appid: str, data: Dict[str, Any]) -> Dict[str, Any]:
        cache = self.settings.setdefault("steamdb_cache", {})
        cache[appid] = data
        self._save_settings()
        return data

    def _fetch_steamdb_info(self, appid: str) -> Dict[str, Any]:
        cached = self._steamdb_cache_get(appid)
        if cached:
            return cached

        steamdb_url = f"https://steamdb.info/app/{appid}/"
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AutoTDP-Decky/1.2.0",
        }
        title = None

        try:
            request = urllib.request.Request(steamdb_url, headers=headers)
            with urllib.request.urlopen(request, timeout=5) as response:
                html = response.read().decode("utf-8", errors="ignore")
            title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
            if title_match:
                raw_title = unescape(title_match.group(1)).strip()
                title = re.sub(r"\s*[\u00b7\-].*SteamDB.*$", "", raw_title).strip()
        except (urllib.error.URLError, TimeoutError, ValueError):
            title = None

        if not title:
            try:
                store_url = f"https://store.steampowered.com/api/appdetails?appids={urllib.parse.quote(appid)}&l=english"
                request = urllib.request.Request(store_url, headers=headers)
                with urllib.request.urlopen(request, timeout=5) as response:
                    payload = json.loads(response.read().decode("utf-8", errors="ignore"))
                entry = payload.get(appid, {})
                if entry.get("success") and entry.get("data", {}).get("name"):
                    title = str(entry["data"]["name"])
            except (urllib.error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
                title = None

        data = {
            "appid": appid,
            "name": title or f"Steam App {appid}",
            "steamdb_url": steamdb_url,
        }
        return self._steamdb_cache_set(appid, data)

    def _iter_processes(self) -> List[int]:
        out: List[int] = []
        for name in os.listdir("/proc"):
            if name.isdigit():
                out.append(int(name))
        return out

    def _read_process_environ_value(self, pid: int, env_key: str) -> Optional[str]:
        try:
            with open(f"/proc/{pid}/environ", "rb") as handle:
                raw = handle.read().split(b"\0")
            for item in raw:
                if item.startswith(env_key.encode("utf-8") + b"="):
                    return item.split(b"=", 1)[1].decode("utf-8", errors="ignore")
        except OSError:
            return None
        return None

    def _detect_steam_appid(self) -> Optional[str]:
        for key in ("SteamAppId", "SteamGameId", "STEAM_COMPAT_APP_ID"):
            candidate = os.environ.get(key)
            if candidate and candidate != "0":
                return candidate

        for pid in self._iter_processes():
            for key in ("SteamAppId", "SteamGameId", "STEAM_COMPAT_APP_ID"):
                candidate = self._read_process_environ_value(pid, key)
                if candidate and candidate != "0":
                    return candidate
        return None

    def _detect_executable_name(self) -> Optional[str]:
        for pid in self._iter_processes():
            try:
                with open(f"/proc/{pid}/cmdline", "rb") as handle:
                    parts = [part.decode("utf-8", errors="ignore") for part in handle.read().split(b"\0") if part]
            except OSError:
                continue
            for part in parts:
                if part.lower().endswith(".exe"):
                    return os.path.basename(part).lower()
        return None

    def _detect_launcher_type(self) -> Optional[str]:
        for pid in self._iter_processes():
            try:
                with open(f"/proc/{pid}/comm", "r", encoding="utf-8") as handle:
                    comm = handle.read().strip().lower()
            except OSError:
                continue
            if comm in {"wineserver", "wine", "wine64", "wine64-preloader", "winedevice"}:
                return "wine"
            if comm in {"steam", "steamwebhelper"}:
                return "steam"
        return None

    def _lookup_bundled_game_profile(self, appid: Optional[str], executable: Optional[str], launcher: Optional[str]) -> Optional[Tuple[str, str, str]]:
        if appid:
            profile_name = self.game_profiles.get("steam_appids", {}).get(appid, {}).get("profile")
            if profile_name:
                return "steam_appid", appid, profile_name
        if executable:
            profile_name = self.game_profiles.get("executables", {}).get(executable, {}).get("profile")
            if profile_name:
                return "executable", executable, profile_name
        if launcher:
            profile_name = self.game_profiles.get("launcher_types", {}).get(launcher, {}).get("profile")
            if profile_name:
                return "launcher_type", launcher, profile_name
        return None

    def _detect_active_game(self) -> Optional[Dict[str, Any]]:
        appid = self._detect_steam_appid()
        executable = self._detect_executable_name()
        launcher = self._detect_launcher_type()
        profile_info = self._lookup_bundled_game_profile(appid, executable, launcher)

        if not appid and not executable and not launcher:
            return None

        active: Dict[str, Any] = {
            "source": None,
            "match": None,
            "profile": None,
            "display_name": None,
            "steam_appid": appid,
            "steamdb_name": None,
            "steamdb_url": None,
        }

        if profile_info:
            active["source"], active["match"], active["profile"] = profile_info
        elif appid:
            active["source"] = "steam_appid"
            active["match"] = appid
        elif executable:
            active["source"] = "executable"
            active["match"] = executable
        else:
            active["source"] = "launcher_type"
            active["match"] = launcher

        if appid:
            metadata = self._fetch_steamdb_info(appid)
            active["steamdb_name"] = metadata.get("name")
            active["steamdb_url"] = metadata.get("steamdb_url")

        if active.get("steamdb_name"):
            active["display_name"] = active["steamdb_name"]
        elif active.get("profile"):
            active["display_name"] = self.game_profiles.get("profiles", {}).get(active["profile"], {}).get("display_name", active["match"])
        else:
            active["display_name"] = active["match"]

        return active

    def _build_game_override_key(self, active_game: Dict[str, Any]) -> str:
        return f"{active_game['source']}:{active_game['match']}"

    def _determine_tdp(self, cpu_usage: int, config: Dict[str, Any]) -> int:
        active_max = int(config["ACTIVE_MAX_TDP"])
        tdp_values = [
            int(config["MIN_TDP"]),
            int(active_max * 1 / 8),
            int(active_max * 1 / 4),
            int(active_max * 3 / 8),
            int(active_max * 1 / 2),
            int(active_max * 5 / 8),
            int(active_max * 3 / 4),
            int(active_max * 7 / 8),
            active_max,
        ]
        thresholds = [0, 10, 20, 30, 40, 50, 60, 70, 80]
        tdp = int(config["MIN_TDP"])
        for index, threshold in enumerate(thresholds):
            adjusted = max(0, min(100, threshold + int(config["ACTIVE_THRESHOLD_OFFSET"])))
            if cpu_usage > adjusted:
                tdp = tdp_values[index]
        return self._align_to_step(tdp, int(config["STEP_TDP"]), int(config["MIN_TDP"]))

    def _apply_power_limit(self, requested_tdp: int, config: Dict[str, Any], external_power: bool) -> int:
        if external_power:
            return requested_tdp
        return min(requested_tdp, int(config["ACTIVE_BATTERY_MAX_TDP"]))

    def _refresh_state(self) -> None:
        battery = self._read_battery()
        active_game = self._detect_active_game()
        config = self._resolve_runtime_config(active_game, battery)
        self.current_state["enabled"] = bool(self.settings.get("enabled", False))
        self.current_state["battery"] = battery
        self.current_state["active_game"] = active_game
        self.current_state["active_device_profile"] = config.get("DEVICE_PROFILE")
        self.current_state["resolved_config"] = config
        self.current_state["hhd"] = self._get_hhd_state()
        self.current_state["external_power"] = self._is_on_external_power()

    async def _monitor_loop(self) -> None:
        previous_total, previous_idle = self._read_cpu_times()
        while True:
            self._refresh_state()
            if not self.settings.get("enabled", False):
                self._candidate_tdp = None
                self._stable_samples = 0
                await asyncio.sleep(1)
                previous_total, previous_idle = self._read_cpu_times()
                continue

            self._ensure_hhd_compatibility(force=False)
            config = self.current_state["resolved_config"]
            await asyncio.sleep(int(config["ACTIVE_MONITOR_INTERVAL"]))

            cpu_usage, previous_total, previous_idle = self._get_cpu_usage(previous_total, previous_idle)
            self.current_state["cpu_usage"] = cpu_usage

            external_power = self._is_on_external_power()
            self.current_state["external_power"] = external_power
            target_tdp = self._determine_tdp(cpu_usage, config)
            limited_tdp = self._apply_power_limit(target_tdp, config, external_power)

            current_tdp = self.current_state.get("current_tdp")
            if current_tdp is None:
                current_tdp = int(config["ACTIVE_DEFAULT_TDP"])
                self.current_state["current_tdp"] = current_tdp

            if limited_tdp == current_tdp:
                self._candidate_tdp = limited_tdp
                self._stable_samples = 0
                await decky.emit("autotdp_state", self.current_state)
                continue

            if limited_tdp == self._candidate_tdp:
                self._stable_samples += 1
            else:
                self._candidate_tdp = limited_tdp
                self._stable_samples = 1

            if self._stable_samples < int(config["ACTIVE_STABLE_SAMPLE_COUNT"]):
                await decky.emit("autotdp_state", self.current_state)
                continue

            now = time.time()
            if now - self._last_adjustment < int(config["ACTIVE_RYZENADJ_DELAY"]):
                await decky.emit("autotdp_state", self.current_state)
                continue

            await asyncio.to_thread(self._set_tdp_sync, limited_tdp)
            self.current_state["current_tdp"] = limited_tdp
            self._last_adjustment = now
            await decky.emit("autotdp_state", self.current_state)
