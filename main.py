import asyncio
import copy
import json
import os
import shutil
import subprocess
import time
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
}

PERFORMANCE_MODES: Tuple[str, ...] = ("silent", "battery", "balanced", "performance", "turbo")
SUPPORTED_OVERRIDE_KEYS: Tuple[str, ...] = (
    "MIN_TDP",
    "DEFAULT_TDP",
    "MAX_CPU_TDP",
    "STEP_TDP",
    "RYZENADJ_EXEC",
    "RYZENADJ_DELAY",
    "MONITOR_INTERVAL",
    "STABLE_SAMPLE_COUNT",
    "BATTERY_MAX_TDP",
    "PERFORMANCE_MODE",
)


class Plugin:
    def __init__(self) -> None:
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.monitor_task: Optional[asyncio.Task[Any]] = None
        self.plugin_dir = os.path.dirname(os.path.abspath(__file__))
        self.settings_dir = getattr(decky, "decky_SETTINGS_DIR", self.plugin_dir)
        self.runtime_dir = getattr(decky, "decky_RUNTIME_DIR", self.plugin_dir)
        self.logs_dir = getattr(decky, "decky_LOG_DIR", self.plugin_dir)
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
            "led": {},
        }
        self._last_adjustment = 0.0
        self._candidate_tdp: Optional[int] = None
        self._stable_samples = 0

    async def _main(self):
        self.loop = asyncio.get_event_loop()
        os.makedirs(self.settings_dir, exist_ok=True)
        os.makedirs(self.runtime_dir, exist_ok=True)
        os.makedirs(self.logs_dir, exist_ok=True)
        self._load_profiles()
        self._load_settings()
        self._refresh_static_state()
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
            config = self._resolve_runtime_config(None)
            self._set_tdp_sync(int(config["ACTIVE_DEFAULT_TDP"]))
        decky.logger.info("AutoTDP Decky plugin unloaded")

    async def _uninstall(self):
        await self._unload()

    async def get_state(self) -> Dict[str, Any]:
        self._refresh_static_state()
        return {
            "settings": self.settings,
            "profiles": self._list_device_profiles(),
            "modes": list(PERFORMANCE_MODES),
            "gameProfiles": self.game_profiles,
            "state": self.current_state,
            "ledCapabilities": self._detect_led_capabilities(),
        }

    async def set_enabled(self, enabled: bool) -> Dict[str, Any]:
        self.settings["enabled"] = bool(enabled)
        self._save_settings()
        self._refresh_static_state()
        return await self.get_state()

    async def set_device_profile(self, profile: str) -> Dict[str, Any]:
        self.settings["device_profile"] = profile
        self._save_settings()
        self._refresh_static_state()
        return await self.get_state()

    async def set_performance_mode(self, mode: str) -> Dict[str, Any]:
        if mode not in PERFORMANCE_MODES:
            raise ValueError(f"Unknown mode: {mode}")
        self.settings["performance_mode"] = mode
        self._save_settings()
        self._refresh_static_state()
        return await self.get_state()

    async def set_override(self, key: str, value: Optional[str]) -> Dict[str, Any]:
        if key not in SUPPORTED_OVERRIDE_KEYS:
            raise ValueError(f"Unsupported override key: {key}")
        overrides = self.settings.setdefault("overrides", {})
        if value is None or value == "":
            overrides.pop(key, None)
        else:
            overrides[key] = value
        self._save_settings()
        self._refresh_static_state()
        return await self.get_state()

    async def set_current_game_override(self, patch: Dict[str, Any]) -> Dict[str, Any]:
        active_game = self._detect_active_game()
        if not active_game:
            raise ValueError("No active game detected")

        override_key = self._build_game_override_key(active_game)
        overrides = self.settings.setdefault("game_overrides", {})
        entry = overrides.setdefault(override_key, {})

        for key, value in patch.items():
            if key == "clear" and value:
                overrides.pop(override_key, None)
                break
            if key in SUPPORTED_OVERRIDE_KEYS:
                if value is None or value == "":
                    entry.pop(key, None)
                else:
                    entry[key] = value

        if override_key in overrides and not overrides[override_key]:
            overrides.pop(override_key, None)

        self._save_settings()
        self._refresh_static_state()
        return await self.get_state()

    async def cycle_led_mode(self, direction: str = "next") -> Dict[str, Any]:
        await asyncio.to_thread(self._cycle_led_mode_sync, direction)
        self._refresh_static_state()
        return await self.get_state()

    async def set_led_brightness(self, brightness: int) -> Dict[str, Any]:
        await asyncio.to_thread(self._set_led_brightness_sync, brightness)
        self._refresh_static_state()
        return await self.get_state()

    async def set_led_color(self, color: str) -> Dict[str, Any]:
        await asyncio.to_thread(self._set_led_color_sync, color)
        self._refresh_static_state()
        return await self.get_state()

    def _load_profiles(self) -> None:
        self.device_profiles = self._read_json_file(self.device_profiles_path, {"profiles": {}})
        self.game_profiles = self._read_json_file(
            self.game_profiles_path,
            {"steam_appids": {}, "executables": {}, "launcher_types": {}, "profiles": {}},
        )

    def _load_settings(self) -> None:
        self.settings = self._read_json_file(
            self.settings_path,
            {
                "enabled": False,
                "device_profile": "generic",
                "performance_mode": "balanced",
                "overrides": {},
                "game_overrides": {},
            },
        )

    def _save_settings(self) -> None:
        with open(self.settings_path, "w", encoding="utf-8") as handle:
            json.dump(self.settings, handle, indent=2, sort_keys=True)

    def _read_json_file(self, path: str, fallback: Dict[str, Any]) -> Dict[str, Any]:
        try:
            with open(path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except Exception:
            return copy.deepcopy(fallback)

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

    def _apply_profile_config(self, config: Dict[str, Any], profile_file: Dict[str, Any], profile_name: str) -> Dict[str, Any]:
        resolved_name = self._resolve_device_profile_name(profile_name)
        if not resolved_name:
            raise ValueError(f"Unknown device profile: {profile_name}")
        profile = profile_file.get("profiles", {}).get(resolved_name, {})
        if not profile.get("supported", True):
            raise ValueError(profile.get("unsupported_reason", "Unsupported device profile"))
        merged = copy.deepcopy(config)
        merged.update(profile.get("config", {}))
        merged["DEVICE_PROFILE"] = resolved_name
        return merged

    def _coerce_config_types(self, config: Dict[str, Any]) -> Dict[str, Any]:
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
        ):
            coerced[key] = int(coerced[key])
        coerced["RYZENADJ_EXEC"] = str(coerced["RYZENADJ_EXEC"])
        coerced["PERFORMANCE_MODE"] = str(coerced["PERFORMANCE_MODE"])
        return coerced

    def _apply_mode(self, config: Dict[str, Any]) -> Dict[str, Any]:
        mode = config["PERFORMANCE_MODE"]
        if mode not in PERFORMANCE_MODES:
            mode = "balanced"

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

        config = copy.deepcopy(config)
        config.update(
            {
                "ACTIVE_MAX_TDP": active_max,
                "ACTIVE_DEFAULT_TDP": active_default,
                "ACTIVE_BATTERY_MAX_TDP": active_battery,
                "ACTIVE_THRESHOLD_OFFSET": threshold_offset,
                "ACTIVE_RYZENADJ_DELAY": max(1, active_delay),
                "ACTIVE_MONITOR_INTERVAL": max(1, active_interval),
                "ACTIVE_STABLE_SAMPLE_COUNT": max(1, active_stable),
            }
        )
        return config

    def _align_to_step(self, value: int, step: int, minimum: int) -> int:
        if value < minimum:
            value = minimum
        return int((value // step) * step)

    def _detect_active_game(self) -> Optional[Dict[str, Any]]:
        steam_appid = self._detect_steam_appid()
        if steam_appid:
            profile_name = self.game_profiles.get("steam_appids", {}).get(steam_appid, {}).get("profile")
            return {
                "source": "steam_appid",
                "match": steam_appid,
                "profile": profile_name,
                "display_name": self._lookup_game_profile_name(profile_name),
            }

        executable = self._detect_executable_name()
        if executable:
            profile_name = self.game_profiles.get("executables", {}).get(executable, {}).get("profile")
            return {
                "source": "executable",
                "match": executable,
                "profile": profile_name,
                "display_name": self._lookup_game_profile_name(profile_name) or executable,
            }

        launcher = self._detect_launcher_type()
        if launcher:
            profile_name = self.game_profiles.get("launcher_types", {}).get(launcher, {}).get("profile")
            return {
                "source": "launcher_type",
                "match": launcher,
                "profile": profile_name,
                "display_name": self._lookup_game_profile_name(profile_name) or launcher,
            }

        return None

    def _build_game_override_key(self, game_info: Dict[str, Any]) -> str:
        return f"{game_info['source']}:{game_info['match']}"

    def _lookup_game_profile_name(self, profile_name: Optional[str]) -> Optional[str]:
        if not profile_name:
            return None
        return self.game_profiles.get("profiles", {}).get(profile_name, {}).get("display_name", profile_name)

    def _resolve_runtime_config(self, active_game: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        config = copy.deepcopy(DEFAULT_CONFIG)
        device_profile = self.settings.get("device_profile", "generic")
        config = self._apply_profile_config(config, self.device_profiles, device_profile)

        global_mode = self.settings.get("performance_mode", config["PERFORMANCE_MODE"])
        config["PERFORMANCE_MODE"] = global_mode

        for key, value in self.settings.get("overrides", {}).items():
            if key in SUPPORTED_OVERRIDE_KEYS:
                config[key] = value

        if active_game and active_game.get("profile"):
            game_profile = self.game_profiles.get("profiles", {}).get(active_game["profile"], {})
            config.update(game_profile.get("config", {}))

        if active_game:
            override_key = self._build_game_override_key(active_game)
            for key, value in self.settings.get("game_overrides", {}).get(override_key, {}).items():
                if key in SUPPORTED_OVERRIDE_KEYS:
                    config[key] = value

        config = self._coerce_config_types(config)
        return self._apply_mode(config)

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
        usage = int((busy_delta * 100) / total_delta)
        return usage, current_total, current_idle

    def _is_on_external_power(self) -> bool:
        power_supply_dir = "/sys/class/power_supply"
        if not os.path.isdir(power_supply_dir):
            return False
        for name in os.listdir(power_supply_dir):
            base = os.path.join(power_supply_dir, name)
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

    def _determine_tdp(self, cpu_usage: int, config: Dict[str, Any]) -> int:
        tdp_values = [
            int(config["MIN_TDP"]),
            int(config["ACTIVE_MAX_TDP"] * 1 / 8),
            int(config["ACTIVE_MAX_TDP"] * 1 / 4),
            int(config["ACTIVE_MAX_TDP"] * 3 / 8),
            int(config["ACTIVE_MAX_TDP"] * 1 / 2),
            int(config["ACTIVE_MAX_TDP"] * 5 / 8),
            int(config["ACTIVE_MAX_TDP"] * 3 / 4),
            int(config["ACTIVE_MAX_TDP"] * 7 / 8),
            int(config["ACTIVE_MAX_TDP"]),
        ]
        thresholds = [0, 10, 20, 30, 40, 50, 60, 70, 80]
        tdp = int(config["MIN_TDP"])
        for index, threshold in enumerate(thresholds):
            adjusted = max(0, min(100, threshold + int(config["ACTIVE_THRESHOLD_OFFSET"])))
            if cpu_usage > adjusted:
                tdp = tdp_values[index]
        return self._align_to_step(tdp, int(config["STEP_TDP"]), int(config["MIN_TDP"]))

    def _apply_power_source_limit(self, requested_tdp: int, config: Dict[str, Any], external_power: bool) -> int:
        if external_power:
            return requested_tdp
        return min(requested_tdp, int(config["ACTIVE_BATTERY_MAX_TDP"]))

    def _command_exists(self, command: str) -> bool:
        return shutil.which(command) is not None

    def _set_tdp_sync(self, value: int) -> None:
        command = self.current_state.get("resolved_config", {}).get("RYZENADJ_EXEC", DEFAULT_CONFIG["RYZENADJ_EXEC"])
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

    def _refresh_static_state(self) -> None:
        active_game = self._detect_active_game()
        config = self._resolve_runtime_config(active_game)
        self.current_state["enabled"] = bool(self.settings.get("enabled", False))
        self.current_state["active_game"] = active_game
        self.current_state["active_device_profile"] = config.get("DEVICE_PROFILE")
        self.current_state["resolved_config"] = config
        self.current_state["led"] = self._detect_led_capabilities()

    async def _monitor_loop(self) -> None:
        previous_total, previous_idle = self._read_cpu_times()
        while True:
            self._refresh_static_state()
            enabled = bool(self.settings.get("enabled", False))
            config = self.current_state["resolved_config"]

            if not enabled:
                self._candidate_tdp = None
                self._stable_samples = 0
                await asyncio.sleep(1)
                previous_total, previous_idle = self._read_cpu_times()
                continue

            await asyncio.sleep(int(config["ACTIVE_MONITOR_INTERVAL"]))
            cpu_usage, previous_total, previous_idle = self._get_cpu_usage(previous_total, previous_idle)
            external_power = self._is_on_external_power()
            requested_tdp = self._determine_tdp(cpu_usage, config)
            limited_tdp = self._apply_power_source_limit(requested_tdp, config, external_power)

            self.current_state["cpu_usage"] = cpu_usage
            self.current_state["external_power"] = external_power

            current_tdp = self.current_state.get("current_tdp")
            if current_tdp is None:
                current_tdp = int(config["ACTIVE_DEFAULT_TDP"])
                self.current_state["current_tdp"] = current_tdp

            if limited_tdp == current_tdp:
                self._candidate_tdp = limited_tdp
                self._stable_samples = 0
                continue

            if limited_tdp == self._candidate_tdp:
                self._stable_samples += 1
            else:
                self._candidate_tdp = limited_tdp
                self._stable_samples = 1

            if self._stable_samples < int(config["ACTIVE_STABLE_SAMPLE_COUNT"]):
                continue

            now = time.time()
            if now - self._last_adjustment < int(config["ACTIVE_RYZENADJ_DELAY"]):
                continue

            await asyncio.to_thread(self._set_tdp_sync, limited_tdp)
            self.current_state["current_tdp"] = limited_tdp
            self._last_adjustment = now
            await decky.emit("autotdp_state", self.current_state)

    def _iter_processes(self) -> List[int]:
        pids: List[int] = []
        for name in os.listdir("/proc"):
            if name.isdigit():
                pids.append(int(name))
        return pids

    def _read_process_environ_value(self, pid: int, env_key: str) -> Optional[str]:
        path = f"/proc/{pid}/environ"
        try:
            with open(path, "rb") as handle:
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

    def _normalize_executable_name(self, value: str) -> str:
        return os.path.basename(value).lower()

    def _detect_executable_name(self) -> Optional[str]:
        for pid in self._iter_processes():
            cmdline_path = f"/proc/{pid}/cmdline"
            try:
                with open(cmdline_path, "rb") as handle:
                    parts = [part.decode("utf-8", errors="ignore") for part in handle.read().split(b"\0") if part]
            except OSError:
                continue
            for part in parts:
                if part.lower().endswith(".exe"):
                    return self._normalize_executable_name(part)
        return None

    def _detect_launcher_type(self) -> Optional[str]:
        for pid in self._iter_processes():
            comm_path = f"/proc/{pid}/comm"
            try:
                with open(comm_path, "r", encoding="utf-8") as handle:
                    comm = handle.read().strip().lower()
            except OSError:
                continue
            if comm in {"wineserver", "wine", "wine64", "wine64-preloader", "winedevice"}:
                return "wine"
            if comm in {"steam", "steamwebhelper"}:
                return "steam"
        return None

    def _detect_led_capabilities(self) -> Dict[str, Any]:
        led_dir = "/sys/class/leds"
        capabilities: Dict[str, Any] = {
            "asusctl": self._command_exists("asusctl"),
            "brightnessTargets": [],
            "rgbGroups": [],
        }
        if not os.path.isdir(led_dir):
            return capabilities

        rgb_groups: Dict[str, Dict[str, str]] = {}
        for name in os.listdir(led_dir):
            lower = name.lower()
            path = os.path.join(led_dir, name)
            brightness_path = os.path.join(path, "brightness")
            if any(token in lower for token in ("ally", "rog", "kbd", "keyboard", "lightbar", "aura", "rgb")):
                if os.path.isfile(brightness_path):
                    capabilities["brightnessTargets"].append({"name": name, "path": brightness_path})
            if lower.endswith(":red") or lower.endswith(":green") or lower.endswith(":blue"):
                base, channel = lower.rsplit(":", 1)
                group = rgb_groups.setdefault(base, {})
                group[channel] = brightness_path

        for base, channels in rgb_groups.items():
            if {"red", "green", "blue"}.issubset(channels.keys()):
                capabilities["rgbGroups"].append({"name": base, "channels": channels})

        return capabilities

    def _cycle_led_mode_sync(self, direction: str) -> None:
        if not self._command_exists("asusctl"):
            raise ValueError("asusctl not available for LED mode cycling")
        flag = "--prev-mode" if direction == "prev" else "--next-mode"
        subprocess.run(["asusctl", "aura", flag], check=False, capture_output=True, text=True)

    def _set_led_brightness_sync(self, brightness: int) -> None:
        brightness = max(0, min(255, int(brightness)))
        capabilities = self._detect_led_capabilities()
        if not capabilities["brightnessTargets"]:
            raise ValueError("No LED brightness targets detected")
        for target in capabilities["brightnessTargets"]:
            try:
                with open(target["path"], "w", encoding="utf-8") as handle:
                    handle.write(str(brightness))
            except OSError as error:
                decky.logger.warning(f"Failed writing LED brightness for {target['name']}: {error}")

    def _set_led_color_sync(self, color: str) -> None:
        color = color.strip().lstrip("#")
        if len(color) != 6:
            raise ValueError("Color must be RRGGBB")
        red = int(color[0:2], 16)
        green = int(color[2:4], 16)
        blue = int(color[4:6], 16)
        capabilities = self._detect_led_capabilities()
        if not capabilities["rgbGroups"]:
            raise ValueError("No RGB LED channels detected")
        for group in capabilities["rgbGroups"]:
            values = {"red": red, "green": green, "blue": blue}
            for channel, path in group["channels"].items():
                try:
                    with open(path, "w", encoding="utf-8") as handle:
                        handle.write(str(values[channel]))
                except OSError as error:
                    decky.logger.warning(f"Failed writing LED color for {group['name']}:{channel}: {error}")
