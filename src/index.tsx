import { addEventListener, callable, definePlugin, removeEventListener } from "@decky/api";
import {
  ButtonItem,
  DropdownItem,
  ModalRoot,
  Navigation,
  PanelSection,
  PanelSectionRow,
  showModal,
  SidebarNavigation,
  SliderField,
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
    steam_appid?: string | null;
    steamdb_name?: string | null;
    steamdb_url?: string | null;
  } | null;
  active_device_profile: string | null;
  resolved_config: Record<string, number | string | boolean>;
  battery: {
    present: boolean;
    percent: number | null;
    status: string | null;
    power_w: number | null;
    energy_wh: number | null;
    seconds_remaining: number | null;
    formatted_time_remaining: string | null;
  };
  hhd: {
    available: boolean;
    service_active: boolean;
    tdp_enabled: boolean | null;
    compatibility_mode: boolean;
    auto_disabled_by_plugin: boolean;
  };
};

type DeckyState = {
  settings: {
    enabled: boolean;
    device_profile: string;
    performance_mode: string;
    profile_overrides: Record<string, number>;
    game_overrides?: Record<string, Record<string, string | number>>;
    auto_save_game_profiles: boolean;
    auto_battery_switch: boolean;
    battery_mode: string;
    battery_low_mode: string;
    battery_low_threshold: number;
    desired_fps: number;
    desired_fps_enabled: boolean;
    hhd_compatibility_mode: boolean;
    restore_hhd_tdp_on_disable: boolean;
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
};

const getState = callable<[], DeckyState>("get_state");
const setEnabled = callable<[boolean], DeckyState>("set_enabled");
const setDeviceProfile = callable<[string], DeckyState>("set_device_profile");
const setPerformanceMode = callable<[string], DeckyState>("set_performance_mode");
const setProfileOverride = callable<[string, number | null], DeckyState>("set_profile_override");
const setPluginSettings = callable<[Record<string, string | number | boolean>], DeckyState>("set_plugin_settings");
const updateActiveGameProfile = callable<[Record<string, string | number | boolean | null>], DeckyState>("update_active_game_profile");
const syncHhdTdp = callable<[boolean], DeckyState>("sync_hhd_tdp");

function labelize(value: string): string {
  return value
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function modeOptions(modes: string[]) {
  return modes.map((mode) => ({ data: mode, label: labelize(mode) }));
}

function profileOptions(profiles: DeckyState["profiles"]) {
  return profiles.map((profile) => ({
    data: profile.key,
    label: `${profile.display_name}${profile.supported ? "" : " [unsupported]"}`,
  }));
}

function batterySummary(state: RuntimeState): string {
  if (!state.battery.present) {
    return "No battery telemetry";
  }
  const bits = [] as string[];
  if (state.battery.percent !== null) {
    bits.push(`${state.battery.percent}%`);
  }
  if (state.battery.status) {
    bits.push(state.battery.status);
  }
  if (state.battery.power_w !== null) {
    bits.push(`${state.battery.power_w}W`);
  }
  if (state.battery.formatted_time_remaining) {
    bits.push(state.battery.formatted_time_remaining);
  }
  return bits.join(" | ");
}

function AdvancedModal(props: {
  data: DeckyState;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onState: (state: DeckyState) => void;
  onError: (value: string | null) => void;
}) {
  const { data, onClose, onRefresh, onState, onError } = props;
  const activeGame = data.state.active_game;
  const modes = modeOptions(data.modes);

  const gameOverrideKey = useMemo(() => {
    if (!activeGame) {
      return null;
    }
    return `${activeGame.source}:${activeGame.match}`;
  }, [activeGame]);

  const activeGameOverrides = gameOverrideKey ? data.settings.game_overrides?.[gameOverrideKey] ?? {} : {};
  const [requestedPage, setRequestedPage] = useState("automation");
  const [gameMode, setGameMode] = useState(String(activeGameOverrides.PERFORMANCE_MODE ?? ""));
  const [gameDefaultTdp, setGameDefaultTdp] = useState(Number(activeGameOverrides.DEFAULT_TDP ?? data.state.resolved_config.DEFAULT_TDP ?? 10000));
  const [gameBatteryTdp, setGameBatteryTdp] = useState(Number(activeGameOverrides.BATTERY_MAX_TDP ?? data.state.resolved_config.BATTERY_MAX_TDP ?? 15000));
  const [gameDesiredFps, setGameDesiredFps] = useState(Number(activeGameOverrides.DESIRED_FPS ?? data.settings.desired_fps));

  const saveGameProfile = async () => {
    try {
      const next = await updateActiveGameProfile({
        PERFORMANCE_MODE: gameMode === "" ? null : gameMode,
        DEFAULT_TDP: gameDefaultTdp,
        BATTERY_MAX_TDP: gameBatteryTdp,
        DESIRED_FPS: gameDesiredFps,
      });
      onState(next);
      onError(null);
    } catch (caught) {
      onError(String(caught));
    }
  };

  const clearGameProfile = async () => {
    try {
      const next = await updateActiveGameProfile({ clear: true });
      onState(next);
      onError(null);
      setGameMode("");
    } catch (caught) {
      onError(String(caught));
    }
  };

  const pages = [
    {
      title: "Automation",
      identifier: "automation",
      content: (
        <>
          <PanelSection title="Battery Automation">
            <PanelSectionRow>
              <ToggleField
                label="Auto battery profile switching"
                description="Switch modes automatically on battery, keep manual base mode for AC"
                checked={data.settings.auto_battery_switch}
                onChange={async (checked) => onState(await setPluginSettings({ auto_battery_switch: checked }))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <DropdownItem
                label="Battery mode"
                description="Mode used on battery above low threshold"
                rgOptions={modes}
                selectedOption={data.settings.battery_mode}
                onChange={async (option) => onState(await setPluginSettings({ battery_mode: String(option.data) }))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <DropdownItem
                label="Low battery mode"
                description="Mode used below low threshold"
                rgOptions={modes}
                selectedOption={data.settings.battery_low_mode}
                onChange={async (option) => onState(await setPluginSettings({ battery_low_mode: String(option.data) }))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <SliderField
                label="Low battery threshold"
                description="Percent where low battery mode kicks in"
                value={data.settings.battery_low_threshold}
                min={5}
                max={50}
                step={1}
                showValue
                valueSuffix="%"
                editableValue
                onChange={async (value) => onState(await setPluginSettings({ battery_low_threshold: value }))}
              />
            </PanelSectionRow>
          </PanelSection>

          <PanelSection title="Profiles">
            <PanelSectionRow>
              <ToggleField
                label="Auto-save active game profile"
                description="Quick slider changes save to current game when game detected"
                checked={data.settings.auto_save_game_profiles}
                onChange={async (checked) => onState(await setPluginSettings({ auto_save_game_profiles: checked }))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <ToggleField
                label="Desired FPS target"
                description="Experimental. Scales TDP budget heuristically toward target framerate"
                checked={data.settings.desired_fps_enabled}
                onChange={async (checked) => onState(await setPluginSettings({ desired_fps_enabled: checked }))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <SliderField
                label="Desired FPS"
                description="Experimental target"
                value={data.settings.desired_fps}
                min={30}
                max={120}
                step={1}
                showValue
                valueSuffix=" fps"
                editableValue
                disabled={!data.settings.desired_fps_enabled}
                onChange={async (value) => onState(await setPluginSettings({ desired_fps: value }))}
              />
            </PanelSectionRow>
          </PanelSection>
        </>
      ),
    },
    {
      title: "Game Profile",
      identifier: "game",
      content: (
        <>
          <PanelSection title="Active Game">
            <PanelSectionRow>{activeGame?.display_name ?? "No active game detected"}</PanelSectionRow>
            <PanelSectionRow>{activeGame?.steam_appid ? `Steam AppID: ${activeGame.steam_appid}` : "Non-Steam or unknown game"}</PanelSectionRow>
            {activeGame?.steamdb_url ? (
              <PanelSectionRow>
                <ButtonItem
                  label="Open SteamDB"
                  description={activeGame.steamdb_url}
                  onClick={() => Navigation.NavigateToExternalWeb(activeGame.steamdb_url as string)}
                />
              </PanelSectionRow>
            ) : null}
          </PanelSection>

          <PanelSection title="Current Game Overrides">
            <PanelSectionRow>
              <DropdownItem
                label="Game mode"
                description="Override only this detected game"
                rgOptions={[{ data: "", label: "Use default/bundled" }, ...modes]}
                selectedOption={gameMode}
                onChange={(option) => setGameMode(String(option.data))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <SliderField
                label="Game default TDP"
                description="Saved per game"
                value={gameDefaultTdp}
                min={Number(data.state.resolved_config.MIN_TDP)}
                max={Number(data.state.resolved_config.MAX_CPU_TDP)}
                step={Number(data.state.resolved_config.STEP_TDP)}
                showValue
                valueSuffix=" mW"
                editableValue
                onChange={(value) => setGameDefaultTdp(value)}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <SliderField
                label="Game battery max TDP"
                description="Saved per game"
                value={gameBatteryTdp}
                min={Number(data.state.resolved_config.MIN_TDP)}
                max={Number(data.state.resolved_config.MAX_CPU_TDP)}
                step={Number(data.state.resolved_config.STEP_TDP)}
                showValue
                valueSuffix=" mW"
                editableValue
                onChange={(value) => setGameBatteryTdp(value)}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <SliderField
                label="Game desired FPS"
                description="Experimental per game target"
                value={gameDesiredFps}
                min={30}
                max={120}
                step={1}
                showValue
                valueSuffix=" fps"
                editableValue
                onChange={(value) => setGameDesiredFps(value)}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem label="Save game profile" description="Persist current game overrides" onClick={() => void saveGameProfile()} />
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem label="Clear game profile" description="Remove current game overrides" onClick={() => void clearGameProfile()} />
            </PanelSectionRow>
          </PanelSection>
        </>
      ),
    },
    {
      title: "HHD",
      identifier: "hhd",
      content: (
        <>
          <PanelSection title="Handheld Daemon Compatibility">
            <PanelSectionRow>Available: {data.state.hhd.available ? "Yes" : "No"}</PanelSectionRow>
            <PanelSectionRow>Service active: {data.state.hhd.service_active ? "Yes" : "No"}</PanelSectionRow>
            <PanelSectionRow>TDP enabled in HHD: {data.state.hhd.tdp_enabled === null ? "Unknown" : data.state.hhd.tdp_enabled ? "Yes" : "No"}</PanelSectionRow>
            <PanelSectionRow>
              <ToggleField
                label="HHD compatibility mode"
                description="Disable only HHD TDP control while keeping button and controller features alive"
                checked={data.settings.hhd_compatibility_mode}
                onChange={async (checked) => onState(await setPluginSettings({ hhd_compatibility_mode: checked }))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <ToggleField
                label="Restore HHD TDP on AutoTDP disable"
                description="Turn HHD TDP back on when plugin disables"
                checked={data.settings.restore_hhd_tdp_on_disable}
                onChange={async (checked) => onState(await setPluginSettings({ restore_hhd_tdp_on_disable: checked }))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem label="Disable HHD TDP now" description="Keep HHD button features, stop HHD TDP loop" onClick={async () => onState(await syncHhdTdp(false))} />
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem label="Enable HHD TDP now" description="Restore HHD TDP management" onClick={async () => onState(await syncHhdTdp(true))} />
            </PanelSectionRow>
          </PanelSection>
        </>
      ),
    },
    {
      title: "Battery",
      identifier: "battery",
      content: (
        <>
          <PanelSection title="Battery Stats">
            <PanelSectionRow>{batterySummary(data.state)}</PanelSectionRow>
            <PanelSectionRow>Present: {data.state.battery.present ? "Yes" : "No"}</PanelSectionRow>
            <PanelSectionRow>Charge: {data.state.battery.percent ?? "Unknown"}%</PanelSectionRow>
            <PanelSectionRow>Status: {data.state.battery.status ?? "Unknown"}</PanelSectionRow>
            <PanelSectionRow>Power draw: {data.state.battery.power_w ?? "Unknown"} W</PanelSectionRow>
            <PanelSectionRow>Energy: {data.state.battery.energy_wh ?? "Unknown"} Wh</PanelSectionRow>
            <PanelSectionRow>Time estimate: {data.state.battery.formatted_time_remaining ?? "Unknown"}</PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem label="Refresh telemetry" description="Poll backend again" onClick={() => void onRefresh()} />
            </PanelSectionRow>
          </PanelSection>
        </>
      ),
    },
  ];

  return (
    <ModalRoot closeModal={onClose} onCancel={onClose} bAllowFullSize bDisableBackgroundDismiss>
      <SidebarNavigation title="AutoTDP Advanced" showTitle pages={pages} page={requestedPage} onPageRequested={setRequestedPage} />
    </ModalRoot>
  );
}

function Content() {
  const [data, setData] = useState<DeckyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const next = await getState();
      setData(next);
      setError(null);
    } catch (caught) {
      setError(String(caught));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
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

  if (loading && !data) {
    return <PanelSection title="AutoTDP"><PanelSectionRow>Loading...</PanelSectionRow></PanelSection>;
  }

  if (!data) {
    return <PanelSection title="AutoTDP"><PanelSectionRow>Load failed: {error}</PanelSectionRow></PanelSection>;
  }

  const resolved = data.state.resolved_config;
  const currentGameLabel = data.state.active_game?.steamdb_name ?? data.state.active_game?.display_name ?? "No game detected";
  const currentMode = String(resolved.ACTIVE_MODE ?? resolved.PERFORMANCE_MODE ?? data.settings.performance_mode);
  const profileOpts = profileOptions(data.profiles);
  const modes = modeOptions(data.modes);

  const openAdvanced = () => {
    const modal = showModal(
      <AdvancedModal
        data={data}
        onClose={() => modal.Close()}
        onRefresh={refresh}
        onState={setData}
        onError={setError}
      />,
      undefined,
      {
        strTitle: "AutoTDP Advanced",
        bHideMainWindowForPopouts: false,
        popupWidth: 1200,
        popupHeight: 900,
      },
    );
  };

  return (
    <>
      <PanelSection title="Runtime">
        <PanelSectionRow>
          <ToggleField
            label="Enable AutoTDP"
            description="Adaptive TDP loop. HHD compatibility mode will disable only HHD TDP controls, not button helpers."
            checked={data.settings.enabled}
            onChange={async (checked) => setData(await setEnabled(checked))}
          />
        </PanelSectionRow>
        <PanelSectionRow>Game: {currentGameLabel}</PanelSectionRow>
        <PanelSectionRow>CPU usage: {data.state.cpu_usage}%</PanelSectionRow>
        <PanelSectionRow>Current TDP: {data.state.current_tdp ?? resolved.ACTIVE_DEFAULT_TDP} mW</PanelSectionRow>
        <PanelSectionRow>Effective mode: {labelize(currentMode)}</PanelSectionRow>
        <PanelSectionRow>{batterySummary(data.state)}</PanelSectionRow>
      </PanelSection>

      <PanelSection title="Quick Settings">
        <PanelSectionRow>
          <DropdownItem
            label="Device profile"
            description="Hardware baseline"
            rgOptions={profileOpts}
            selectedOption={data.settings.device_profile}
            onChange={async (option) => setData(await setDeviceProfile(String(option.data)))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label="Base mode"
            description="Preferred AC / manual mode"
            rgOptions={modes}
            selectedOption={data.settings.performance_mode}
            onChange={async (option) => setData(await setPerformanceMode(String(option.data)))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Default TDP"
            description={data.settings.auto_save_game_profiles && data.state.active_game ? "Auto-saves to current game profile" : "Global override"}
            value={Number(data.state.active_game && data.settings.auto_save_game_profiles ? resolved.DEFAULT_TDP : data.settings.profile_overrides.DEFAULT_TDP ?? resolved.DEFAULT_TDP)}
            min={Number(resolved.MIN_TDP)}
            max={Number(resolved.MAX_CPU_TDP)}
            step={Number(resolved.STEP_TDP)}
            showValue
            valueSuffix=" mW"
            editableValue
            onChange={async (value) => setData(await setProfileOverride("DEFAULT_TDP", value))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Battery max TDP"
            description={data.settings.auto_save_game_profiles && data.state.active_game ? "Auto-saves to current game profile" : "Global override"}
            value={Number(data.state.active_game && data.settings.auto_save_game_profiles ? resolved.BATTERY_MAX_TDP : data.settings.profile_overrides.BATTERY_MAX_TDP ?? resolved.BATTERY_MAX_TDP)}
            min={Number(resolved.MIN_TDP)}
            max={Number(resolved.MAX_CPU_TDP)}
            step={Number(resolved.STEP_TDP)}
            showValue
            valueSuffix=" mW"
            editableValue
            onChange={async (value) => setData(await setProfileOverride("BATTERY_MAX_TDP", value))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Monitor interval"
            description={data.settings.auto_save_game_profiles && data.state.active_game ? "Auto-saves to current game profile" : "Global override"}
            value={Number(data.settings.profile_overrides.MONITOR_INTERVAL ?? resolved.MONITOR_INTERVAL)}
            min={1}
            max={10}
            step={1}
            showValue
            valueSuffix=" s"
            editableValue
            onChange={async (value) => setData(await setProfileOverride("MONITOR_INTERVAL", value))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Desired FPS"
            description="Experimental heuristic target"
            value={data.settings.desired_fps}
            min={30}
            max={120}
            step={1}
            showValue
            valueSuffix=" fps"
            editableValue
            disabled={!data.settings.desired_fps_enabled}
            onChange={async (value) => setData(await setPluginSettings({ desired_fps: value }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Desired FPS enabled"
            description="Experimental. May improve battery by cutting excess TDP headroom"
            checked={data.settings.desired_fps_enabled}
            onChange={async (checked) => setData(await setPluginSettings({ desired_fps_enabled: checked }))}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Actions">
        <PanelSectionRow>
          <ButtonItem label="Open advanced editor" description="Full-size profile editor, HHD, battery, SteamDB info" onClick={openAdvanced} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem label="Refresh" description="Poll backend state" onClick={() => void refresh()} />
        </PanelSectionRow>
        {error ? <PanelSectionRow>Error: {error}</PanelSectionRow> : null}
      </PanelSection>
    </>
  );
}

export default definePlugin(() => ({
  name: "AutoTDP",
  titleView: <div>AutoTDP</div>,
  content: <Content />,
  icon: <FaTachometerAlt />,
  onDismount() {},
  alwaysRender: false,
}));
