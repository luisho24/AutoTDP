var jsxRuntime = {exports: {}};

var reactJsxRuntime_production = {};

/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_production;

function requireReactJsxRuntime_production () {
	if (hasRequiredReactJsxRuntime_production) return reactJsxRuntime_production;
	hasRequiredReactJsxRuntime_production = 1;
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"),
	  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
	  var key = null;
	  void 0 !== maybeKey && (key = "" + maybeKey);
	  void 0 !== config.key && (key = "" + config.key);
	  if ("key" in config) {
	    maybeKey = {};
	    for (var propName in config)
	      "key" !== propName && (maybeKey[propName] = config[propName]);
	  } else maybeKey = config;
	  config = maybeKey.ref;
	  return {
	    $$typeof: REACT_ELEMENT_TYPE,
	    type: type,
	    key: key,
	    ref: void 0 !== config ? config : null,
	    props: maybeKey
	  };
	}
	reactJsxRuntime_production.Fragment = REACT_FRAGMENT_TYPE;
	reactJsxRuntime_production.jsx = jsxProd;
	reactJsxRuntime_production.jsxs = jsxProd;
	return reactJsxRuntime_production;
}

SP_REACT;

var hasRequiredJsxRuntime;

function requireJsxRuntime () {
	if (hasRequiredJsxRuntime) return jsxRuntime.exports;
	hasRequiredJsxRuntime = 1;

	{
	  jsxRuntime.exports = requireReactJsxRuntime_production();
	}
	return jsxRuntime.exports;
}

var jsxRuntimeExports = requireJsxRuntime();

const manifest = {"name":"AutoTDP","author":"Luisho24","flags":["_root"],"api_version":1,"publish":{"tags":["performance","power","handheld","laptop","decky"],"description":"Adaptive AMD TDP control for handhelds and laptops, with game-aware tuning and experimental LED controls.","image":"https://raw.githubusercontent.com/luisho24/AutoTDP/main/performance_8386346.png"}};
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
api.call;
const callable = api.callable;
const addEventListener = api.addEventListener;
const removeEventListener = api.removeEventListener;
api.routerHook;
api.toaster;
api.openFilePicker;
api.executeInTab;
api.injectCssIntoTab;
api.removeCssFromTab;
api.fetchNoCors;
api.getExternalResourceURL;
api.useQuickAccessVisible;
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
}function FaGamepad (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M480.07 96H160a160 160 0 1 0 114.24 272h91.52A160 160 0 1 0 480.07 96zM248 268a12 12 0 0 1-12 12h-52v52a12 12 0 0 1-12 12h-24a12 12 0 0 1-12-12v-52H84a12 12 0 0 1-12-12v-24a12 12 0 0 1 12-12h52v-52a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v52h52a12 12 0 0 1 12 12zm216 76a40 40 0 1 1 40-40 40 40 0 0 1-40 40zm64-96a40 40 0 1 1 40-40 40 40 0 0 1-40 40z"},"child":[]}]})(props);
}function FaDesktop (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M528 0H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h192l-16 48h-72c-13.3 0-24 10.7-24 24s10.7 24 24 24h272c13.3 0 24-10.7 24-24s-10.7-24-24-24h-72l-16-48h192c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48zm-16 352H64V64h448v288z"},"child":[]}]})(props);
}function FaBullseye (props) {
  return GenIcon({"attr":{"viewBox":"0 0 496 512"},"child":[{"tag":"path","attr":{"d":"M248 8C111.03 8 0 119.03 0 256s111.03 248 248 248 248-111.03 248-248S384.97 8 248 8zm0 432c-101.69 0-184-82.29-184-184 0-101.69 82.29-184 184-184 101.69 0 184 82.29 184 184 0 101.69-82.29 184-184 184zm0-312c-70.69 0-128 57.31-128 128s57.31 128 128 128 128-57.31 128-128-57.31-128-128-128zm0 192c-35.29 0-64-28.71-64-64s28.71-64 64-64 64 28.71 64 64-28.71 64-64 64z"},"child":[]}]})(props);
}function FaBolt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 320 512"},"child":[{"tag":"path","attr":{"d":"M296 160H180.6l42.6-129.8C227.2 15 215.7 0 200 0H56C44 0 33.8 8.9 32.2 20.8l-32 240C-1.7 275.2 9.5 288 24 288h118.7L96.6 482.5c-3.6 15.2 8 29.5 23.3 29.5 8.4 0 16.4-4.4 20.8-12l176-304c9.3-15.9-2.2-36-20.7-36z"},"child":[]}]})(props);
}function FaBatteryHalf (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M544 160v64h32v64h-32v64H64V160h480m16-64H48c-26.51 0-48 21.49-48 48v224c0 26.51 21.49 48 48 48h512c26.51 0 48-21.49 48-48v-16h8c13.255 0 24-10.745 24-24V184c0-13.255-10.745-24-24-24h-8v-16c0-26.51-21.49-48-48-48zm-240 96H96v128h224V192z"},"child":[]}]})(props);
}

const getState = callable("get_state");
const setEnabled = callable("set_enabled");
const setDeviceProfile = callable("set_device_profile");
const setPerformanceMode = callable("set_performance_mode");
const setProfileOverride = callable("set_profile_override");
const setPluginSettings = callable("set_plugin_settings");
const updateActiveGameProfile = callable("update_active_game_profile");
const updateSteamUiProfile = callable("update_steam_ui_profile");
const syncHhdTdp = callable("sync_hhd_tdp");
const setRyzenadjSource = callable("set_ryzenadj_source");
const downloadRyzenadj = callable("download_ryzenadj");
callable("set_epp");
callable("set_cpu_governor");
const checkForUpdate = callable("check_for_update");
const triggerOtaUpdate = callable("trigger_ota_update");
function useDebouncedCallback(callback, delay) {
    const timeoutRef = SP_REACT.useRef(null);
    const callbackRef = SP_REACT.useRef(callback);
    callbackRef.current = callback;
    const debouncedFn = SP_REACT.useRef((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    });
    return debouncedFn.current;
}
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
    if (state.battery.power_w_average !== null && state.battery.power_w_average !== undefined) {
        bits.push(`${state.battery.power_w_average}W avg`);
    }
    else if (state.battery.power_w !== null) {
        bits.push(`${state.battery.power_w}W`);
    }
    if (state.battery.formatted_time_remaining_average) {
        bits.push(`${state.battery.formatted_time_remaining_average} est`);
    }
    else if (state.battery.formatted_time_remaining) {
        bits.push(state.battery.formatted_time_remaining);
    }
    return bits.join(" | ");
}
function contextLabel(state) {
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
function getSteamClientGameMetadata(appId) {
    if (!appId) {
        return null;
    }
    const parsed = Number(appId);
    if (!Number.isFinite(parsed) || !window.appStore?.GetAppOverviewByAppID) {
        return null;
    }
    const app = window.appStore.GetAppOverviewByAppID(parsed);
    if (!app) {
        return null;
    }
    const appStore = window.appStore;
    const imageUrl = appStore.GetLandscapeImageURLForApp?.(app) || appStore.GetCachedLandscapeImageURLForApp?.(app) || null;
    const verticalImageUrl = appStore.GetVerticalCapsuleURLForApp?.(app) || appStore.GetCachedVerticalImageURLForApp?.(app) || null;
    return {
        name: app.display_name || null,
        imageUrl,
        verticalImageUrl,
    };
}
function chipStyle(background) {
    return {
        background,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: "0.85em",
        fontWeight: 600,
    };
}
function summaryCardStyle(accent) {
    return {
        border: `1px solid ${accent}`,
        borderRadius: 12,
        padding: 12,
        background: "rgba(255,255,255,0.04)",
    };
}
function getQuickProfileValues(data) {
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
function SelectableInfoRow(props) {
    return (jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.Field, { label: props.label, focusable: true, highlightOnFocus: true, children: jsxRuntimeExports.jsx("div", { children: props.children }) }) }));
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
    const [steamUiMode, setSteamUiMode] = SP_REACT.useState(String(data.settings.steam_ui_profile.PERFORMANCE_MODE ?? "silent"));
    const [steamUiDefaultTdp, setSteamUiDefaultTdp] = SP_REACT.useState(Number(data.settings.steam_ui_profile.DEFAULT_TDP ?? 6000));
    const [steamUiBatteryTdp, setSteamUiBatteryTdp] = SP_REACT.useState(Number(data.settings.steam_ui_profile.BATTERY_MAX_TDP ?? 6000));
    const [steamUiDesiredFps, setSteamUiDesiredFps] = SP_REACT.useState(Number(data.settings.steam_ui_profile.DESIRED_FPS ?? 45));
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
        }
        catch (caught) {
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
        }
        catch (caught) {
            onError(String(caught));
        }
    };
    const pages = [
        {
            title: "Automation",
            identifier: "automation",
            content: (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Battery Automation", children: [jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: "Auto battery profile switching", description: "Switch modes automatically on battery, keep manual base mode for AC", checked: data.settings.auto_battery_switch, onChange: async (checked) => onState(await setPluginSettings({ auto_battery_switch: checked })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.DropdownItem, { label: "Battery mode", description: "Mode used on battery above low threshold", rgOptions: modes, selectedOption: data.settings.battery_mode, onChange: async (option) => onState(await setPluginSettings({ battery_mode: String(option.data) })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.DropdownItem, { label: "Low battery mode", description: "Mode used below low threshold", rgOptions: modes, selectedOption: data.settings.battery_low_mode, onChange: async (option) => onState(await setPluginSettings({ battery_low_mode: String(option.data) })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Low battery threshold", description: "Percent where low battery mode kicks in", value: data.settings.battery_low_threshold, min: 5, max: 50, step: 1, showValue: true, valueSuffix: "%", editableValue: true, onChange: async (value) => onState(await setPluginSettings({ battery_low_threshold: value })) }) })] }), jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Profiles", children: [jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: "Auto-save active game profile", description: "Quick slider changes save to current game when game detected", checked: data.settings.auto_save_game_profiles, onChange: async (checked) => onState(await setPluginSettings({ auto_save_game_profiles: checked })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: "Desired FPS target", description: "Experimental. Scales TDP budget heuristically toward target framerate", checked: data.settings.desired_fps_enabled, onChange: async (checked) => onState(await setPluginSettings({ desired_fps_enabled: checked })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Desired FPS", description: "Experimental target", value: data.settings.desired_fps, min: 30, max: 120, step: 1, showValue: true, valueSuffix: " fps", editableValue: true, disabled: !data.settings.desired_fps_enabled, onChange: async (value) => onState(await setPluginSettings({ desired_fps: value })) }) })] })] })),
        },
        {
            title: "Game Profile",
            identifier: "game",
            content: (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Active Game", children: [jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Detected title", children: activeGame?.display_name ?? "No active game detected" }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Steam info", children: activeGame?.steam_appid ? `Steam AppID: ${activeGame.steam_appid}` : "Non-Steam or unknown game" }), activeGame?.steamdb_url ? (jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Open SteamDB", description: activeGame.steamdb_url, onClick: () => DFL.Navigation.NavigateToExternalWeb(activeGame.steamdb_url) }) })) : null] }), jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Current Game Overrides", children: [jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.DropdownItem, { label: "Game mode", description: "Override only this detected game", rgOptions: [{ data: "", label: "Use default/bundled" }, ...modes], selectedOption: gameMode, onChange: (option) => setGameMode(String(option.data)) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Game default TDP", description: "Saved per game", value: gameDefaultTdp, min: Number(data.state.resolved_config.MIN_TDP), max: Number(data.state.resolved_config.MAX_CPU_TDP), step: Number(data.state.resolved_config.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => setGameDefaultTdp(value) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Game battery max TDP", description: "Saved per game", value: gameBatteryTdp, min: Number(data.state.resolved_config.MIN_TDP), max: Number(data.state.resolved_config.MAX_CPU_TDP), step: Number(data.state.resolved_config.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => setGameBatteryTdp(value) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Game desired FPS", description: "Experimental per game target", value: gameDesiredFps, min: 30, max: 120, step: 1, showValue: true, valueSuffix: " fps", editableValue: true, onChange: (value) => setGameDesiredFps(value) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Save game profile", description: "Persist current game overrides", onClick: () => void saveGameProfile() }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Clear game profile", description: "Remove current game overrides", onClick: () => void clearGameProfile() }) })] })] })),
        },
        {
            title: "Steam UI",
            identifier: "steam-ui",
            content: (jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Steam UI Profile", children: [jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.DropdownItem, { label: "Steam UI mode", description: "Profile used when not playing a game and gamescope focus is Steam", rgOptions: modes, selectedOption: steamUiMode, onChange: (option) => setSteamUiMode(String(option.data)) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Steam UI default TDP", description: "Background and menu power target", value: steamUiDefaultTdp, min: Number(data.state.resolved_config.MIN_TDP), max: Number(data.state.resolved_config.MAX_CPU_TDP), step: Number(data.state.resolved_config.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => setSteamUiDefaultTdp(value) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Steam UI battery max TDP", description: "Battery ceiling when browsing Steam UI", value: steamUiBatteryTdp, min: Number(data.state.resolved_config.MIN_TDP), max: Number(data.state.resolved_config.MAX_CPU_TDP), step: Number(data.state.resolved_config.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => setSteamUiBatteryTdp(value) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Steam UI desired FPS", description: "Target while in menus", value: steamUiDesiredFps, min: 30, max: 120, step: 1, showValue: true, valueSuffix: " fps", editableValue: true, onChange: (value) => setSteamUiDesiredFps(value) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Save Steam UI profile", description: "Persist Steam UI idle tuning", onClick: () => void saveSteamUiProfile() }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Reset Steam UI profile", description: "Restore plugin defaults for menus", onClick: () => void resetSteamUiProfile() }) })] }) })),
        },
        {
            title: "HHD",
            identifier: "hhd",
            content: (jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Handheld Daemon Compatibility", children: [jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Available", children: data.state.hhd.available ? "Yes" : "No" }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Service active", children: data.state.hhd.service_active ? "Yes" : "No" }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "HHD TDP state", children: data.state.hhd.tdp_enabled === null ? "Unknown" : data.state.hhd.tdp_enabled ? "Yes" : "No" }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: "HHD compatibility mode", description: "Disable only HHD TDP control while keeping button and controller features alive", checked: data.settings.hhd_compatibility_mode, onChange: async (checked) => onState(await setPluginSettings({ hhd_compatibility_mode: checked })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: "Restore HHD TDP on AutoTDP disable", description: "Turn HHD TDP back on when plugin disables", checked: data.settings.restore_hhd_tdp_on_disable, onChange: async (checked) => onState(await setPluginSettings({ restore_hhd_tdp_on_disable: checked })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Disable HHD TDP now", description: "Keep HHD button features, stop HHD TDP loop", onClick: async () => onState(await syncHhdTdp(false)) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Enable HHD TDP now", description: "Restore HHD TDP management", onClick: async () => onState(await syncHhdTdp(true)) }) })] }) })),
        },
        {
            title: "RyzenAdj",
            identifier: "ryzenadj",
            content: (jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Binary Source", children: [jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Selected source", children: labelize(data.state.ryzenadj.selected_source) }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Active source", children: data.state.ryzenadj.active_source ? labelize(data.state.ryzenadj.active_source) : "Unavailable" }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.DropdownItem, { label: "RyzenAdj source", description: "Auto prefers installed system binary, then bundled, then downloaded", rgOptions: data.state.ryzenadj.sources.map((source) => ({ data: source, label: labelize(source) })), selectedOption: data.settings.ryzenadj_source, onChange: async (option) => onState(await setRyzenadjSource(String(option.data))) }) }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "System available", children: data.state.ryzenadj.system_available ? "Yes" : "No" }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Bundled available", children: data.state.ryzenadj.bundled_available ? "Yes" : "No" }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Downloaded available", children: data.state.ryzenadj.downloaded_available ? "Yes" : "No" }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Execution test", children: data.state.ryzenadj.test_ok ? "OK" : data.state.ryzenadj.test_error ?? "Failed" }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Resolved path", children: data.state.ryzenadj.resolved_path ?? "None" }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Download precompiled RyzenAdj", description: "Fetch plugin-managed fallback binary", onClick: async () => onState(await downloadRyzenadj()) }) })] }) })),
        },
        {
            title: "Battery",
            identifier: "battery",
            content: (jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Battery Stats", children: [jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Summary", children: batterySummary(data.state) }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Present", children: data.state.battery.present ? "Yes" : "No" }), jsxRuntimeExports.jsxs(SelectableInfoRow, { label: "Charge", children: [data.state.battery.percent ?? "Unknown", "%"] }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Status", children: data.state.battery.status ?? "Unknown" }), jsxRuntimeExports.jsxs(SelectableInfoRow, { label: "Power draw", children: [data.state.battery.power_w ?? "Unknown", " W"] }), jsxRuntimeExports.jsxs(SelectableInfoRow, { label: "Energy", children: [data.state.battery.energy_wh ?? "Unknown", " Wh"] }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Time estimate", children: data.state.battery.formatted_time_remaining ?? "Unknown" }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Refresh telemetry", description: "Poll backend again", onClick: () => void onRefresh() }) })] }) })),
        },
        {
            title: "Update",
            identifier: "update",
            content: (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Auto-Update", children: [jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Current version", children: data.settings.version ?? "Unknown" }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: "Auto-update on boot", description: "Check for and install updates automatically when device starts", checked: data.settings.auto_update_enabled, onChange: async (checked) => onState(await setPluginSettings({ auto_update_enabled: checked })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Check for updates", description: "Manually check GitHub for new version", onClick: async () => {
                                        try {
                                            const result = await checkForUpdate();
                                            if (result.update_available) {
                                                onError(`Update available: v${result.latest_version}`);
                                            }
                                            else {
                                                onError(`Already on latest version: v${result.current_version}`);
                                            }
                                        }
                                        catch (err) {
                                            onError(String(err));
                                        }
                                    } }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Update now", description: "Download and install latest version from GitHub", onClick: async () => {
                                        try {
                                            onError("Update started. Plugin will restart...");
                                            const result = await triggerOtaUpdate();
                                            if (result.success) {
                                                onError("Update successful! Plugin restarted.");
                                            }
                                            else {
                                                onError(`Update failed: ${result.error}`);
                                            }
                                        }
                                        catch (err) {
                                            onError(String(err));
                                        }
                                    } }) })] }), jsxRuntimeExports.jsx(DFL.PanelSection, { title: "Manual Install", children: jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: "Open GitHub releases", description: "Download latest release manually", onClick: () => DFL.Navigation.NavigateToExternalWeb("https://github.com/luisho24/AutoTDP/releases/latest") }) }) })] })),
        },
    ];
    return (jsxRuntimeExports.jsx(DFL.ModalRoot, { closeModal: onClose, onCancel: onClose, bAllowFullSize: true, bDisableBackgroundDismiss: true, children: jsxRuntimeExports.jsx(DFL.SidebarNavigation, { title: "AutoTDP Advanced", showTitle: true, pages: pages, page: requestedPage, onPageRequested: setRequestedPage }) }));
}
function Content() {
    const [data, setData] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const [quickMinTdp, setQuickMinTdp] = SP_REACT.useState(5000);
    const [quickDefaultTdp, setQuickDefaultTdp] = SP_REACT.useState(10000);
    const [quickMaxTdp, setQuickMaxTdp] = SP_REACT.useState(20000);
    const [quickMonitorInterval, setQuickMonitorInterval] = SP_REACT.useState(2);
    const [quickDesiredFps, setQuickDesiredFps] = SP_REACT.useState(60);
    const isDraggingRef = SP_REACT.useRef(false);
    SP_REACT.useRef(null);
    const applyData = (next, syncQuick = true) => {
        setData(next);
        if (!syncQuick || isDraggingRef.current) {
            return;
        }
        const quick = getQuickProfileValues(next);
        setQuickMinTdp(quick.minTdp);
        setQuickDefaultTdp(quick.defaultTdp);
        setQuickMaxTdp(quick.maxTdp);
        setQuickMonitorInterval(quick.monitorInterval);
        setQuickDesiredFps(quick.desiredFps);
    };
    const debouncedSetOverride = useDebouncedCallback(async (key, value) => {
        isDraggingRef.current = false;
        const next = await setProfileOverride(key, value);
        applyData(next);
    }, 300);
    const handleSliderDragStart = () => {
        isDraggingRef.current = true;
    };
    const handleSliderDragEnd = (key, value) => {
        isDraggingRef.current = false;
        debouncedSetOverride(key, value);
    };
    const refresh = async () => {
        try {
            setLoading(true);
            const next = await getState();
            applyData(next);
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
        return jsxRuntimeExports.jsx(DFL.PanelSection, { title: "AutoTDP", children: jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: "Loading..." }) });
    }
    if (!data) {
        return jsxRuntimeExports.jsx(DFL.PanelSection, { title: "AutoTDP", children: jsxRuntimeExports.jsxs(DFL.PanelSectionRow, { children: ["Load failed: ", error] }) });
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
        const modal = DFL.showModal(jsxRuntimeExports.jsx(AdvancedModal, { data: data, onClose: () => modal.Close(), onRefresh: refresh, onState: applyData, onError: setError }), undefined, {
            strTitle: "AutoTDP Advanced",
            bHideMainWindowForPopouts: false,
            popupWidth: 1200,
            popupHeight: 900,
        });
    };
    return (jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Overview", children: [jsxRuntimeExports.jsx(SelectableInfoRow, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaGamepad, {}), " Current activity"] }), children: jsxRuntimeExports.jsx("div", { style: summaryCardStyle("rgba(68, 200, 255, 0.45)"), children: jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, alignItems: "center" }, children: [currentGameArt ? jsxRuntimeExports.jsx("img", { src: currentGameArt, alt: currentGameLabel, style: { width: 64, height: 30, objectFit: "cover", borderRadius: 8 } }) : null, jsxRuntimeExports.jsxs("div", { style: { minWidth: 0 }, children: [jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 6 }, children: currentGameLabel }), jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [jsxRuntimeExports.jsx("span", { style: chipStyle("rgba(68, 200, 255, 0.18)"), children: contextLabel(data.state) }), jsxRuntimeExports.jsx("span", { style: chipStyle("rgba(255, 215, 0, 0.18)"), children: labelize(currentMode) }), data.state.active_game?.steam_appid ? jsxRuntimeExports.jsx("span", { style: chipStyle("rgba(255, 255, 255, 0.12)"), children: "Steam" }) : null] })] })] }) }) }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaBullseye, {}), " FPS target"] }), children: jsxRuntimeExports.jsxs("div", { style: summaryCardStyle("rgba(120, 255, 160, 0.45)"), children: [jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700, marginBottom: 6 }, children: [liveFps, " / ", targetFps, " fps"] }), jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [jsxRuntimeExports.jsxs("span", { style: chipStyle("rgba(120, 255, 160, 0.18)"), children: ["Current ", liveFps] }), jsxRuntimeExports.jsxs("span", { style: chipStyle("rgba(120, 255, 160, 0.18)"), children: ["Target ", targetFps, " fps"] }), data.state.fps_target_unreachable ? jsxRuntimeExports.jsx("span", { style: chipStyle("rgba(255, 120, 120, 0.18)"), children: "Auto-capped" }) : null] })] }) }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaTachometerAlt, {}), " Power state"] }), children: jsxRuntimeExports.jsxs("div", { style: summaryCardStyle("rgba(255, 180, 80, 0.45)"), children: [jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700, marginBottom: 6 }, children: [data.state.current_tdp ?? resolved.ACTIVE_DEFAULT_TDP, " mW"] }), jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [jsxRuntimeExports.jsxs("span", { style: chipStyle("rgba(255, 180, 80, 0.18)"), children: ["CPU ", data.state.cpu_usage, "%"] }), jsxRuntimeExports.jsxs("span", { style: chipStyle("rgba(255, 180, 80, 0.18)"), children: ["Min ", quickMinTdp, " mW"] }), jsxRuntimeExports.jsxs("span", { style: chipStyle("rgba(255, 180, 80, 0.18)"), children: ["Default ", quickDefaultTdp, " mW"] }), jsxRuntimeExports.jsxs("span", { style: chipStyle("rgba(255, 180, 80, 0.18)"), children: ["Ceiling ", quickMaxTdp, " mW"] }), jsxRuntimeExports.jsx("span", { style: chipStyle("rgba(255, 180, 80, 0.18)"), children: data.state.ryzenadj.active_source ? labelize(data.state.ryzenadj.active_source) : "No ryzenadj" })] })] }) }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaBatteryHalf, {}), " Battery"] }), children: jsxRuntimeExports.jsxs("div", { style: summaryCardStyle("rgba(170, 120, 255, 0.45)"), children: [jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 6 }, children: batterySummary(data.state) }), jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [jsxRuntimeExports.jsx("span", { style: chipStyle("rgba(170, 120, 255, 0.18)"), children: data.state.external_power ? "Plugged in" : "Battery / unknown" }), jsxRuntimeExports.jsx("span", { style: chipStyle("rgba(170, 120, 255, 0.18)"), children: data.state.focus ? `Focus: ${data.state.focus}` : "Focus unknown" })] })] }) })] }), jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Runtime Control", children: [jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaBolt, {}), " Enable AutoTDP"] }), description: "Adaptive TDP loop. HHD compatibility mode disables only HHD TDP control, not buttons or controller helpers.", checked: data.settings.enabled, onChange: async (checked) => applyData(await setEnabled(checked)) }) }), jsxRuntimeExports.jsx(SelectableInfoRow, { label: "RyzenAdj status", children: data.state.ryzenadj.test_ok ? `Ready (${data.state.ryzenadj.active_source ?? "none"})` : data.state.ryzenadj.test_error ?? "Unavailable" }), data.state.asus_wmi?.available ? jsxRuntimeExports.jsx(SelectableInfoRow, { label: "ASUS WMI power path", children: "Active" }) : null, data.state.asus_wmi?.values?.profile ? jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Platform profile", children: String(data.state.asus_wmi.values.profile) }) : null, data.state.hhd.conflict_warning ? jsxRuntimeExports.jsx(SelectableInfoRow, { label: "Conflict warning", children: data.state.hhd.conflict_warning }) : null] }), jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Quick Settings", children: [jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.DropdownItem, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaDesktop, {}), " Device profile"] }), description: "Choose hardware baseline for handheld or laptop", rgOptions: profileOpts, selectedOption: data.settings.device_profile, onChange: async (option) => applyData(await setDeviceProfile(String(option.data))) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.DropdownItem, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaBolt, {}), " Base mode"] }), description: "Preferred performance mode when automation does not override it", rgOptions: modes, selectedOption: data.settings.performance_mode, onChange: async (option) => applyData(await setPerformanceMode(String(option.data))) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Minimum TDP", description: "Lowest TDP AutoTDP may use", value: quickMinTdp, min: 2000, max: quickMaxTdp, step: 1000, showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => {
                                const clamped = Math.min(value, quickDefaultTdp, quickMaxTdp);
                                setQuickMinTdp(clamped);
                            }, onFocus: () => handleSliderDragStart(), onBlur: () => handleSliderDragEnd("MIN_TDP", Math.min(quickMinTdp, quickDefaultTdp, quickMaxTdp)) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Default TDP", description: data.settings.auto_save_game_profiles && data.state.active_game ? "Active game profile target" : "Default target while gaming", value: quickDefaultTdp, min: quickMinTdp, max: quickMaxTdp, step: Number(resolved.STEP_TDP), showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => {
                                const clamped = Math.max(quickMinTdp, Math.min(value, quickMaxTdp));
                                setQuickDefaultTdp(clamped);
                            }, onFocus: () => handleSliderDragStart(), onBlur: () => handleSliderDragEnd("DEFAULT_TDP", quickDefaultTdp) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Ceiling TDP", description: "Highest TDP AutoTDP may use", value: quickMaxTdp, min: quickMinTdp, max: 35000, step: 1000, showValue: true, valueSuffix: " mW", editableValue: true, onChange: (value) => {
                                const clamped = Math.max(value, quickDefaultTdp, quickMinTdp);
                                setQuickMaxTdp(clamped);
                            }, onFocus: () => handleSliderDragStart(), onBlur: () => handleSliderDragEnd("MAX_CPU_TDP", Math.max(quickMaxTdp, quickDefaultTdp, quickMinTdp)) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Desired FPS", description: "Experimental. AutoTDP trims extra CPU power headroom when FPS sits above target and reacts faster when below target", value: quickDesiredFps, min: 30, max: 120, step: 1, showValue: true, valueSuffix: " fps", editableValue: true, disabled: !data.settings.desired_fps_enabled, onChange: (value) => {
                                setQuickDesiredFps(value);
                            }, onFocus: () => handleSliderDragStart(), onBlur: () => {
                                isDraggingRef.current = false;
                                setPluginSettings({ desired_fps: quickDesiredFps });
                            } }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaBullseye, {}), " Desired FPS control"] }), description: "Experimental. Uses real Gamescope FPS telemetry when available", checked: data.settings.desired_fps_enabled, onChange: async (checked) => applyData(await setPluginSettings({ desired_fps_enabled: checked })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ToggleField, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaBatteryHalf, {}), " Auto battery switching"] }), description: "Switch to battery-specific modes automatically but still keep your manual base mode for AC", checked: data.settings.auto_battery_switch, onChange: async (checked) => applyData(await setPluginSettings({ auto_battery_switch: checked })) }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.SliderField, { label: "Sampling interval", description: "How fast AutoTDP re-checks load and FPS telemetry", value: quickMonitorInterval, min: 1, max: 5, step: 1, showValue: true, valueSuffix: " s", editableValue: true, onChange: async (value) => {
                                setQuickMonitorInterval(value);
                                const next = await setProfileOverride("MONITOR_INTERVAL", value);
                                applyData(next);
                            } }) })] }), jsxRuntimeExports.jsxs(DFL.PanelSection, { title: "Actions", children: [jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaDesktop, {}), " Open advanced editor"] }), description: "Profiles, Steam UI, HHD, RyzenAdj, battery, SteamDB", onClick: openAdvanced }) }), jsxRuntimeExports.jsx(DFL.PanelSectionRow, { children: jsxRuntimeExports.jsx(DFL.ButtonItem, { label: jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsxRuntimeExports.jsx(FaBolt, {}), " Refresh status"] }), description: "Reload backend state and telemetry", onClick: () => void refresh() }) }), error ? jsxRuntimeExports.jsxs(DFL.PanelSectionRow, { children: ["Error: ", error] }) : null] })] }));
}
var index = definePlugin(() => ({
    name: "AutoTDP",
    titleView: jsxRuntimeExports.jsx("div", { children: "AutoTDP" }),
    content: jsxRuntimeExports.jsx(Content, {}),
    icon: jsxRuntimeExports.jsx(FaTachometerAlt, {}),
    onDismount() { },
    alwaysRender: false,
}));

export { index as default };
//# sourceMappingURL=index.js.map
