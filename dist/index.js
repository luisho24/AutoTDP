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
function rowStyle() {
    return {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
    };
}
function cardStyle() {
    return {
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "12px",
        marginBottom: "12px",
    };
}
function inputStyle() {
    return {
        width: "100%",
        padding: "8px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.2)",
        color: "white",
    };
}
function buttonStyle() {
    return {
        padding: "8px 10px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.08)",
        color: "white",
    };
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
    const [ledColor, setLedColorValue] = SP_REACT.useState("00aaff");
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
        return SP_JSX.jsx("div", { style: { padding: 16 }, children: "Loading AutoTDP..." });
    }
    if (!data) {
        return SP_JSX.jsxs("div", { style: { padding: 16 }, children: ["Failed loading plugin state: ", error] });
    }
    const resolvedConfig = data.state.resolved_config;
    const led = data.ledCapabilities;
    return (SP_JSX.jsxs("div", { style: { padding: 16, color: "white" }, children: [SP_JSX.jsxs("div", { style: cardStyle(), children: [SP_JSX.jsxs("div", { style: rowStyle(), children: [SP_JSX.jsx("strong", { children: "AutoTDP" }), SP_JSX.jsxs("label", { children: [SP_JSX.jsx("input", { type: "checkbox", checked: data.settings.enabled, onChange: async (event) => setData(await setEnabled(event.target.checked)) }), " ", "Enabled"] })] }), SP_JSX.jsxs("div", { children: ["CPU: ", data.state.cpu_usage, "%"] }), SP_JSX.jsxs("div", { children: ["Current TDP: ", data.state.current_tdp ?? resolvedConfig.ACTIVE_DEFAULT_TDP, " mW"] }), SP_JSX.jsxs("div", { children: ["Power: ", data.state.external_power === null ? "Unknown" : data.state.external_power ? "External" : "Battery"] }), SP_JSX.jsxs("div", { children: ["Game: ", currentGameLabel] })] }), SP_JSX.jsxs("div", { style: cardStyle(), children: [SP_JSX.jsx("strong", { children: "Base Profile" }), SP_JSX.jsxs("div", { style: { marginTop: 8 }, children: [SP_JSX.jsx("div", { style: { marginBottom: 6 }, children: "Device profile" }), SP_JSX.jsx("select", { style: inputStyle(), value: data.settings.device_profile, onChange: async (event) => setData(await setDeviceProfile(event.target.value)), children: data.profiles.map((profile) => (SP_JSX.jsxs("option", { value: profile.key, disabled: !profile.supported, children: [profile.display_name, profile.supported ? "" : " [unsupported]"] }, profile.key))) })] }), SP_JSX.jsxs("div", { style: { marginTop: 8 }, children: [SP_JSX.jsx("div", { style: { marginBottom: 6 }, children: "Mode" }), SP_JSX.jsx("select", { style: inputStyle(), value: data.settings.performance_mode, onChange: async (event) => setData(await setPerformanceMode(event.target.value)), children: data.modes.map((mode) => (SP_JSX.jsx("option", { value: mode, children: labelize(mode) }, mode))) })] })] }), SP_JSX.jsxs("div", { style: cardStyle(), children: [SP_JSX.jsx("strong", { children: "Global Overrides" }), SP_JSX.jsxs("div", { style: { marginTop: 8 }, children: [SP_JSX.jsx("div", { style: { marginBottom: 6 }, children: "Default TDP" }), SP_JSX.jsx("input", { style: inputStyle(), value: globalDefaultTdp, onChange: (event) => setGlobalDefaultTdp(event.target.value) }), SP_JSX.jsx("button", { style: { ...buttonStyle(), marginTop: 8 }, onClick: () => applyGlobalOverride("DEFAULT_TDP", globalDefaultTdp), children: "Save default TDP override" })] }), SP_JSX.jsxs("div", { style: { marginTop: 8 }, children: [SP_JSX.jsx("div", { style: { marginBottom: 6 }, children: "Battery max TDP" }), SP_JSX.jsx("input", { style: inputStyle(), value: globalBatteryTdp, onChange: (event) => setGlobalBatteryTdp(event.target.value) }), SP_JSX.jsx("button", { style: { ...buttonStyle(), marginTop: 8 }, onClick: () => applyGlobalOverride("BATTERY_MAX_TDP", globalBatteryTdp), children: "Save battery TDP override" })] }), SP_JSX.jsxs("div", { style: { marginTop: 8 }, children: [SP_JSX.jsx("div", { style: { marginBottom: 6 }, children: "Monitor interval" }), SP_JSX.jsx("input", { style: inputStyle(), value: globalMonitorInterval, onChange: (event) => setGlobalMonitorInterval(event.target.value) }), SP_JSX.jsx("button", { style: { ...buttonStyle(), marginTop: 8 }, onClick: () => applyGlobalOverride("MONITOR_INTERVAL", globalMonitorInterval), children: "Save monitor interval override" })] })] }), SP_JSX.jsxs("div", { style: cardStyle(), children: [SP_JSX.jsx("strong", { children: "Current Game Override" }), SP_JSX.jsx("div", { style: { marginTop: 8, marginBottom: 6 }, children: currentGameLabel }), SP_JSX.jsx("div", { style: { marginBottom: 6 }, children: "Mode" }), SP_JSX.jsxs("select", { style: inputStyle(), value: gameMode, onChange: (event) => setGameMode(event.target.value), children: [SP_JSX.jsx("option", { value: "", children: "Use detected/default" }), data.modes.map((mode) => (SP_JSX.jsx("option", { value: mode, children: labelize(mode) }, mode)))] }), SP_JSX.jsx("div", { style: { marginTop: 8, marginBottom: 6 }, children: "Default TDP" }), SP_JSX.jsx("input", { style: inputStyle(), value: gameDefaultTdp, onChange: (event) => setGameDefaultTdp(event.target.value) }), SP_JSX.jsxs("div", { style: { display: "flex", gap: 8, marginTop: 8 }, children: [SP_JSX.jsx("button", { style: buttonStyle(), onClick: applyGameOverride, children: "Save current game override" }), SP_JSX.jsx("button", { style: buttonStyle(), onClick: clearGameOverride, children: "Clear current game override" })] })] }), SP_JSX.jsxs("div", { style: cardStyle(), children: [SP_JSX.jsx("strong", { children: "Experimental LED" }), SP_JSX.jsxs("div", { style: { marginTop: 8 }, children: ["asusctl: ", led.asusctl ? "yes" : "no"] }), SP_JSX.jsxs("div", { children: ["Brightness targets: ", led.brightnessTargets?.length ?? 0] }), SP_JSX.jsxs("div", { children: ["RGB groups: ", led.rgbGroups?.length ?? 0] }), SP_JSX.jsxs("div", { style: { display: "flex", gap: 8, marginTop: 8 }, children: [SP_JSX.jsx("button", { style: buttonStyle(), onClick: async () => setData(await cycleLedMode("prev")), children: "Prev LED mode" }), SP_JSX.jsx("button", { style: buttonStyle(), onClick: async () => setData(await cycleLedMode("next")), children: "Next LED mode" })] }), SP_JSX.jsx("div", { style: { marginTop: 8, marginBottom: 6 }, children: "Brightness (0-255)" }), SP_JSX.jsx("input", { style: inputStyle(), value: ledBrightness, onChange: (event) => setLedBrightnessValue(event.target.value) }), SP_JSX.jsx("button", { style: { ...buttonStyle(), marginTop: 8 }, onClick: async () => setData(await setLedBrightness(Number(ledBrightness))), children: "Apply LED brightness" }), SP_JSX.jsx("div", { style: { marginTop: 8, marginBottom: 6 }, children: "RGB color (RRGGBB)" }), SP_JSX.jsx("input", { style: inputStyle(), value: ledColor, onChange: (event) => setLedColorValue(event.target.value) }), SP_JSX.jsx("button", { style: { ...buttonStyle(), marginTop: 8 }, onClick: async () => setData(await setLedColor(ledColor)), children: "Apply LED color" })] }), SP_JSX.jsxs("div", { style: cardStyle(), children: [SP_JSX.jsx("strong", { children: "Resolved Runtime" }), SP_JSX.jsxs("div", { children: ["Mode: ", String(resolvedConfig.PERFORMANCE_MODE)] }), SP_JSX.jsxs("div", { children: ["Device profile: ", data.state.active_device_profile ?? "unknown"] }), SP_JSX.jsxs("div", { children: ["Max TDP: ", String(resolvedConfig.ACTIVE_MAX_TDP), " mW"] }), SP_JSX.jsxs("div", { children: ["Default TDP: ", String(resolvedConfig.ACTIVE_DEFAULT_TDP), " mW"] }), SP_JSX.jsxs("div", { children: ["Battery max TDP: ", String(resolvedConfig.ACTIVE_BATTERY_MAX_TDP), " mW"] }), SP_JSX.jsxs("div", { children: ["Monitor interval: ", String(resolvedConfig.ACTIVE_MONITOR_INTERVAL), " s"] }), SP_JSX.jsxs("div", { children: ["Stable samples: ", String(resolvedConfig.ACTIVE_STABLE_SAMPLE_COUNT)] })] }), SP_JSX.jsx("div", { style: { display: "flex", gap: 8 }, children: SP_JSX.jsx("button", { style: buttonStyle(), onClick: refresh, children: "Refresh" }) }), error ? SP_JSX.jsx("div", { style: { marginTop: 12, color: "#ff8c8c" }, children: error }) : null] }));
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
