import { addEventListener, callable, definePlugin, removeEventListener } from "@decky/api";
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

function rowStyle(): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  };
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "12px",
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.2)",
    color: "white",
  };
}

function buttonStyle(): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
  };
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
  const [ledColor, setLedColorValue] = useState("00aaff");

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
    return <div style={{ padding: 16 }}>Loading AutoTDP...</div>;
  }

  if (!data) {
    return <div style={{ padding: 16 }}>Failed loading plugin state: {error}</div>;
  }

  const resolvedConfig = data.state.resolved_config;
  const led = data.ledCapabilities;

  return (
    <div style={{ padding: 16, color: "white" }}>
      <div style={cardStyle()}>
        <div style={rowStyle()}>
          <strong>AutoTDP</strong>
          <label>
            <input
              type="checkbox"
              checked={data.settings.enabled}
              onChange={async (event) => setData(await setEnabled(event.target.checked))}
            />{" "}
            Enabled
          </label>
        </div>
        <div>CPU: {data.state.cpu_usage}%</div>
        <div>Current TDP: {data.state.current_tdp ?? resolvedConfig.ACTIVE_DEFAULT_TDP} mW</div>
        <div>Power: {data.state.external_power === null ? "Unknown" : data.state.external_power ? "External" : "Battery"}</div>
        <div>Game: {currentGameLabel}</div>
      </div>

      <div style={cardStyle()}>
        <strong>Base Profile</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>Device profile</div>
          <select
            style={inputStyle()}
            value={data.settings.device_profile}
            onChange={async (event) => setData(await setDeviceProfile(event.target.value))}
          >
            {data.profiles.map((profile) => (
              <option key={profile.key} value={profile.key} disabled={!profile.supported}>
                {profile.display_name}{profile.supported ? "" : " [unsupported]"}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>Mode</div>
          <select
            style={inputStyle()}
            value={data.settings.performance_mode}
            onChange={async (event) => setData(await setPerformanceMode(event.target.value))}
          >
            {data.modes.map((mode) => (
              <option key={mode} value={mode}>
                {labelize(mode)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={cardStyle()}>
        <strong>Global Overrides</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>Default TDP</div>
          <input style={inputStyle()} value={globalDefaultTdp} onChange={(event) => setGlobalDefaultTdp(event.target.value)} />
          <button style={{ ...buttonStyle(), marginTop: 8 }} onClick={() => applyGlobalOverride("DEFAULT_TDP", globalDefaultTdp)}>
            Save default TDP override
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>Battery max TDP</div>
          <input style={inputStyle()} value={globalBatteryTdp} onChange={(event) => setGlobalBatteryTdp(event.target.value)} />
          <button style={{ ...buttonStyle(), marginTop: 8 }} onClick={() => applyGlobalOverride("BATTERY_MAX_TDP", globalBatteryTdp)}>
            Save battery TDP override
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>Monitor interval</div>
          <input style={inputStyle()} value={globalMonitorInterval} onChange={(event) => setGlobalMonitorInterval(event.target.value)} />
          <button style={{ ...buttonStyle(), marginTop: 8 }} onClick={() => applyGlobalOverride("MONITOR_INTERVAL", globalMonitorInterval)}>
            Save monitor interval override
          </button>
        </div>
      </div>

      <div style={cardStyle()}>
        <strong>Current Game Override</strong>
        <div style={{ marginTop: 8, marginBottom: 6 }}>{currentGameLabel}</div>
        <div style={{ marginBottom: 6 }}>Mode</div>
        <select style={inputStyle()} value={gameMode} onChange={(event) => setGameMode(event.target.value)}>
          <option value="">Use detected/default</option>
          {data.modes.map((mode) => (
            <option key={mode} value={mode}>
              {labelize(mode)}
            </option>
          ))}
        </select>
        <div style={{ marginTop: 8, marginBottom: 6 }}>Default TDP</div>
        <input style={inputStyle()} value={gameDefaultTdp} onChange={(event) => setGameDefaultTdp(event.target.value)} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={buttonStyle()} onClick={applyGameOverride}>Save current game override</button>
          <button style={buttonStyle()} onClick={clearGameOverride}>Clear current game override</button>
        </div>
      </div>

      <div style={cardStyle()}>
        <strong>Experimental LED</strong>
        <div style={{ marginTop: 8 }}>asusctl: {led.asusctl ? "yes" : "no"}</div>
        <div>Brightness targets: {led.brightnessTargets?.length ?? 0}</div>
        <div>RGB groups: {led.rgbGroups?.length ?? 0}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={buttonStyle()} onClick={async () => setData(await cycleLedMode("prev"))}>Prev LED mode</button>
          <button style={buttonStyle()} onClick={async () => setData(await cycleLedMode("next"))}>Next LED mode</button>
        </div>
        <div style={{ marginTop: 8, marginBottom: 6 }}>Brightness (0-255)</div>
        <input style={inputStyle()} value={ledBrightness} onChange={(event) => setLedBrightnessValue(event.target.value)} />
        <button style={{ ...buttonStyle(), marginTop: 8 }} onClick={async () => setData(await setLedBrightness(Number(ledBrightness)))}>
          Apply LED brightness
        </button>
        <div style={{ marginTop: 8, marginBottom: 6 }}>RGB color (RRGGBB)</div>
        <input style={inputStyle()} value={ledColor} onChange={(event) => setLedColorValue(event.target.value)} />
        <button style={{ ...buttonStyle(), marginTop: 8 }} onClick={async () => setData(await setLedColor(ledColor))}>
          Apply LED color
        </button>
      </div>

      <div style={cardStyle()}>
        <strong>Resolved Runtime</strong>
        <div>Mode: {String(resolvedConfig.PERFORMANCE_MODE)}</div>
        <div>Device profile: {data.state.active_device_profile ?? "unknown"}</div>
        <div>Max TDP: {String(resolvedConfig.ACTIVE_MAX_TDP)} mW</div>
        <div>Default TDP: {String(resolvedConfig.ACTIVE_DEFAULT_TDP)} mW</div>
        <div>Battery max TDP: {String(resolvedConfig.ACTIVE_BATTERY_MAX_TDP)} mW</div>
        <div>Monitor interval: {String(resolvedConfig.ACTIVE_MONITOR_INTERVAL)} s</div>
        <div>Stable samples: {String(resolvedConfig.ACTIVE_STABLE_SAMPLE_COUNT)}</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={buttonStyle()} onClick={refresh}>Refresh</button>
      </div>

      {error ? <div style={{ marginTop: 12, color: "#ff8c8c" }}>{error}</div> : null}
    </div>
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
