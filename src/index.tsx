import { addEventListener, callable, definePlugin, removeEventListener } from "@decky/api";
import {
  ButtonItem,
  DropdownItem,
  PanelSection,
  PanelSectionRow,
  TextField,
  ToggleField,
} from "@decky/ui";
import { useEffect, useMemo, useState } from "react";
import { FaTachometerAlt } from "react-icons/fa";

type RuntimeState = {
  enabled: boolean;
  current_tdp: number | null;
  cpu_usage: number;
  external_power: boolean | null;
  active_game: {
    source: string;
    match: string;
    profile?: string | null;
    display_name?: string | null;
  } | null;
  active_device_profile: string | null;
  resolved_config: Record<string, number | string>;
  led: {
    asusctl?: boolean;
    brightnessTargets?: Array<{ name: string; path: string }>;
    rgbGroups?: Array<{ name: string; channels: Record<string, string> }>;
  };
};

type DeckyState = {
  settings: {
    enabled: boolean;
    device_profile: string;
    performance_mode: string;
    overrides: Record<string, string>;
    game_overrides?: Record<string, Record<string, string>>;
  };
  profiles: Array<{
    key: string;
    display_name: string;
    supported: boolean;
    aliases: string[];
    notes: string;
  }>;
  modes: string[];
  gameProfiles: Record<string, unknown>;
  state: RuntimeState;
  ledCapabilities: RuntimeState["led"];
};

const getState = callable<[], DeckyState>("get_state");
const setEnabled = callable<[boolean], DeckyState>("set_enabled");
const setDeviceProfile = callable<[string], DeckyState>("set_device_profile");
const setPerformanceMode = callable<[string], DeckyState>("set_performance_mode");
const setOverride = callable<[string, string | null], DeckyState>("set_override");
const setCurrentGameOverride = callable<[Record<string, string | boolean | null>], DeckyState>("set_current_game_override");
const cycleLedMode = callable<[string], DeckyState>("cycle_led_mode");
const setLedBrightness = callable<[number], DeckyState>("set_led_brightness");
const setLedColor = callable<[string], DeckyState>("set_led_color");

function labelize(value: string): string {
  return value
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function toDropdownOptions(values: Array<{ data: string; label: string }>) {
  return values.map((value) => ({ data: value.data, label: value.label }));
}

function Content() {
  const [data, setData] = useState<DeckyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalDefaultTdp, setGlobalDefaultTdp] = useState("");
  const [globalBatteryTdp, setGlobalBatteryTdp] = useState("");
  const [globalMonitorInterval, setGlobalMonitorInterval] = useState("");
  const [gameMode, setGameMode] = useState("");
  const [gameDefaultTdp, setGameDefaultTdp] = useState("");
  const [ledBrightness, setLedBrightnessValue] = useState("64");
  const [ledColor, setLedColorValue] = useState("00AAFF");

  const refresh = async () => {
    try {
      setLoading(true);
      const next = await getState();
      setData(next);
      setGlobalDefaultTdp(String(next.settings.overrides.DEFAULT_TDP ?? ""));
      setGlobalBatteryTdp(String(next.settings.overrides.BATTERY_MAX_TDP ?? ""));
      setGlobalMonitorInterval(String(next.settings.overrides.MONITOR_INTERVAL ?? ""));
      setGameMode("");
      setGameDefaultTdp("");
      setError(null);
    } catch (caught) {
      setError(String(caught));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const listener = addEventListener<[RuntimeState]>("autotdp_state", (state) => {
      setData((previous) => {
        if (!previous) {
          return previous;
        }
        return { ...previous, state };
      });
    });
    return () => {
      removeEventListener("autotdp_state", listener);
    };
  }, []);

  const currentGameLabel = useMemo(() => {
    if (!data?.state.active_game) {
      return "No game detected";
    }
    const activeGame = data.state.active_game;
    return `${activeGame.display_name ?? activeGame.match} (${activeGame.source}: ${activeGame.match})`;
  }, [data]);

  const applyGlobalOverride = async (key: string, value: string) => {
    try {
      const next = await setOverride(key, value.trim() === "" ? null : value.trim());
      setData(next);
      setError(null);
    } catch (caught) {
      setError(String(caught));
    }
  };

  const applyGameOverride = async () => {
    try {
      const patch: Record<string, string | boolean | null> = {};
      patch.PERFORMANCE_MODE = gameMode.trim() === "" ? null : gameMode.trim();
      patch.DEFAULT_TDP = gameDefaultTdp.trim() === "" ? null : gameDefaultTdp.trim();
      const next = await setCurrentGameOverride(patch);
      setData(next);
      setError(null);
    } catch (caught) {
      setError(String(caught));
    }
  };

  const clearGameOverride = async () => {
    try {
      const next = await setCurrentGameOverride({ clear: true });
      setData(next);
      setGameMode("");
      setGameDefaultTdp("");
      setError(null);
    } catch (caught) {
      setError(String(caught));
    }
  };

  if (loading && !data) {
    return <PanelSection title="AutoTDP"><PanelSectionRow>Loading...</PanelSectionRow></PanelSection>;
  }

  if (!data) {
    return <PanelSection title="AutoTDP"><PanelSectionRow>Load failed: {error}</PanelSectionRow></PanelSection>;
  }

  const resolvedConfig = data.state.resolved_config;
  const led = data.ledCapabilities;

  const profileOptions = toDropdownOptions(
    data.profiles.map((profile) => ({
      data: profile.key,
      label: `${profile.display_name}${profile.supported ? "" : " [unsupported]"}`,
    })),
  );

  const modeOptions = toDropdownOptions(
    data.modes.map((mode) => ({ data: mode, label: labelize(mode) })),
  );

  const gameModeOptions = [{ data: "", label: "Use detected/default" }, ...modeOptions];

  return (
    <>
      <PanelSection title="Runtime">
        <PanelSectionRow>
          <ToggleField
            label="Enable AutoTDP"
            description="Main adaptive TDP loop"
            checked={data.settings.enabled}
            onChange={async (checked) => setData(await setEnabled(checked))}
          />
        </PanelSectionRow>
        <PanelSectionRow>CPU usage: {data.state.cpu_usage}%</PanelSectionRow>
        <PanelSectionRow>Current TDP: {data.state.current_tdp ?? resolvedConfig.ACTIVE_DEFAULT_TDP} mW</PanelSectionRow>
        <PanelSectionRow>
          Power: {data.state.external_power === null ? "Unknown" : data.state.external_power ? "External" : "Battery"}
        </PanelSectionRow>
        <PanelSectionRow>Game: {currentGameLabel}</PanelSectionRow>
      </PanelSection>

      <PanelSection title="Base Profile">
        <PanelSectionRow>
          <DropdownItem
            label="Device profile"
            description="Hardware baseline"
            rgOptions={profileOptions}
            selectedOption={data.settings.device_profile}
            onChange={async (option) => setData(await setDeviceProfile(String(option.data)))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label="Mode"
            description="Aggressiveness profile"
            rgOptions={modeOptions}
            selectedOption={data.settings.performance_mode}
            onChange={async (option) => setData(await setPerformanceMode(String(option.data)))}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Global Overrides">
        <PanelSectionRow>
          <TextField
            label="Default TDP"
            description="mW"
            mustBeNumeric
            value={globalDefaultTdp}
            onChange={(event) => setGlobalDefaultTdp(event.currentTarget.value)}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Save default TDP override"
            description="Apply current field"
            onClick={() => void applyGlobalOverride("DEFAULT_TDP", globalDefaultTdp)}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <TextField
            label="Battery max TDP"
            description="mW"
            mustBeNumeric
            value={globalBatteryTdp}
            onChange={(event) => setGlobalBatteryTdp(event.currentTarget.value)}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Save battery max override"
            description="Apply current field"
            onClick={() => void applyGlobalOverride("BATTERY_MAX_TDP", globalBatteryTdp)}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <TextField
            label="Monitor interval"
            description="seconds"
            mustBeNumeric
            value={globalMonitorInterval}
            onChange={(event) => setGlobalMonitorInterval(event.currentTarget.value)}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Save monitor interval override"
            description="Apply current field"
            onClick={() => void applyGlobalOverride("MONITOR_INTERVAL", globalMonitorInterval)}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Current Game Override">
        <PanelSectionRow>{currentGameLabel}</PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label="Game mode override"
            description="For detected current game"
            rgOptions={gameModeOptions}
            selectedOption={gameMode}
            onChange={(option) => setGameMode(String(option.data))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <TextField
            label="Game default TDP"
            description="mW"
            mustBeNumeric
            value={gameDefaultTdp}
            onChange={(event) => setGameDefaultTdp(event.currentTarget.value)}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Save current game override"
            description="Mode + default TDP"
            onClick={() => void applyGameOverride()}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Clear current game override"
            description="Remove detected game custom values"
            onClick={() => void clearGameOverride()}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Experimental LED">
        <PanelSectionRow>asusctl: {led.asusctl ? "yes" : "no"}</PanelSectionRow>
        <PanelSectionRow>Brightness targets: {led.brightnessTargets?.length ?? 0}</PanelSectionRow>
        <PanelSectionRow>RGB groups: {led.rgbGroups?.length ?? 0}</PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Previous LED mode"
            description="asusctl aura previous"
            onClick={async () => setData(await cycleLedMode("prev"))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Next LED mode"
            description="asusctl aura next"
            onClick={async () => setData(await cycleLedMode("next"))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <TextField
            label="LED brightness"
            description="0-255"
            mustBeNumeric
            value={ledBrightness}
            onChange={(event) => setLedBrightnessValue(event.currentTarget.value)}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Apply LED brightness"
            description="Write brightness to detected LED nodes"
            onClick={async () => setData(await setLedBrightness(Number(ledBrightness)))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <TextField
            label="LED color"
            description="RRGGBB"
            value={ledColor}
            onChange={(event) => setLedColorValue(event.currentTarget.value.toUpperCase())}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            label="Apply LED color"
            description="Write RGB channels if exposed"
            onClick={async () => setData(await setLedColor(ledColor))}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Resolved Runtime">
        <PanelSectionRow>Mode: {String(resolvedConfig.PERFORMANCE_MODE)}</PanelSectionRow>
        <PanelSectionRow>Device profile: {data.state.active_device_profile ?? "unknown"}</PanelSectionRow>
        <PanelSectionRow>Max TDP: {String(resolvedConfig.ACTIVE_MAX_TDP)} mW</PanelSectionRow>
        <PanelSectionRow>Default TDP: {String(resolvedConfig.ACTIVE_DEFAULT_TDP)} mW</PanelSectionRow>
        <PanelSectionRow>Battery max TDP: {String(resolvedConfig.ACTIVE_BATTERY_MAX_TDP)} mW</PanelSectionRow>
        <PanelSectionRow>Monitor interval: {String(resolvedConfig.ACTIVE_MONITOR_INTERVAL)} s</PanelSectionRow>
        <PanelSectionRow>Stable samples: {String(resolvedConfig.ACTIVE_STABLE_SAMPLE_COUNT)}</PanelSectionRow>
      </PanelSection>

      <PanelSection title="Actions">
        <PanelSectionRow>
          <ButtonItem label="Refresh" description="Reload backend state" onClick={() => void refresh()} />
        </PanelSectionRow>
        {error ? <PanelSectionRow>Error: {error}</PanelSectionRow> : null}
      </PanelSection>
    </>
  );
}

export default definePlugin(() => {
  return {
    name: "AutoTDP",
    titleView: <div>AutoTDP</div>,
    content: <Content />,
    icon: <FaTachometerAlt />,
    onDismount() {},
  };
});
