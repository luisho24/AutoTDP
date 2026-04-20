import { addEventListener, callable, definePlugin, removeEventListener } from "@decky/api";
import {
  ButtonItem,
  DropdownItem,
  Field,
  ModalRoot,
  Navigation,
  PanelSection,
  PanelSectionRow,
  showModal,
  SidebarNavigation,
  SliderField,
  ToggleField,
} from "@decky/ui";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { FaBatteryHalf, FaBolt, FaBullseye, FaDesktop, FaGamepad, FaTachometerAlt } from "react-icons/fa";

type RuntimeState = {
  enabled: boolean;
  current_tdp: number | null;
  fps: number | null;
  focus: string | null;
  context: string;
  effective_desired_fps: number | null;
  fps_target_unreachable: boolean;
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
    image_url?: string | null;
    library_image_url?: string | null;
  } | null;
  active_device_profile: string | null;
  resolved_config: Record<string, number | string | boolean>;
  battery: {
    present: boolean;
    percent: number | null;
    status: string | null;
    power_w: number | null;
    power_w_average?: number | null;
    energy_wh: number | null;
    seconds_remaining: number | null;
    seconds_remaining_average?: number | null;
    formatted_time_remaining: string | null;
    formatted_time_remaining_average?: string | null;
  };
  hhd: {
    available: boolean;
    service_active: boolean;
    tdp_enabled: boolean | null;
    compatibility_mode: boolean;
    auto_disabled_by_plugin: boolean;
    conflict_warning?: string | null;
  };
  asus_wmi?: {
    available: boolean;
    values?: Record<string, string | null>;
  };
  ryzenadj: {
    selected_source: string;
    active_source: string | null;
    resolved_path: string | null;
    system_available: boolean;
    bundled_available: boolean;
    downloaded_available: boolean;
    system_path: string | null;
    bundled_path: string | null;
    downloaded_path: string | null;
    download_url: string;
    sources: string[];
    test_ok: boolean;
    test_error: string | null;
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
    steam_ui_profile: Record<string, string | number>;
    hhd_compatibility_mode: boolean;
    restore_hhd_tdp_on_disable: boolean;
    ryzenadj_source: string;
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
const updateSteamUiProfile = callable<[Record<string, string | number | boolean | null>], DeckyState>("update_steam_ui_profile");
const syncHhdTdp = callable<[boolean], DeckyState>("sync_hhd_tdp");
const setRyzenadjSource = callable<[string], DeckyState>("set_ryzenadj_source");
const downloadRyzenadj = callable<[], DeckyState>("download_ryzenadj");

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
  if (state.battery.power_w_average !== null && state.battery.power_w_average !== undefined) {
    bits.push(`${state.battery.power_w_average}W avg`);
  } else if (state.battery.power_w !== null) {
    bits.push(`${state.battery.power_w}W`);
  }
  if (state.battery.formatted_time_remaining_average) {
    bits.push(`${state.battery.formatted_time_remaining_average} est`);
  } else if (state.battery.formatted_time_remaining) {
    bits.push(state.battery.formatted_time_remaining);
  }
  return bits.join(" | ");
}

function contextLabel(state: RuntimeState): string {
  if (state.context === "game") {
    return "In game";
  }
  if (state.context === "steam_ui") {
    return "Steam UI";
  }
  if (state.context === "idle") {
    return "Idle desktop";
  }
  return "Unknown";
}

function getSteamClientGameMetadata(appId: string | null | undefined) {
  if (!appId) {
    return null;
  }
  const parsed = Number(appId);
  if (!Number.isFinite(parsed) || !(window as any).appStore?.GetAppOverviewByAppID) {
    return null;
  }

  const app = (window as any).appStore.GetAppOverviewByAppID(parsed);
  if (!app) {
    return null;
  }

  const appStore = (window as any).appStore;
  const imageUrl = appStore.GetLandscapeImageURLForApp?.(app) || appStore.GetCachedLandscapeImageURLForApp?.(app) || null;
  const verticalImageUrl = appStore.GetVerticalCapsuleURLForApp?.(app) || appStore.GetCachedVerticalImageURLForApp?.(app) || null;

  return {
    name: app.display_name || null,
    imageUrl,
    verticalImageUrl,
  };
}

function chipStyle(background: string): React.CSSProperties {
  return {
    background,
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: "0.85em",
    fontWeight: 600,
  };
}

function summaryCardStyle(accent: string): React.CSSProperties {
  return {
    border: `1px solid ${accent}`,
    borderRadius: 12,
    padding: 12,
    background: "rgba(255,255,255,0.04)",
  };
}

function getQuickProfileValues(data: DeckyState) {
  const resolved = data.state.resolved_config;
  return {
    minTdp: Number(data.settings.profile_overrides.MIN_TDP ?? resolved.MIN_TDP),
    defaultTdp: Number(data.state.active_game && data.settings.auto_save_game_profiles ? resolved.DEFAULT_TDP : data.settings.profile_overrides.DEFAULT_TDP ?? resolved.DEFAULT_TDP),
    maxTdp: Number(data.settings.profile_overrides.MAX_CPU_TDP ?? resolved.MAX_CPU_TDP),
    batteryTdp: Number(data.state.active_game && data.settings.auto_save_game_profiles ? resolved.BATTERY_MAX_TDP : data.settings.profile_overrides.BATTERY_MAX_TDP ?? resolved.BATTERY_MAX_TDP),
    monitorInterval: Number(data.settings.profile_overrides.MONITOR_INTERVAL ?? resolved.MONITOR_INTERVAL),
    desiredFps: Number(data.settings.desired_fps),
  };
}

function SelectableInfoRow(props: { label?: ReactNode; children: ReactNode }) {
  return (
    <PanelSectionRow>
      <Field label={props.label} focusable highlightOnFocus>
        <div>{props.children}</div>
      </Field>
    </PanelSectionRow>
  );
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
  const [steamUiMode, setSteamUiMode] = useState(String(data.settings.steam_ui_profile.PERFORMANCE_MODE ?? "silent"));
  const [steamUiDefaultTdp, setSteamUiDefaultTdp] = useState(Number(data.settings.steam_ui_profile.DEFAULT_TDP ?? 6000));
  const [steamUiBatteryTdp, setSteamUiBatteryTdp] = useState(Number(data.settings.steam_ui_profile.BATTERY_MAX_TDP ?? 6000));
  const [steamUiDesiredFps, setSteamUiDesiredFps] = useState(Number(data.settings.steam_ui_profile.DESIRED_FPS ?? 45));

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

  const saveSteamUiProfile = async () => {
    try {
      const next = await updateSteamUiProfile({
        PERFORMANCE_MODE: steamUiMode,
        DEFAULT_TDP: steamUiDefaultTdp,
        BATTERY_MAX_TDP: steamUiBatteryTdp,
        DESIRED_FPS: steamUiDesiredFps,
      });
      onState(next);
      onError(null);
    } catch (caught) {
      onError(String(caught));
    }
  };

  const resetSteamUiProfile = async () => {
    try {
      const next = await updateSteamUiProfile({ clear: true });
      onState(next);
      onError(null);
      setSteamUiMode("silent");
      setSteamUiDefaultTdp(6000);
      setSteamUiBatteryTdp(6000);
      setSteamUiDesiredFps(45);
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
            <SelectableInfoRow label="Detected title">{activeGame?.display_name ?? "No active game detected"}</SelectableInfoRow>
            <SelectableInfoRow label="Steam info">{activeGame?.steam_appid ? `Steam AppID: ${activeGame.steam_appid}` : "Non-Steam or unknown game"}</SelectableInfoRow>
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
      title: "Steam UI",
      identifier: "steam-ui",
      content: (
        <>
          <PanelSection title="Steam UI Profile">
            <PanelSectionRow>
              <DropdownItem
                label="Steam UI mode"
                description="Profile used when not playing a game and gamescope focus is Steam"
                rgOptions={modes}
                selectedOption={steamUiMode}
                onChange={(option) => setSteamUiMode(String(option.data))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <SliderField
                label="Steam UI default TDP"
                description="Background and menu power target"
                value={steamUiDefaultTdp}
                min={Number(data.state.resolved_config.MIN_TDP)}
                max={Number(data.state.resolved_config.MAX_CPU_TDP)}
                step={Number(data.state.resolved_config.STEP_TDP)}
                showValue
                valueSuffix=" mW"
                editableValue
                onChange={(value) => setSteamUiDefaultTdp(value)}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <SliderField
                label="Steam UI battery max TDP"
                description="Battery ceiling when browsing Steam UI"
                value={steamUiBatteryTdp}
                min={Number(data.state.resolved_config.MIN_TDP)}
                max={Number(data.state.resolved_config.MAX_CPU_TDP)}
                step={Number(data.state.resolved_config.STEP_TDP)}
                showValue
                valueSuffix=" mW"
                editableValue
                onChange={(value) => setSteamUiBatteryTdp(value)}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <SliderField
                label="Steam UI desired FPS"
                description="Target while in menus"
                value={steamUiDesiredFps}
                min={30}
                max={120}
                step={1}
                showValue
                valueSuffix=" fps"
                editableValue
                onChange={(value) => setSteamUiDesiredFps(value)}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem label="Save Steam UI profile" description="Persist Steam UI idle tuning" onClick={() => void saveSteamUiProfile()} />
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem label="Reset Steam UI profile" description="Restore plugin defaults for menus" onClick={() => void resetSteamUiProfile()} />
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
            <SelectableInfoRow label="Available">{data.state.hhd.available ? "Yes" : "No"}</SelectableInfoRow>
            <SelectableInfoRow label="Service active">{data.state.hhd.service_active ? "Yes" : "No"}</SelectableInfoRow>
            <SelectableInfoRow label="HHD TDP state">{data.state.hhd.tdp_enabled === null ? "Unknown" : data.state.hhd.tdp_enabled ? "Yes" : "No"}</SelectableInfoRow>
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
      title: "RyzenAdj",
      identifier: "ryzenadj",
      content: (
        <>
          <PanelSection title="Binary Source">
            <SelectableInfoRow label="Selected source">{labelize(data.state.ryzenadj.selected_source)}</SelectableInfoRow>
            <SelectableInfoRow label="Active source">{data.state.ryzenadj.active_source ? labelize(data.state.ryzenadj.active_source) : "Unavailable"}</SelectableInfoRow>
            <PanelSectionRow>
              <DropdownItem
                label="RyzenAdj source"
                description="Auto prefers installed system binary, then bundled, then downloaded"
                rgOptions={data.state.ryzenadj.sources.map((source) => ({ data: source, label: labelize(source) }))}
                selectedOption={data.settings.ryzenadj_source}
                onChange={async (option) => onState(await setRyzenadjSource(String(option.data)))}
              />
            </PanelSectionRow>
            <SelectableInfoRow label="System available">{data.state.ryzenadj.system_available ? "Yes" : "No"}</SelectableInfoRow>
            <SelectableInfoRow label="Bundled available">{data.state.ryzenadj.bundled_available ? "Yes" : "No"}</SelectableInfoRow>
            <SelectableInfoRow label="Downloaded available">{data.state.ryzenadj.downloaded_available ? "Yes" : "No"}</SelectableInfoRow>
            <SelectableInfoRow label="Execution test">{data.state.ryzenadj.test_ok ? "OK" : data.state.ryzenadj.test_error ?? "Failed"}</SelectableInfoRow>
            <SelectableInfoRow label="Resolved path">{data.state.ryzenadj.resolved_path ?? "None"}</SelectableInfoRow>
            <PanelSectionRow>
              <ButtonItem
                label="Download precompiled RyzenAdj"
                description="Fetch plugin-managed fallback binary"
                onClick={async () => onState(await downloadRyzenadj())}
              />
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
            <SelectableInfoRow label="Summary">{batterySummary(data.state)}</SelectableInfoRow>
            <SelectableInfoRow label="Present">{data.state.battery.present ? "Yes" : "No"}</SelectableInfoRow>
            <SelectableInfoRow label="Charge">{data.state.battery.percent ?? "Unknown"}%</SelectableInfoRow>
            <SelectableInfoRow label="Status">{data.state.battery.status ?? "Unknown"}</SelectableInfoRow>
            <SelectableInfoRow label="Power draw">{data.state.battery.power_w ?? "Unknown"} W</SelectableInfoRow>
            <SelectableInfoRow label="Energy">{data.state.battery.energy_wh ?? "Unknown"} Wh</SelectableInfoRow>
            <SelectableInfoRow label="Time estimate">{data.state.battery.formatted_time_remaining ?? "Unknown"}</SelectableInfoRow>
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
  const [quickMinTdp, setQuickMinTdp] = useState(5000);
  const [quickDefaultTdp, setQuickDefaultTdp] = useState(10000);
  const [quickMaxTdp, setQuickMaxTdp] = useState(20000);
  const [quickMonitorInterval, setQuickMonitorInterval] = useState(2);
  const [quickDesiredFps, setQuickDesiredFps] = useState(60);

  const applyData = (next: DeckyState, syncQuick: boolean = true) => {
    setData(next);
    if (!syncQuick) {
      return;
    }
    const quick = getQuickProfileValues(next);
    setQuickMinTdp(quick.minTdp);
    setQuickDefaultTdp(quick.defaultTdp);
    setQuickMaxTdp(quick.maxTdp);
    setQuickMonitorInterval(quick.monitorInterval);
    setQuickDesiredFps(quick.desiredFps);
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const next = await getState();
      applyData(next);
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
  const steamClientMetadata = getSteamClientGameMetadata(data.state.active_game?.steam_appid);
  const currentGameLabel = steamClientMetadata?.name ?? data.state.active_game?.steamdb_name ?? data.state.active_game?.display_name ?? "No game detected";
  const currentGameArt = steamClientMetadata?.imageUrl ?? steamClientMetadata?.verticalImageUrl ?? data.state.active_game?.library_image_url ?? data.state.active_game?.image_url ?? null;
  const currentMode = String(resolved.ACTIVE_MODE ?? resolved.PERFORMANCE_MODE ?? data.settings.performance_mode);
  const profileOpts = profileOptions(data.profiles);
  const modes = modeOptions(data.modes);
  const liveFps = data.state.fps === null ? "Unknown" : `${data.state.fps.toFixed(1)} fps`;
  const targetFps = data.state.effective_desired_fps ?? data.settings.desired_fps;

  const openAdvanced = () => {
    const modal = showModal(
      <AdvancedModal
        data={data}
        onClose={() => modal.Close()}
        onRefresh={refresh}
        onState={applyData}
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
      <PanelSection title="Overview">
        <SelectableInfoRow label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaGamepad /> Current activity</span>}>
          <div style={summaryCardStyle("rgba(68, 200, 255, 0.45)")}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {currentGameArt ? <img src={currentGameArt} alt={currentGameLabel} style={{ width: 64, height: 30, objectFit: "cover", borderRadius: 8 }} /> : null}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{currentGameLabel}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={chipStyle("rgba(68, 200, 255, 0.18)")}>{contextLabel(data.state)}</span>
                  <span style={chipStyle("rgba(255, 215, 0, 0.18)")}>{labelize(currentMode)}</span>
                  {data.state.active_game?.steam_appid ? <span style={chipStyle("rgba(255, 255, 255, 0.12)")}>Steam</span> : null}
                </div>
              </div>
            </div>
          </div>
        </SelectableInfoRow>
        <SelectableInfoRow label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaBullseye /> FPS target</span>}>
          <div style={summaryCardStyle("rgba(120, 255, 160, 0.45)")}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{liveFps} / {targetFps} fps</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={chipStyle("rgba(120, 255, 160, 0.18)")}>Current {liveFps}</span>
              <span style={chipStyle("rgba(120, 255, 160, 0.18)")}>Target {targetFps} fps</span>
              {data.state.fps_target_unreachable ? <span style={chipStyle("rgba(255, 120, 120, 0.18)")}>Auto-capped</span> : null}
            </div>
          </div>
        </SelectableInfoRow>
        <SelectableInfoRow label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaTachometerAlt /> Power state</span>}>
          <div style={summaryCardStyle("rgba(255, 180, 80, 0.45)")}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{data.state.current_tdp ?? resolved.ACTIVE_DEFAULT_TDP} mW</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={chipStyle("rgba(255, 180, 80, 0.18)")}>CPU {data.state.cpu_usage}%</span>
              <span style={chipStyle("rgba(255, 180, 80, 0.18)")}>Min {quickMinTdp} mW</span>
              <span style={chipStyle("rgba(255, 180, 80, 0.18)")}>Default {quickDefaultTdp} mW</span>
              <span style={chipStyle("rgba(255, 180, 80, 0.18)")}>Ceiling {quickMaxTdp} mW</span>
              <span style={chipStyle("rgba(255, 180, 80, 0.18)")}>{data.state.ryzenadj.active_source ? labelize(data.state.ryzenadj.active_source) : "No ryzenadj"}</span>
            </div>
          </div>
        </SelectableInfoRow>
        <SelectableInfoRow label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaBatteryHalf /> Battery</span>}>
          <div style={summaryCardStyle("rgba(170, 120, 255, 0.45)")}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{batterySummary(data.state)}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={chipStyle("rgba(170, 120, 255, 0.18)")}>{data.state.external_power ? "Plugged in" : "Battery / unknown"}</span>
              <span style={chipStyle("rgba(170, 120, 255, 0.18)")}>{data.state.focus ? `Focus: ${data.state.focus}` : "Focus unknown"}</span>
            </div>
          </div>
        </SelectableInfoRow>
      </PanelSection>

      <PanelSection title="Runtime Control">
        <PanelSectionRow>
          <ToggleField
            label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaBolt /> Enable AutoTDP</span>}
            description="Adaptive TDP loop. HHD compatibility mode disables only HHD TDP control, not buttons or controller helpers."
            checked={data.settings.enabled}
            onChange={async (checked) => applyData(await setEnabled(checked))}
          />
        </PanelSectionRow>
        <SelectableInfoRow label="RyzenAdj status">{data.state.ryzenadj.test_ok ? `Ready (${data.state.ryzenadj.active_source ?? "none"})` : data.state.ryzenadj.test_error ?? "Unavailable"}</SelectableInfoRow>
        {data.state.asus_wmi?.available ? <SelectableInfoRow label="ASUS WMI power path">Active</SelectableInfoRow> : null}
        {data.state.asus_wmi?.values?.profile ? <SelectableInfoRow label="Platform profile">{String(data.state.asus_wmi.values.profile)}</SelectableInfoRow> : null}
        {data.state.hhd.conflict_warning ? <SelectableInfoRow label="Conflict warning">{data.state.hhd.conflict_warning}</SelectableInfoRow> : null}
      </PanelSection>

      <PanelSection title="Quick Settings">
        <PanelSectionRow>
          <DropdownItem
            label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaDesktop /> Device profile</span>}
            description="Choose hardware baseline for handheld or laptop"
            rgOptions={profileOpts}
            selectedOption={data.settings.device_profile}
            onChange={async (option) => applyData(await setDeviceProfile(String(option.data)))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaBolt /> Base mode</span>}
            description="Preferred performance mode when automation does not override it"
            rgOptions={modes}
            selectedOption={data.settings.performance_mode}
            onChange={async (option) => applyData(await setPerformanceMode(String(option.data)))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Minimum TDP"
            description="Lowest TDP AutoTDP may use"
            value={quickMinTdp}
            min={2000}
            max={quickMaxTdp}
            step={1000}
            showValue
            valueSuffix=" mW"
            editableValue
            onChange={async (value) => {
              const clamped = Math.min(value, quickDefaultTdp, quickMaxTdp);
              setQuickMinTdp(clamped);
              const next = await setProfileOverride("MIN_TDP", clamped);
              applyData(next);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Default TDP"
            description={data.settings.auto_save_game_profiles && data.state.active_game ? "Active game profile target" : "Default target while gaming"}
            value={quickDefaultTdp}
            min={quickMinTdp}
            max={quickMaxTdp}
            step={Number(resolved.STEP_TDP)}
            showValue
            valueSuffix=" mW"
            editableValue
            onChange={async (value) => {
              const clamped = Math.max(quickMinTdp, Math.min(value, quickMaxTdp));
              setQuickDefaultTdp(clamped);
              const next = await setProfileOverride("DEFAULT_TDP", clamped);
              applyData(next);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Ceiling TDP"
            description="Highest TDP AutoTDP may use"
            value={quickMaxTdp}
            min={quickMinTdp}
            max={35000}
            step={1000}
            showValue
            valueSuffix=" mW"
            editableValue
            onChange={async (value) => {
              const clamped = Math.max(value, quickDefaultTdp, quickMinTdp);
              setQuickMaxTdp(clamped);
              const next = await setProfileOverride("MAX_CPU_TDP", clamped);
              applyData(next);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Desired FPS"
            description="Experimental. AutoTDP trims extra CPU power headroom when FPS sits above target and reacts faster when below target"
            value={quickDesiredFps}
            min={30}
            max={120}
            step={1}
            showValue
            valueSuffix=" fps"
            editableValue
            disabled={!data.settings.desired_fps_enabled}
            onChange={async (value) => {
              setQuickDesiredFps(value);
              const next = await setPluginSettings({ desired_fps: value });
              applyData(next, false);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaBullseye /> Desired FPS control</span>}
            description="Experimental. Uses real Gamescope FPS telemetry when available"
            checked={data.settings.desired_fps_enabled}
            onChange={async (checked) => applyData(await setPluginSettings({ desired_fps_enabled: checked }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaBatteryHalf /> Auto battery switching</span>}
            description="Switch to battery-specific modes automatically but still keep your manual base mode for AC"
            checked={data.settings.auto_battery_switch}
            onChange={async (checked) => applyData(await setPluginSettings({ auto_battery_switch: checked }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Sampling interval"
            description="How fast AutoTDP re-checks load and FPS telemetry"
            value={quickMonitorInterval}
            min={1}
            max={5}
            step={1}
            showValue
            valueSuffix=" s"
            editableValue
            onChange={async (value) => {
              setQuickMonitorInterval(value);
              const next = await setProfileOverride("MONITOR_INTERVAL", value);
              applyData(next);
            }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Actions">
        <PanelSectionRow>
          <ButtonItem label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaDesktop /> Open advanced editor</span>} description="Profiles, Steam UI, HHD, RyzenAdj, battery, SteamDB" onClick={openAdvanced} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FaBolt /> Refresh status</span>} description="Reload backend state and telemetry" onClick={() => void refresh()} />
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
