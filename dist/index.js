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
const setOverride = callable("set_override");
const setCurrentGameOverride = callable("set_current_game_override");
const cycleLedMode = callable("cycle_led_mode");
const setLedBrightness = callable("set_led_brightness");
const setLedColor = callable("set_led_color");
function labelize(value) {
    return value
        .split("_")
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" ");
}
function toDropdownOptions(values) {
    return values.map((value) => ({ data: value.data, label: value.label }));
}
function Content() {
    const [data, setData] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const [globalDefaultTdp, setGlobalDefaultTdp] = SP_REACT.useState("");
    const [globalBatteryTdp, setGlobalBatteryTdp] = SP_REACT.useState("");
    const [globalMonitorInterval, setGlobalMonitorInterval] = SP_REACT.useState("");
    const [gameMode, setGameMode] = SP_REACT.useState("");
    const [gameDefaultTdp, setGameDefaultTdp] = SP_REACT.useState("");
    const [ledBrightness, setLedBrightnessValue] = SP_REACT.useState("64");
    const [ledColor, setLedColorValue] = SP_REACT.useState("00AAFF");
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
        }
        catch (caught) {
            setError(String(caught));
        }
        finally {
            setLoading(false);
        }
    };
    SP_REACT.useEffect(() => {
        refresh();
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
    const currentGameLabel = SP_REACT.useMemo(() => {
        if (!data?.state.active_game) {
            return "No game detected";
        }
        const activeGame = data.state.active_game;
        return `${activeGame.display_name ?? activeGame.match} (${activeGame.source}: ${activeGame.match})`;
    }, [data]);
    const applyGlobalOverride = async (key, value) => {
        try {
            const next = await setOverride(key, value.trim() === "" ? null : value.trim());
            setData(next);
            setError(null);
        }
        catch (caught) {
            setError(String(caught));
        }
    };
    const applyGameOverride = async () => {
        try {
            const patch = {};
            patch.PERFORMANCE_MODE = gameMode.trim() === "" ? null : gameMode.trim();
            patch.DEFAULT_TDP = gameDefaultTdp.trim() === "" ? null : gameDefaultTdp.trim();
            const next = await setCurrentGameOverride(patch);
            setData(next);
            setError(null);
        }
        catch (caught) {
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
        }
        catch (caught) {
            setError(String(caught));
        }
    };
    if (loading && !data) {
        return SP_JSX.jsx(DFL.PanelSection, { title: "AutoTDP", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: "Loading..." }) });
    }
    if (!data) {
        return SP_JSX.jsx(DFL.PanelSection, { title: "AutoTDP", children: SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Load failed: ", error] }) });
    }
    const resolvedConfig = data.state.resolved_config;
    const led = data.ledCapabilities;
    const profileOptions = toDropdownOptions(data.profiles.map((profile) => ({
        data: profile.key,
        label: `${profile.display_name}${profile.supported ? "" : " [unsupported]"}`,
    })));
    const modeOptions = toDropdownOptions(data.modes.map((mode) => ({ data: mode, label: labelize(mode) })));
    const gameModeOptions = [{ data: "", label: "Use detected/default" }, ...modeOptions];
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Runtime", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Enable AutoTDP", description: "Main adaptive TDP loop", checked: data.settings.enabled, onChange: async (checked) => setData(await setEnabled(checked)) }) }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["CPU usage: ", data.state.cpu_usage, "%"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Current TDP: ", data.state.current_tdp ?? resolvedConfig.ACTIVE_DEFAULT_TDP, " mW"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Power: ", data.state.external_power === null ? "Unknown" : data.state.external_power ? "External" : "Battery"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Game: ", currentGameLabel] })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Base Profile", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Device profile", description: "Hardware baseline", rgOptions: profileOptions, selectedOption: data.settings.device_profile, onChange: async (option) => setData(await setDeviceProfile(String(option.data))) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Mode", description: "Aggressiveness profile", rgOptions: modeOptions, selectedOption: data.settings.performance_mode, onChange: async (option) => setData(await setPerformanceMode(String(option.data))) }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Global Overrides", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Default TDP", description: "mW", mustBeNumeric: true, value: globalDefaultTdp, onChange: (event) => setGlobalDefaultTdp(event.currentTarget.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Save default TDP override", description: "Apply current field", onClick: () => void applyGlobalOverride("DEFAULT_TDP", globalDefaultTdp) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Battery max TDP", description: "mW", mustBeNumeric: true, value: globalBatteryTdp, onChange: (event) => setGlobalBatteryTdp(event.currentTarget.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Save battery max override", description: "Apply current field", onClick: () => void applyGlobalOverride("BATTERY_MAX_TDP", globalBatteryTdp) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Monitor interval", description: "seconds", mustBeNumeric: true, value: globalMonitorInterval, onChange: (event) => setGlobalMonitorInterval(event.currentTarget.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Save monitor interval override", description: "Apply current field", onClick: () => void applyGlobalOverride("MONITOR_INTERVAL", globalMonitorInterval) }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Current Game Override", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: currentGameLabel }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Game mode override", description: "For detected current game", rgOptions: gameModeOptions, selectedOption: gameMode, onChange: (option) => setGameMode(String(option.data)) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Game default TDP", description: "mW", mustBeNumeric: true, value: gameDefaultTdp, onChange: (event) => setGameDefaultTdp(event.currentTarget.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Save current game override", description: "Mode + default TDP", onClick: () => void applyGameOverride() }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Clear current game override", description: "Remove detected game custom values", onClick: () => void clearGameOverride() }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Experimental LED", children: [SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["asusctl: ", led.asusctl ? "yes" : "no"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Brightness targets: ", led.brightnessTargets?.length ?? 0] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["RGB groups: ", led.rgbGroups?.length ?? 0] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Previous LED mode", description: "asusctl aura previous", onClick: async () => setData(await cycleLedMode("prev")) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Next LED mode", description: "asusctl aura next", onClick: async () => setData(await cycleLedMode("next")) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "LED brightness", description: "0-255", mustBeNumeric: true, value: ledBrightness, onChange: (event) => setLedBrightnessValue(event.currentTarget.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Apply LED brightness", description: "Write brightness to detected LED nodes", onClick: async () => setData(await setLedBrightness(Number(ledBrightness))) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "LED color", description: "RRGGBB", value: ledColor, onChange: (event) => setLedColorValue(event.currentTarget.value.toUpperCase()) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Apply LED color", description: "Write RGB channels if exposed", onClick: async () => setData(await setLedColor(ledColor)) }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Resolved Runtime", children: [SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Mode: ", String(resolvedConfig.PERFORMANCE_MODE)] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Device profile: ", data.state.active_device_profile ?? "unknown"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Max TDP: ", String(resolvedConfig.ACTIVE_MAX_TDP), " mW"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Default TDP: ", String(resolvedConfig.ACTIVE_DEFAULT_TDP), " mW"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Battery max TDP: ", String(resolvedConfig.ACTIVE_BATTERY_MAX_TDP), " mW"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Monitor interval: ", String(resolvedConfig.ACTIVE_MONITOR_INTERVAL), " s"] }), SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Stable samples: ", String(resolvedConfig.ACTIVE_STABLE_SAMPLE_COUNT)] })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Actions", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: "Refresh", description: "Reload backend state", onClick: () => void refresh() }) }), error ? SP_JSX.jsxs(DFL.PanelSectionRow, { children: ["Error: ", error] }) : null] })] }));
}
var index = definePlugin(() => {
    return {
        name: "AutoTDP",
        titleView: SP_JSX.jsx("div", { children: "AutoTDP" }),
        content: SP_JSX.jsx(Content, {}),
        icon: SP_JSX.jsx(FaTachometerAlt, {}),
        onDismount() { },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
