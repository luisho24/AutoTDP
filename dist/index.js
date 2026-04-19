const manifest = {"name":"AutoTDP"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const addEventListener = api.addEventListener;
const removeEventListener = api.removeEventListener;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var {
        attr,
        size,
        title
      } = props,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaTachometerAlt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M288 32C128.94 32 0 160.94 0 320c0 52.8 14.25 102.26 39.06 144.8 5.61 9.62 16.3 15.2 27.44 15.2h443c11.14 0 21.83-5.58 27.44-15.2C561.75 422.26 576 372.8 576 320c0-159.06-128.94-288-288-288zm0 64c14.71 0 26.58 10.13 30.32 23.65-1.11 2.26-2.64 4.23-3.45 6.67l-9.22 27.67c-5.13 3.49-10.97 6.01-17.64 6.01-17.67 0-32-14.33-32-32S270.33 96 288 96zM96 384c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm48-160c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm246.77-72.41l-61.33 184C343.13 347.33 352 364.54 352 384c0 11.72-3.38 22.55-8.88 32H232.88c-5.5-9.45-8.88-20.28-8.88-32 0-33.94 26.5-61.43 59.9-63.59l61.34-184.01c4.17-12.56 17.73-19.45 30.36-15.17 12.57 4.19 19.35 17.79 15.17 30.36zm14.66 57.2l15.52-46.55c3.47-1.29 7.13-2.23 11.05-2.23 17.67 0 32 14.33 32 32s-14.33 32-32 32c-11.38-.01-20.89-6.28-26.57-15.22zM480 384c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z"},"child":[]}]})(props);
}

const getState = callable("get_state");
const setEnabled = callable("set_enabled");
const setDeviceProfile = callable("set_device_profile");
const setPerformanceMode = callable("set_performance_mode");
const setProfileOverride = callable("set_profile_override");
const setPluginSettings = callable("set_plugin_settings");
const updateActiveGameProfile = callable("update_active_game_profile");
const syncHhdTdp = callable("sync_hhd_tdp");
function labelize(value) {
    return value
        .split("_")
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" ");
}
function modeOptions(modes) {
    return modes.map((mode) => ({ data: mode, label: labelize(mode) }));
}
function profileOptions(profiles) {
    return profiles.map((profile) => ({
        data: profile.key,
        label: `${profile.display_name}${profile.supported ? "" : " [unsupported]"}`,
    }));
}
function batterySummary(state) {
    if (!state.battery.present) {
        return "No battery telemetry";
    }
    const bits = [];
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
function AdvancedModal(props) {
    const { data, onClose, onRefresh, onState, onError } = props;
    const activeGame = data.state.active_game;
    const modes = modeOptions(data.modes);
    const gameOverrideKey = SP_REACT.useMemo(() => {
        if (!activeGame) {
            return null;
        }
        return `${activeGame.source}:${activeGame.match}`;
    }, [activeGame]);
    const activeGameOverrides = gameOverrideKey ? data.settings.game_overrides?.[gameOverrideKey] ?? {} : {};
    const [requestedPage, setRequestedPage] = SP_REACT.useState("automation");
    const [gameMode, setGameMode] = SP_REACT.useState(String(activeGameOverrides.PERFORMANCE_MODE ?? ""));
    const [gameDefaultTdp, setGameDefaultTdp] = SP_REACT.useState(Number(activeGameOverrides.DEFAULT_TDP ?? data.state.resolved_config.DEFAULT_TDP ?? 10000));
    const [gameBatteryTdp, setGameBatteryTdp] = SP_REACT.useState(Number(activeGameOverrides.BATTERY_MAX_TDP ?? data.state.resolved_config.BATTERY_MAX_TDP ?? 15000));
    const [gameDesiredFps, setGameDesiredFps] = SP_REACT.useState(Number(activeGameOverrides.DESIRED_FPS ?? data.settings.desired_fps));
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
        }
        catch (caught) {
            onError(String(caught));
        }
    };
    const clearGameProfile = async () => {
        try {
            const next = await updateActiveGameProfile({ clear: true });
            onState(next);
            onError(null);
            setGameMode("");
        }
        catch (caught) {
            onError(String(caught));
        }
    };
    const pages = [
        {
            title: "Automation",
            identifier: "automation",
            content: (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Battery Automation", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto battery profile switching", description: "Switch modes automatically on battery, keep manual base mode for AC", checked: data.settings.auto_battery_switch, onChange: async (checked) => onState(await setPluginSettings({ auto_battery_switch: checked })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Battery mode", description: "Mode used on battery above low threshold", rgOptions: modes, selectedOption: data.settings.battery_mode, onChange: async (option) => onState(await setPluginSettings({ battery_mode: String(option.data) })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Low battery mode", description: "Mode used below low threshold", rgOptions: modes, selectedOption: data.settings.battery_low_mode, onChange: async (option) => onState(await setPluginSettings({ battery_low_mode: String(option.data) })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Low battery threshold", description: "Percent where low battery mode kicks in", value: data.settings.battery_low_threshold, min: 5, max: 50, step: 1, showValue: true, valueSuffix: "%", editableValue: true, onChange: async (value) => onState(await setPluginSettings({ battery_low_threshold: value })) }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Profiles", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-save active game profile", description: "Quick slider changes save to current game when game detected", checked: data.settings.auto_save_game_profiles, onChange: async (checked) => onState(await setPluginSettings({ auto_save_game_profiles: checked })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Desired FPS target", description: "Experimental. Scales TDP budget heuristically toward target framerate", checked: data.settings.desired_fps_enabled, onChange: async (checked) => onState(await setPluginSettings({ desired_fps_enabled: checked })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Desired FPS", description: "Experimental target", value: data.settings.desired_fps, min: 30, max: 120, step: 1, showValue: true, valueSuffix: " fps", editableValue: true, disabled: !data.settings.desired_fps_enabled, onChange: async (value) => onState(await setPluginSettings({ desired_fps: value })) }) })] })] })),
        },
        {
            title: "Game Profile",
            identifier: "game",
            content: (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Active Game", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: activeGame?.display_name ?? "No active game detected" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: activeGame?.steam_appid ? `Steam AppID: ${activeGame.steam_appid}` : "Non-Steam or unknown game" }), activeGame?.steamdb_url ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Open SteamDB", description: activeGame.steamdb_url, onClick: () => DFL.Navigation.NavigateToExternalWeb(activeGame.steamdb_url) }) })) : null] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Current Game Overrides", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Game mode", description: "Override only this detected game", rgOptions: [{ data: "", label: "Use default/bundled" }, ...modes], selectedOption: gameMode, onChange: (option) => setGameMode(String(option.data)) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Game default TDP", description: "Saved per game", value: gameDefaultTdp, min: Number(data.state.resolved_config.MIN_TDP), max: Number(data.state.resolved_config.MAX_CPU_TDP), step: Number(data.state.resolved_config.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => setGameDefaultTdp(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Game battery max TDP", description: "Saved per game", value: gameBatteryTdp, min: Number(data.state.resolved_config.MIN_TDP), max: Number(data.state.resolved_config.MAX_CPU_TDP), step: Number(data.state.resolved_config.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => setGameBatteryTdp(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Game desired FPS", description: "Experimental per game target", value: gameDesiredFps, min: 30, max: 120, step: 1, showValue: true, valueSuffix: " fps", editableValue: true, onChange: (value) => setGameDesiredFps(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Save game profile", description: "Persist current game overrides", onClick: () => void saveGameProfile() }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Clear game profile", description: "Remove current game overrides", onClick: () => void clearGameProfile() }) })] })] })),
        },
        {
            title: "HHD",
            identifier: "hhd",
            content: (SP_JSX.jsx(SP_JSX.Fragment, { children: SP_JSX.jsxs(DFL.PanelSection, { title: "Handheld Daemon Compatibility", children: [SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Available: ", data.state.hhd.available ? "Yes" : "No"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Service active: ", data.state.hhd.service_active ? "Yes" : "No"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["TDP enabled in HHD: ", data.state.hhd.tdp_enabled === null ? "Unknown" : data.state.hhd.tdp_enabled ? "Yes" : "No"] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "HHD compatibility mode", description: "Disable only HHD TDP control while keeping button and controller features alive", checked: data.settings.hhd_compatibility_mode, onChange: async (checked) => onState(await setPluginSettings({ hhd_compatibility_mode: checked })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Restore HHD TDP on AutoTDP disable", description: "Turn HHD TDP back on when plugin disables", checked: data.settings.restore_hhd_tdp_on_disable, onChange: async (checked) => onState(await setPluginSettings({ restore_hhd_tdp_on_disable: checked })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Disable HHD TDP now", description: "Keep HHD button features, stop HHD TDP loop", onClick: async () => onState(await syncHhdTdp(false)) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Enable HHD TDP now", description: "Restore HHD TDP management", onClick: async () => onState(await syncHhdTdp(true)) }) })] }) })),
        },
        {
            title: "Battery",
            identifier: "battery",
            content: (SP_JSX.jsx(SP_JSX.Fragment, { children: SP_JSX.jsxs(DFL.PanelSection, { title: "Battery Stats", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: batterySummary(data.state) }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Present: ", data.state.battery.present ? "Yes" : "No"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Charge: ", data.state.battery.percent ?? "Unknown", "%"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Status: ", data.state.battery.status ?? "Unknown"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Power draw: ", data.state.battery.power_w ?? "Unknown", " W"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Energy: ", data.state.battery.energy_wh ?? "Unknown", " Wh"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Time estimate: ", data.state.battery.formatted_time_remaining ?? "Unknown"] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Refresh telemetry", description: "Poll backend again", onClick: () => void onRefresh() }) })] }) })),
        },
    ];
    return (SP_JSX.jsx(DFL.ModalRoot, { closeModal: onClose, onCancel: onClose, bAllowFullSize: true, bDisableBackgroundDismiss: true, children: SP_JSX.jsx(DFL.SidebarNavigation, { title: "AutoTDP Advanced", showTitle: true, pages: pages, page: requestedPage, onPageRequested: setRequestedPage }) }));
}
function Content() {
    const [data, setData] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const refresh = async () => {
        try {
            setLoading(true);
            const next = await getState();
            setData(next);
            setError(null);
        }
        catch (caught) {
            setError(String(caught));
        }
        finally {
            setLoading(false);
        }
    };
    SP_REACT.useEffect(() => {
        void refresh();
        const listener = addEventListener("autotdp_state", (state) => {
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
        return SP_JSX.jsx(DFL.PanelSection, { title: "AutoTDP", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: "Loading..." }) });
    }
    if (!data) {
        return SP_JSX.jsx(DFL.PanelSection, { title: "AutoTDP", children: SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Load failed: ", error] }) });
    }
    const resolved = data.state.resolved_config;
    const currentGameLabel = data.state.active_game?.steamdb_name ?? data.state.active_game?.display_name ?? "No game detected";
    const currentMode = String(resolved.ACTIVE_MODE ?? resolved.PERFORMANCE_MODE ?? data.settings.performance_mode);
    const profileOpts = profileOptions(data.profiles);
    const modes = modeOptions(data.modes);
    const openAdvanced = () => {
        const modal = DFL.showModal(SP_JSX.jsx(AdvancedModal, { data: data, onClose: () => modal.Close(), onRefresh: refresh, onState: setData, onError: setError }), undefined, {
            strTitle: "AutoTDP Advanced",
            bHideMainWindowForPopouts: false,
            popupWidth: 1200,
            popupHeight: 900,
        });
    };
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Runtime", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Enable AutoTDP", description: "Adaptive TDP loop. HHD compatibility mode will disable only HHD TDP controls, not button helpers.", checked: data.settings.enabled, onChange: async (checked) => setData(await setEnabled(checked)) }) }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Game: ", currentGameLabel] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["CPU usage: ", data.state.cpu_usage, "%"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Current TDP: ", data.state.current_tdp ?? resolved.ACTIVE_DEFAULT_TDP, " mW"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Effective mode: ", labelize(currentMode)] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: batterySummary(data.state) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Quick Settings", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Device profile", description: "Hardware baseline", rgOptions: profileOpts, selectedOption: data.settings.device_profile, onChange: async (option) => setData(await setDeviceProfile(String(option.data))) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Base mode", description: "Preferred AC / manual mode", rgOptions: modes, selectedOption: data.settings.performance_mode, onChange: async (option) => setData(await setPerformanceMode(String(option.data))) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Default TDP", description: data.settings.auto_save_game_profiles && data.state.active_game ? "Auto-saves to current game profile" : "Global override", value: Number(data.state.active_game && data.settings.auto_save_game_profiles ? resolved.DEFAULT_TDP : data.settings.profile_overrides.DEFAULT_TDP ?? resolved.DEFAULT_TDP), min: Number(resolved.MIN_TDP), max: Number(resolved.MAX_CPU_TDP), step: Number(resolved.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: async (value) => setData(await setProfileOverride("DEFAULT_TDP", value)) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Battery max TDP", description: data.settings.auto_save_game_profiles && data.state.active_game ? "Auto-saves to current game profile" : "Global override", value: Number(data.state.active_game && data.settings.auto_save_game_profiles ? resolved.BATTERY_MAX_TDP : data.settings.profile_overrides.BATTERY_MAX_TDP ?? resolved.BATTERY_MAX_TDP), min: Number(resolved.MIN_TDP), max: Number(resolved.MAX_CPU_TDP), step: Number(resolved.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: async (value) => setData(await setProfileOverride("BATTERY_MAX_TDP", value)) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Monitor interval", description: data.settings.auto_save_game_profiles && data.state.active_game ? "Auto-saves to current game profile" : "Global override", value: Number(data.settings.profile_overrides.MONITOR_INTERVAL ?? resolved.MONITOR_INTERVAL), min: 1, max: 10, step: 1, showValue: true, valueSuffix: " s", editableValue: true, onChange: async (value) => setData(await setProfileOverride("MONITOR_INTERVAL", value)) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Desired FPS", description: "Experimental heuristic target", value: data.settings.desired_fps, min: 30, max: 120, step: 1, showValue: true, valueSuffix: " fps", editableValue: true, disabled: !data.settings.desired_fps_enabled, onChange: async (value) => setData(await setPluginSettings({ desired_fps: value })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Desired FPS enabled", description: "Experimental. May improve battery by cutting excess TDP headroom", checked: data.settings.desired_fps_enabled, onChange: async (checked) => setData(await setPluginSettings({ desired_fps_enabled: checked })) }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Actions", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Open advanced editor", description: "Full-size profile editor, HHD, battery, SteamDB info", onClick: openAdvanced }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Refresh", description: "Poll backend state", onClick: () => void refresh() }) }), error ? SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Error: ", error] }) : null] })] }));
}
var index = definePlugin(() => ({
    name: "AutoTDP",
    titleView: SP_JSX.jsx("div", { children: "AutoTDP" }),
    content: SP_JSX.jsx(Content, {}),
    icon: SP_JSX.jsx(FaTachometerAlt, {}),
    onDismount() { },
    alwaysRender: false,
}));

export { index as default };
//# sourceMappingURL=index.js.map
