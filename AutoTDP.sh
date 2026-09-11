#!/bin/bash

set -u

# Configuration
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
CONFIG_DIR="/etc/AutoTDP"  # Shared configuration directory
CONFIG_FILE="$CONFIG_DIR/AutoTDP.config"
KNOWN_DEVICES_FILE="$CONFIG_DIR/known_devices.json"
KNOWN_DEVICES_SOURCE_FILE="$SCRIPT_DIR/known_devices.json"
GAME_PROFILES_FILE="$CONFIG_DIR/game_profiles.json"
GAME_PROFILES_SOURCE_FILE="$SCRIPT_DIR/game_profiles.json"
LOG_DIR="$CONFIG_DIR/logs"
LOG_FILE="$LOG_DIR/tdp_manager_$(date +'%Y-%m-%d_%H-%M-%S').log"  # New log file per run
REQUIRED_PACKAGES=("jq" "sudo" "ryzenadj")

# Global variables
MIN_TDP=5000
DEFAULT_TDP=10000
MAX_CPU_TDP=18000
STEP_TDP=1000  # Step increment for TDP adjustments

RYZENADJ_EXEC=ryzenadj
RYZENADJ_DELAY=4  # Delay in seconds between adjustments
MONITOR_INTERVAL=3
STABLE_SAMPLE_COUNT=2
BATTERY_MAX_TDP=$MAX_CPU_TDP
DEVICE_PROFILE="generic"
DEVICE_PROFILE_FILE="$KNOWN_DEVICES_FILE"
PERFORMANCE_MODE="balanced"
GAME_PROFILE_FILE="$GAME_PROFILES_FILE"
SKIP_CLEANUP=0
CLI_PROFILE_OVERRIDE=""
CLI_MODE_OVERRIDE=""
PERSIST_PROFILE=0
PERSIST_MODE=0
ACTION="run"
EXIT_STATUS=0
MONITOR_PID=0
declare -a CLI_OVERRIDES=()
declare -a GAME_COMMAND=()

BASE_MIN_TDP=$MIN_TDP
BASE_DEFAULT_TDP=$DEFAULT_TDP
BASE_MAX_CPU_TDP=$MAX_CPU_TDP
BASE_STEP_TDP=$STEP_TDP
BASE_RYZENADJ_EXEC=$RYZENADJ_EXEC
BASE_RYZENADJ_DELAY=$RYZENADJ_DELAY
BASE_MONITOR_INTERVAL=$MONITOR_INTERVAL
BASE_STABLE_SAMPLE_COUNT=$STABLE_SAMPLE_COUNT
BASE_BATTERY_MAX_TDP=$BATTERY_MAX_TDP
BASE_PERFORMANCE_MODE=$PERFORMANCE_MODE

CURRENT_GAME_PROFILE=""
CURRENT_GAME_SOURCE=""
CURRENT_GAME_MATCH=""
CURRENT_GAME_NAME=""

ACTIVE_DEFAULT_TDP=$DEFAULT_TDP
ACTIVE_MAX_TDP=$MAX_CPU_TDP
ACTIVE_BATTERY_MAX_TDP=$BATTERY_MAX_TDP
ACTIVE_RYZENADJ_DELAY=$RYZENADJ_DELAY
ACTIVE_MONITOR_INTERVAL=$MONITOR_INTERVAL
ACTIVE_STABLE_SAMPLE_COUNT=$STABLE_SAMPLE_COUNT
ACTIVE_THRESHOLD_OFFSET=0

SERVICE_FILE="/etc/systemd/system/autotdp.service"
SCRIPT_DEST="/usr/local/bin/autotdp.sh"
UPDATE_URL="https://raw.githubusercontent.com/aerodevxp/AutoTDP/refs/heads/main/AutoTDP.sh"
UPDATE_CHECK_INTERVAL=21600  # Check for updates every 6 hours

print_usage() {
    cat <<EOF
Usage: $0 [options]

Options:
  --install                 Install AutoTDP as a systemd service
  --update                  Check for and install script updates from the aerodevxp repo
  --mode <name>             Run with a temporary mode override
  --set-mode <name>         Persist the selected mode to the config file
  --profile <name>          Run with a temporary device profile override
  --set-profile <name>      Persist the selected profile to the config file
  --override KEY=VALUE      Override any supported setting for this run
  --list-modes              Print available performance modes
  --list-profiles           Print available device profiles
  -- <command ...>          Run a game or app while AutoTDP monitors it
  --help                    Show this help message
EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --)
                shift
                GAME_COMMAND=("$@")
                break
                ;;
            --install)
                ACTION="install"
                ;;
            --update)
                ACTION="update"
                ;;
            --mode)
                CLI_MODE_OVERRIDE=${2:-}
                if [[ -z "$CLI_MODE_OVERRIDE" ]]; then
                    echo "Missing value for --mode" >&2
                    exit 1
                fi
                shift
                ;;
            --set-mode)
                CLI_MODE_OVERRIDE=${2:-}
                PERSIST_MODE=1
                ACTION="configure"
                if [[ -z "$CLI_MODE_OVERRIDE" ]]; then
                    echo "Missing value for --set-mode" >&2
                    exit 1
                fi
                shift
                ;;
            --profile)
                CLI_PROFILE_OVERRIDE=${2:-}
                if [[ -z "$CLI_PROFILE_OVERRIDE" ]]; then
                    echo "Missing value for --profile" >&2
                    exit 1
                fi
                shift
                ;;
            --set-profile)
                CLI_PROFILE_OVERRIDE=${2:-}
                PERSIST_PROFILE=1
                ACTION="configure"
                if [[ -z "$CLI_PROFILE_OVERRIDE" ]]; then
                    echo "Missing value for --set-profile" >&2
                    exit 1
                fi
                shift
                ;;
            --override)
                if [[ -z ${2:-} ]]; then
                    echo "Missing value for --override" >&2
                    exit 1
                fi
                CLI_OVERRIDES+=("$2")
                shift
                ;;
            --list-modes)
                ACTION="list-modes"
                ;;
            --list-profiles)
                ACTION="list-profiles"
                ;;
            --help)
                ACTION="help"
                ;;
            *)
                echo "Unknown option: $1" >&2
                print_usage
                exit 1
                ;;
        esac
        shift
    done
}

print_modes() {
    cat <<EOF
Available modes:
  silent       Lowest ceiling, slowest ramp, best battery life
  battery      Conservative balanced mode for unplugged use
  balanced     Default mode
  performance  Faster ramp and higher sustained targets
  turbo        Most aggressive mode for plugged-in use
EOF
}

is_supported_override_key() {
    case "$1" in
        MIN_TDP|DEFAULT_TDP|MAX_CPU_TDP|STEP_TDP|RYZENADJ_EXEC|RYZENADJ_DELAY|MONITOR_INTERVAL|STABLE_SAMPLE_COUNT|BATTERY_MAX_TDP|DEVICE_PROFILE|DEVICE_PROFILE_FILE|PERFORMANCE_MODE|GAME_PROFILE_FILE)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

apply_cli_overrides() {
    local phase=$1
    local override_entry
    local override_key
    local override_value

    for override_entry in "${CLI_OVERRIDES[@]}"; do
        if [[ $override_entry != *=* ]]; then
            log "Invalid override syntax: $override_entry"
            exit 1
        fi

        override_key=${override_entry%%=*}
        override_value=${override_entry#*=}

        if ! is_supported_override_key "$override_key"; then
            log "Unsupported override key: $override_key"
            exit 1
        fi

        if [[ $phase == "pre-profile" ]]; then
            case "$override_key" in
                DEVICE_PROFILE|DEVICE_PROFILE_FILE)
                    ;;
                *)
                    continue
                    ;;
            esac
        else
            case "$override_key" in
                DEVICE_PROFILE|DEVICE_PROFILE_FILE)
                    continue
                    ;;
            esac
        fi

        printf -v "$override_key" '%s' "$override_value"
    done
}

# Function to log messages to console and log file
log() {
    local message=$1
    local timestamp
    timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo "$timestamp - $message"
    printf '%s - %s\n' "$timestamp" "$message" | run_privileged tee -a "$LOG_FILE" > /dev/null
}

run_privileged() {
    if [[ $EUID -eq 0 ]]; then
        "$@"
    else
        sudo "$@"
    fi
}

elevate_privileges() {
    if [[ $EUID -ne 0 ]]; then
        exec sudo --preserve-env=PATH bash "$0" "$@"
    fi
}

# Function to check if required packages are installed
check_packages() {
    local missing_packages=()
    for package in "${REQUIRED_PACKAGES[@]}"; do
        if ! command -v "$package" &> /dev/null; then
            missing_packages+=("$package")
        fi
    done

    if [ ${#missing_packages[@]} -ne 0 ]; then
        log "Missing packages: ${missing_packages[*]}"
        log "Please install the missing packages and try again."
        exit 1
    fi
}

# Function to set TDP values
set_tdp() {
    local value=$1
    if (( value < BASE_MIN_TDP )); then
        value=$BASE_MIN_TDP
    fi
    if run_privileged "$RYZENADJ_EXEC" --stapm-limit "$value" --fast-limit "$value" --slow-limit "$value"; then
        log "TDP set to $value"
    else
        log "Failed to set TDP to $value"
    fi
}

# Reads per-core cumulative CPU times as a single snapshot string
read_core_snapshot() {
    awk '/^cpu[0-9]+/ {printf "%s %s ", $2+$3+$4+$5+$6+$7+$8+$9, $5} END {print ""}' /proc/stat
}

# Computes the busiest single core's busy percentage against the previous snapshot.
get_max_cpu_usage() {
    local previous=$1
    local current
    local top4=0 peak=0 breadth=0
    local i n td id busy pct
    local -a pts cts pcts

    current=$(read_core_snapshot)

    read -r -a pts <<< "$previous"
    read -r -a cts <<< "$current"

    n=$(( ${#cts[@]} / 2 ))

    if (( ${#pts[@]} == ${#cts[@]} && n > 0 )); then
        for ((i=0; i<n; i++)); do
            td=$(( ${cts[i*2]} - ${pts[i*2]} ))
            id=$(( ${cts[i*2+1]} - ${pts[i*2+1]} ))
            if (( td <= 0 )); then
                continue
            fi
            busy=$((td - id))
            (( busy < 0 )) && busy=0
            pct=$(( busy * 100 / td ))
            pcts+=("$pct")
            (( pct > peak )) && peak=$pct
            (( pct >= 40 )) && breadth=$((breadth + 1))
        done

        if (( ${#pcts[@]} > 0 )); then
            top4=$(printf '%s\n' "${pcts[@]}" | sort -rn | head -4 | awk '{s+=$1} END {printf "%d", s / NR}')
        fi
    fi

    echo "$top4 $breadth $peak $current"
}

# Function to read the highest GPU utilization across all DRM cards
get_max_gpu_usage() {
    local max_gpu=0
    local gpu_pct
    for f in /sys/class/drm/card*/device/gpu_busy_percent; do
        [[ -r "$f" ]] || continue
        gpu_pct=$(cat "$f" 2>/dev/null) || continue
        if (( gpu_pct > max_gpu )); then
            max_gpu=$gpu_pct
        fi
    done
    echo "$max_gpu"
}

# Returns current APU power draw in watts, 0 if unreadable
get_apu_power_w() {
    local f p
    for f in /sys/class/hwmon/hwmon*/power1_average; do
        [[ -r "$f" ]] || continue
        grep -qi amdgpu "${f%power1_average}name" 2>/dev/null || continue
        p=$(cat "$f" 2>/dev/null) || continue
        echo $(( p / 1000000 ))   # µW -> W
        return 0
    done
    return 1
}

is_on_external_power() {
    local supply
    local supply_type
    local online

    for supply in /sys/class/power_supply/*; do
        [[ -d "$supply" && -r "$supply/type" && -r "$supply/online" ]] || continue
        read -r supply_type < "$supply/type" || continue

        case "$supply_type" in
            Mains|USB|USB_C|USB_PD|Wireless)
                read -r online < "$supply/online" || continue
                if [[ $online == "1" ]]; then
                    return 0
                fi
                ;;
        esac
    done

    return 1
}

validate_performance_mode() {
    case "$1" in
        silent|battery|balanced|performance|turbo)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

align_tdp_to_step() {
    local value=$1

    if (( value < MIN_TDP )); then
        value=$MIN_TDP
    fi

    echo $(( (value / STEP_TDP) * STEP_TDP ))
}

scale_tdp_value() {
    local value=$1
    local percent=$2
    local scaled=$(( (value * percent) / 100 ))

    if (( scaled < MIN_TDP )); then
        scaled=$MIN_TDP
    fi

    echo "$scaled"
}

apply_performance_mode() {
    local mode=$1
    local active_max
    local active_default
    local active_battery

    if ! validate_performance_mode "$mode"; then
        log "Unknown performance mode: $mode"
        exit 1
    fi

    case "$mode" in
        silent)
            active_max=$(scale_tdp_value "$MAX_CPU_TDP" 60)
            active_default=$(scale_tdp_value "$DEFAULT_TDP" 75)
            active_battery=$(scale_tdp_value "$BATTERY_MAX_TDP" 75)
            ACTIVE_THRESHOLD_OFFSET=15
            ACTIVE_RYZENADJ_DELAY=$((RYZENADJ_DELAY + 2))
            ACTIVE_MONITOR_INTERVAL=$MONITOR_INTERVAL
            ACTIVE_STABLE_SAMPLE_COUNT=$((STABLE_SAMPLE_COUNT + 1))
            ;;
        battery)
            active_max=$(scale_tdp_value "$MAX_CPU_TDP" 75)
            active_default=$(scale_tdp_value "$DEFAULT_TDP" 85)
            active_battery=$(scale_tdp_value "$BATTERY_MAX_TDP" 85)
            ACTIVE_THRESHOLD_OFFSET=8
            ACTIVE_RYZENADJ_DELAY=$((RYZENADJ_DELAY + 1))
            ACTIVE_MONITOR_INTERVAL=$MONITOR_INTERVAL
            ACTIVE_STABLE_SAMPLE_COUNT=$STABLE_SAMPLE_COUNT
            ;;
        balanced)
            active_max=$MAX_CPU_TDP
            active_default=$DEFAULT_TDP
            active_battery=$BATTERY_MAX_TDP
            ACTIVE_THRESHOLD_OFFSET=0
            ACTIVE_RYZENADJ_DELAY=$RYZENADJ_DELAY
            ACTIVE_MONITOR_INTERVAL=$MONITOR_INTERVAL
            ACTIVE_STABLE_SAMPLE_COUNT=$STABLE_SAMPLE_COUNT
            ;;
        performance)
            active_max=$MAX_CPU_TDP
            active_default=$(scale_tdp_value "$DEFAULT_TDP" 115)
            active_battery=$BATTERY_MAX_TDP
            ACTIVE_THRESHOLD_OFFSET=-8
            ACTIVE_RYZENADJ_DELAY=$((RYZENADJ_DELAY > 1 ? RYZENADJ_DELAY - 1 : 1))
            ACTIVE_MONITOR_INTERVAL=$MONITOR_INTERVAL
            ACTIVE_STABLE_SAMPLE_COUNT=1
            ;;
        turbo)
            active_max=$MAX_CPU_TDP
            active_default=$(scale_tdp_value "$DEFAULT_TDP" 130)
            active_battery=$(scale_tdp_value "$BATTERY_MAX_TDP" 110)
            ACTIVE_THRESHOLD_OFFSET=-15
            ACTIVE_RYZENADJ_DELAY=$((RYZENADJ_DELAY > 2 ? RYZENADJ_DELAY - 2 : 1))
            ACTIVE_MONITOR_INTERVAL=$((MONITOR_INTERVAL > 1 ? MONITOR_INTERVAL - 1 : 1))
            ACTIVE_STABLE_SAMPLE_COUNT=1
            ;;
    esac

    ACTIVE_MAX_TDP=$(align_tdp_to_step "$active_max")
    ACTIVE_DEFAULT_TDP=$(align_tdp_to_step "$active_default")
    ACTIVE_BATTERY_MAX_TDP=$(align_tdp_to_step "$active_battery")

    if (( ACTIVE_DEFAULT_TDP > ACTIVE_MAX_TDP )); then
        ACTIVE_DEFAULT_TDP=$ACTIVE_MAX_TDP
    fi

    if (( ACTIVE_BATTERY_MAX_TDP > ACTIVE_MAX_TDP )); then
        ACTIVE_BATTERY_MAX_TDP=$ACTIVE_MAX_TDP
    fi

    if (( ACTIVE_STABLE_SAMPLE_COUNT <= 0 )); then
        ACTIVE_STABLE_SAMPLE_COUNT=1
    fi

    if (( ACTIVE_RYZENADJ_DELAY <= 0 )); then
        ACTIVE_RYZENADJ_DELAY=1
    fi

    if (( ACTIVE_MONITOR_INTERVAL <= 0 )); then
        ACTIVE_MONITOR_INTERVAL=1
    fi
}

install_known_device_profiles() {
    if [[ -f "$KNOWN_DEVICES_SOURCE_FILE" && ! -f "$KNOWN_DEVICES_FILE" ]]; then
        run_privileged install -m 0644 "$KNOWN_DEVICES_SOURCE_FILE" "$KNOWN_DEVICES_FILE"
    fi
}

install_game_profiles() {
    if [[ -f "$GAME_PROFILES_SOURCE_FILE" && ! -f "$GAME_PROFILES_FILE" ]]; then
        run_privileged install -m 0644 "$GAME_PROFILES_SOURCE_FILE" "$GAME_PROFILES_FILE"
    fi
}

print_device_profiles() {
    local profile_file=$1

    jq -r '
        .profiles
        | to_entries[]
        | "\(.key)\t\(.value.display_name // .key)\t\(.value.supported // true)"
    ' "$profile_file" | while IFS=$'\t' read -r key display_name supported; do
        if [[ $supported == "true" ]]; then
            printf '%s - %s\n' "$key" "$display_name"
        else
            printf '%s - %s [unsupported]\n' "$key" "$display_name"
        fi
    done
}

set_config_value() {
    local key=$1
    local value=$2
    local temp_file
    local updated=0
    local line

    temp_file=$(mktemp)

    while IFS= read -r line || [[ -n "$line" ]]; do
        if [[ $line == "$key="* ]]; then
            printf '%s=%s\n' "$key" "$value" >> "$temp_file"
            updated=1
        else
            printf '%s\n' "$line" >> "$temp_file"
        fi
    done < "$CONFIG_FILE"

    if (( updated == 0 )); then
        printf '%s=%s\n' "$key" "$value" >> "$temp_file"
    fi

    run_privileged install -m 0644 "$temp_file" "$CONFIG_FILE"
    rm -f "$temp_file"
}

restart_service_if_running() {
    if command -v systemctl > /dev/null 2>&1 && [[ -f "$SERVICE_FILE" ]]; then
        if systemctl is-active --quiet autotdp.service; then
            run_privileged systemctl restart autotdp.service
            log "Restarted autotdp.service to apply updated configuration"
        fi
    fi
}

read_env_value_from_pid() {
    local pid=$1
    local env_key=$2

    tr '\0' '\n' < "/proc/$pid/environ" 2> /dev/null | while IFS='=' read -r key value; do
        if [[ $key == "$env_key" ]]; then
            printf '%s\n' "$value"
            break
        fi
    done
}

detect_steam_appid_from_environment() {
    local candidate

    for candidate in "${SteamAppId:-}" "${SteamGameId:-}" "${STEAM_COMPAT_APP_ID:-}"; do
        if [[ -n "$candidate" && "$candidate" != "0" ]]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done

    return 1
}

detect_steam_appid_from_processes() {
    local pid env_data
    for pid_path in /proc/[0-9]*; do
        pid=${pid_path##*/}
        [[ -r "/proc/$pid/environ" ]] || continue
        env_data=$(tr '\0' '\n' < "/proc/$pid/environ" 2> /dev/null)

        for key in SteamAppId SteamGameId STEAM_COMPAT_APP_ID; do
            local candidate
            candidate=$(printf '%s\n' "$env_data" | awk -F= -v k="$key" '$1 == k {print $2; exit}')
            if [[ -n "$candidate" && "$candidate" != "0" ]]; then
                printf '%s\n' "$candidate"
                return 0
            fi
        done
    done
    return 1
}

normalize_executable_name() {
    local value=$1
    value=${value##*/}
    printf '%s\n' "$value" | tr '[:upper:]' '[:lower:]'
}

extract_executable_from_cmdline() {
    local raw_cmdline=$1
    local entry

    IFS=$'\n'
    for entry in $raw_cmdline; do
        if [[ $entry == *.exe || $entry == *.EXE ]]; then
            normalize_executable_name "$entry"
            return 0
        fi
    done
    unset IFS

    return 1
}

detect_executable_from_wrapped_command() {
    local entry

    for entry in "${GAME_COMMAND[@]}"; do
        if [[ $entry == *.exe || $entry == *.EXE ]]; then
            normalize_executable_name "$entry"
            return 0
        fi
    done

    if (( ${#GAME_COMMAND[@]} > 0 )); then
        normalize_executable_name "${GAME_COMMAND[0]}"
        return 0
    fi

    return 1
}

detect_executable_from_processes() {
    local pid
    local cmdline
    local candidate

    for pid_path in /proc/[0-9]*; do
        pid=${pid_path##*/}
        [[ -r "/proc/$pid/cmdline" ]] || continue
        cmdline=$(tr '\0' '\n' < "/proc/$pid/cmdline" 2> /dev/null)
        [[ -n "$cmdline" ]] || continue

        candidate=$(extract_executable_from_cmdline "$cmdline")
        if [[ -n "$candidate" ]]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done

    return 1
}

detect_launcher_type() {
    local pid
    local comm

    for pid_path in /proc/[0-9]*; do
        pid=${pid_path##*/}
        [[ -r "/proc/$pid/comm" ]] || continue
        read -r comm < "/proc/$pid/comm" || continue
        comm=$(printf '%s' "$comm" | tr '[:upper:]' '[:lower:]')

        case "$comm" in
            wineserver|wine|wine64|wine64-preloader|winedevice)
                printf '%s\n' "wine"
                return 0
                ;;
            steam|steamwebhelper)
                printf '%s\n' "steam"
                return 0
                ;;
        esac
    done

    return 1
}

apply_game_profile_from_json() {
    local jq_expression=$1
    local match_value=$2
    local resolved_profile
    local assignments

    resolved_profile=$(jq -r --arg match "$match_value" "$jq_expression" "$GAME_PROFILE_FILE")
    if [[ -z "$resolved_profile" || "$resolved_profile" == "null" ]]; then
        return 1
    fi

    assignments=$(jq -r --arg key "$resolved_profile" '
        .profiles[$key].config
        | to_entries[]
        | select(.value != null)
        | "\(.key)=\(.value | @sh)"
    ' "$GAME_PROFILE_FILE")

    if [[ -n "$assignments" ]]; then
        eval "$assignments"
    fi

    CURRENT_GAME_PROFILE=$resolved_profile
    CURRENT_GAME_NAME=$(jq -r --arg key "$resolved_profile" '.profiles[$key].display_name // $key' "$GAME_PROFILE_FILE")
    return 0
}

reset_to_base_configuration() {
    MIN_TDP=$BASE_MIN_TDP
    DEFAULT_TDP=$BASE_DEFAULT_TDP
    MAX_CPU_TDP=$BASE_MAX_CPU_TDP
    STEP_TDP=$BASE_STEP_TDP
    RYZENADJ_EXEC=$BASE_RYZENADJ_EXEC
    RYZENADJ_DELAY=$BASE_RYZENADJ_DELAY
    MONITOR_INTERVAL=$BASE_MONITOR_INTERVAL
    STABLE_SAMPLE_COUNT=$BASE_STABLE_SAMPLE_COUNT
    BATTERY_MAX_TDP=$BASE_BATTERY_MAX_TDP
    PERFORMANCE_MODE=$BASE_PERFORMANCE_MODE
    CURRENT_GAME_PROFILE=""
    CURRENT_GAME_SOURCE=""
    CURRENT_GAME_MATCH=""
    CURRENT_GAME_NAME=""
}

resolve_active_game_profile() {
    local detected_appid=""
    local detected_executable=""
    local detected_launcher=""
    local previous_signature="${CURRENT_GAME_SOURCE}:${CURRENT_GAME_MATCH}:${CURRENT_GAME_PROFILE}"
    local new_signature

    reset_to_base_configuration

    if [[ -f "$GAME_PROFILE_FILE" ]] && jq empty "$GAME_PROFILE_FILE" > /dev/null 2>&1; then
        detected_appid=$(detect_steam_appid_from_environment || true)
        if [[ -z "$detected_appid" && ${#GAME_COMMAND[@]} -eq 0 ]]; then
            detected_appid=$(detect_steam_appid_from_processes || true)
        fi

        if [[ -n "$detected_appid" ]]; then
            if apply_game_profile_from_json '.steam_appids[$match].profile // empty' "$detected_appid"; then
                CURRENT_GAME_SOURCE="steam_appid"
                CURRENT_GAME_MATCH=$detected_appid
            fi
        fi

        if [[ -z "$CURRENT_GAME_PROFILE" ]]; then
            if (( ${#GAME_COMMAND[@]} > 0 )); then
                detected_executable=$(detect_executable_from_wrapped_command || true)
            else
                detected_executable=$(detect_executable_from_processes || true)
            fi

            if [[ -n "$detected_executable" ]]; then
                if apply_game_profile_from_json '.executables[$match].profile // empty' "$detected_executable"; then
                    CURRENT_GAME_SOURCE="executable"
                    CURRENT_GAME_MATCH=$detected_executable
                fi
            fi
        fi

        if [[ -z "$CURRENT_GAME_PROFILE" ]]; then
            detected_launcher=$(detect_launcher_type || true)
            if [[ -n "$detected_launcher" ]]; then
                if apply_game_profile_from_json '.launcher_types[$match].profile // empty' "$detected_launcher"; then
                    CURRENT_GAME_SOURCE="launcher_type"
                    CURRENT_GAME_MATCH=$detected_launcher
                fi
            fi
        fi
    fi

    apply_cli_overrides "post-profile"

    if [[ -n "$CLI_MODE_OVERRIDE" ]]; then
        PERFORMANCE_MODE=$CLI_MODE_OVERRIDE
    fi

    apply_performance_mode "$PERFORMANCE_MODE"

    new_signature="${CURRENT_GAME_SOURCE}:${CURRENT_GAME_MATCH}:${CURRENT_GAME_PROFILE}"
    if [[ "$new_signature" != "$previous_signature" ]]; then
        if [[ -n "$CURRENT_GAME_PROFILE" ]]; then
            log "Applied game profile: $CURRENT_GAME_NAME via $CURRENT_GAME_SOURCE ($CURRENT_GAME_MATCH)"
        elif [[ -n "$previous_signature" && "$previous_signature" != "::" ]]; then
            log "No active game profile detected, falling back to base configuration"
        fi
    fi
}

run_wrapped_command() {
    log "Launching wrapped command: ${GAME_COMMAND[*]}"
    monitor_and_adjust &
    MONITOR_PID=$!

    "${GAME_COMMAND[@]}"
    EXIT_STATUS=$?
}

resolve_device_profile_name() {
    local profile_file=$1
    local requested_name=$2

    jq -r --arg requested_name "$requested_name" '
        if .profiles[$requested_name] then
            $requested_name
        else
            (.profiles | to_entries | map(select((.value.aliases // []) | index($requested_name))) | .[0].key // empty)
        end
    ' "$profile_file"
}

apply_device_profile() {
    local profile_file=$1
    local requested_profile=$2
    local resolved_profile
    local supported
    local display_name
    local assignments
    local unsupported_reason

    [[ -n "$requested_profile" ]] || return 0

    if [[ ! -f "$profile_file" ]]; then
        log "Device profile file not found: $profile_file"
        exit 1
    fi

    if ! jq empty "$profile_file" > /dev/null 2>&1; then
        log "Invalid device profile JSON: $profile_file"
        exit 1
    fi

    resolved_profile=$(resolve_device_profile_name "$profile_file" "$requested_profile")
    if [[ -z "$resolved_profile" ]]; then
        log "Unknown device profile: $requested_profile"
        exit 1
    fi

    supported=$(jq -r --arg profile "$resolved_profile" '.profiles[$profile].supported // true' "$profile_file")
    if [[ $supported != "true" ]]; then
        unsupported_reason=$(jq -r --arg profile "$resolved_profile" '.profiles[$profile].unsupported_reason // "Unsupported device profile"' "$profile_file")
        log "$unsupported_reason"
        exit 1
    fi

    assignments=$(jq -r --arg profile "$resolved_profile" '
        .profiles[$profile].config
        | to_entries[]
        | select(.value != null)
        | "\(.key)=\(.value | @sh)"
    ' "$profile_file")

    if [[ -n "$assignments" ]]; then
        eval "$assignments"
    fi

    display_name=$(jq -r --arg profile "$resolved_profile" '.profiles[$profile].display_name // $profile' "$profile_file")
    DEVICE_PROFILE="$resolved_profile"
    log "Loaded device profile: $display_name"
}

# Function to determine the appropriate TDP based on CPU utilization
determine_tdp() {
    local cpu_usage=$1
    local gpu_usage=$2
    local effective_usage
    local ceiling
    local tdp
    local ramp_start=20
    local ramp_full=95
    local curve_exponent=2
    local usage_span
    local usage_above_floor

    # Combine CPU and GPU demand: union formula accounts for both running together.
    # Both 40% -> 64%, one pegged 99% -> ~99%, both 70% -> 91%.
    effective_usage=$(( cpu_usage + gpu_usage - (cpu_usage * gpu_usage + 50) / 100 ))
    if (( effective_usage > 100 )); then
        effective_usage=100
    fi

    # Apply the mode's threshold offset
    effective_usage=$(( effective_usage - ACTIVE_THRESHOLD_OFFSET ))
    if (( effective_usage < 0 )); then
        effective_usage=0
    fi

    # Pick the ceiling based on power source
    if is_on_external_power; then
        ceiling=$ACTIVE_MAX_TDP
        ramp_start=20
    else
        ceiling=$ACTIVE_BATTERY_MAX_TDP
        ramp_start=30
    fi

    if (( effective_usage <= ramp_start )); then
        tdp=$MIN_TDP
    else
        usage_span=$(( ramp_full - ramp_start ))
        usage_above_floor=$(( effective_usage - ramp_start ))
        if (( usage_above_floor > usage_span )); then
            usage_above_floor=$usage_span
        fi
        tdp=$(( MIN_TDP + (ceiling - MIN_TDP) * usage_above_floor ** curve_exponent / usage_span ** curve_exponent ))
    fi

    # Enforce floor and ceiling
    if (( tdp < MIN_TDP )); then
        tdp=$MIN_TDP
    fi
    if (( tdp > ceiling )); then
        tdp=$ceiling
    fi

    echo $(( (tdp / STEP_TDP) * STEP_TDP ))
}


# Function to monitor and adjust TDP based on CPU utilization
monitor_and_adjust() {
    local last_adjustment=0
    local current_tdp=$ACTIVE_DEFAULT_TDP
    local prev_snapshot
    local cpu_usage
    local core_breadth
    local cpu_peak
    local cpu_signal
    local sub_cpu
    local sub_breadth
    local sub_peak
    local sub_gpu
    local gpu_usage
    local cycle=0
    local new_tdp
    local limited_tdp
    local candidate_tdp=$ACTIVE_DEFAULT_TDP
    local stable_samples=0
    local last_update_check=0
    local decay_pct=100
    local decay_remember=100
    local calm_cycles=0
    local apu_draw=0
    local burst_cap

    read -r _ _ _ prev_snapshot < <(get_max_cpu_usage "")

    set_tdp "$ACTIVE_DEFAULT_TDP"
    current_tdp=$ACTIVE_DEFAULT_TDP
    last_adjustment=$(date +%s)

    log "Monitoring and adjusting TDP started"

    while true; do
        cycle=$((cycle + 1))
        if (( cycle % 5 == 1 )); then
            resolve_active_game_profile
        fi

        #check for update
        if (( $(date +%s) - last_update_check >= UPDATE_CHECK_INTERVAL )); then
            last_update_check=$(date +%s)
            if download_file "$UPDATE_URL" /tmp/autotdp_check.sh 2>/dev/null \
                && ! cmp -s /tmp/autotdp_check.sh "$SCRIPT_DEST"; then
                log "Update available upstream - run: $0 --update"
            fi
            rm -f /tmp/autotdp_check.sh
        fi

        # Sub-sample within the interval to catch short CPU bursts
        cpu_peak=0
        core_breadth=0
        gpu_usage=0
        for (( sub=0; sub < ACTIVE_MONITOR_INTERVAL * 2; sub++ )); do
            sleep 0.5
            read -r sub_cpu sub_breadth sub_peak prev_snapshot < <(get_max_cpu_usage "$prev_snapshot")
            (( sub_cpu > cpu_peak )) && cpu_peak=$sub_cpu
            (( sub_breadth > core_breadth )) && core_breadth=$sub_breadth
            sub_gpu=$(get_max_gpu_usage)
            (( sub_gpu > gpu_usage )) && gpu_usage=$sub_gpu
        done

        cpu_usage=$cpu_peak

        log "Current CPU usage: ${cpu_usage}% | GPU usage: ${gpu_usage}%"

        cpu_signal=$cpu_peak

        if (( $(date +%s) - last_adjustment > 300 )); then
            set_tdp "$current_tdp"
            last_adjustment=$(date +%s)
        fi

        new_tdp=$(determine_tdp "$cpu_signal" "$gpu_usage")
        limited_tdp=$new_tdp

        # Burst cap: narrow loads (bursts / single-thread) top out at 75% of the
        # ceiling; full TDP is reserved for broad multi-core demand.
        if (( core_breadth < 3 )); then
            if is_on_external_power; then
                burst_cap=$ACTIVE_MAX_TDP
            else
                burst_cap=$ACTIVE_BATTERY_MAX_TDP
            fi
            burst_cap=$(( (burst_cap * 75 / 100 / STEP_TDP) * STEP_TDP ))
            if (( burst_cap < MIN_TDP )); then
                burst_cap=$MIN_TDP
            fi
            if (( limited_tdp > burst_cap )); then
                limited_tdp=$burst_cap
            fi
        fi

        # --- Comfort decay: probe the ceiling down while the game is comfortable ---
        apu_draw=$(get_apu_power_w || echo 0)

        if (( cpu_signal >= 85 || gpu_usage >= 85 )); then
            # Hard demand (loading, heavy scene): full curve, instantly.
            # Remember where we were, plus a margin so we don't dive
            # straight back to a level that may have caused the spike.
            decay_remember=$((decay_pct + 10))
            (( decay_remember > 100 )) && decay_remember=100
            decay_pct=100
            calm_cycles=0
        elif (( cpu_signal < 60 && gpu_usage < 55 )); then
            # Comfortable: the ceiling is being wasted, probe downward
            calm_cycles=$((calm_cycles + 1))
            if (( decay_pct > decay_remember )); then
                # Re-descending to the last known good level: fast
                if (( calm_cycles >= 2 )); then
                    decay_pct=$((decay_pct - 5))
                    calm_cycles=0
                fi
            elif (( calm_cycles >= 10 && decay_pct > 60 )); then
                # Probing below the last known level: careful
                decay_pct=$((decay_pct - 5))
                calm_cycles=0
                log "Comfort decay: usage ${cpu_signal}/${gpu_usage}, draw ${apu_draw}W, decay now ${decay_pct}%"
            fi
        fi

        limited_tdp=$(( limited_tdp * decay_pct / 100 ))
        if (( limited_tdp < MIN_TDP )); then
            limited_tdp=$MIN_TDP
        fi

        if [[ $limited_tdp == "$current_tdp" ]]; then
            candidate_tdp=$limited_tdp
            stable_samples=0
            continue
        fi

        if [[ $limited_tdp == "$candidate_tdp" ]]; then
            stable_samples=$((stable_samples + 1))
        else
            candidate_tdp=$limited_tdp
            if (( candidate_tdp > current_tdp )); then
                stable_samples=$ACTIVE_STABLE_SAMPLE_COUNT
            else
                stable_samples=1
            fi
        fi

        if (( stable_samples < ACTIVE_STABLE_SAMPLE_COUNT )); then
            log "Candidate TDP $candidate_tdp waiting for stability ($stable_samples/$ACTIVE_STABLE_SAMPLE_COUNT)"
            continue
        fi

        # Down-ramp rate limit: descend at most 2W per adjustment
        if (( candidate_tdp < current_tdp )); then
            local down_step=2
            is_on_external_power || down_step=1
            if (( current_tdp - candidate_tdp > down_step * STEP_TDP )); then
                candidate_tdp=$(( current_tdp - down_step * STEP_TDP ))
            fi
        fi

        # Narrow loads may only climb 2W per adjustment; broad loads can jump freely
        if (( candidate_tdp > current_tdp && core_breadth < 3 )); then
            if (( candidate_tdp - current_tdp > 2 * STEP_TDP )); then
                candidate_tdp=$(( current_tdp + 2 * STEP_TDP ))
            fi
        fi

        if (( $(($(date +%s) - last_adjustment)) >= ACTIVE_RYZENADJ_DELAY )); then
            log "Adjusting TDP from $current_tdp to $candidate_tdp"
            set_tdp "$candidate_tdp"
            current_tdp=$candidate_tdp
            last_adjustment=$(date +%s)
        fi
    done
}

# Function to handle script exit
cleanup() {
    if (( SKIP_CLEANUP == 1 )); then
        exit "$EXIT_STATUS"
    fi

    if (( MONITOR_PID > 0 )); then
        kill "$MONITOR_PID" > /dev/null 2>&1 || true
        wait "$MONITOR_PID" 2> /dev/null || true
    fi

    set_tdp "$ACTIVE_DEFAULT_TDP"
    log "Script exited, TDP reset to default for mode $PERFORMANCE_MODE"
    exit "$EXIT_STATUS"
}

# Function to install the script as a systemd service
install_service() {
    # Copy the script to the destination directory
    run_privileged install -m 0755 "$(realpath "$0")" "$SCRIPT_DEST"
    install_known_device_profiles
    install_game_profiles

    run_privileged tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=AutoTDP Service
After=network.target

[Service]
ExecStart=$SCRIPT_DEST
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target suspend.target hibernate.target
EOF

    run_privileged systemctl daemon-reload
    run_privileged systemctl enable autotdp.service
    run_privileged systemctl restart autotdp.service

    log "AutoTDP service installed and started"
}

download_file() {
    local url=$1
    local dest=$2

    if command -v curl > /dev/null 2>&1; then
        curl -fsSL --connect-timeout 10 --max-time 60 "$url" -o "$dest"
    elif command -v wget > /dev/null 2>&1; then
        wget -q --timeout=60 -O "$dest" "$url"
    else
        return 1
    fi
}

perform_self_update() {
    local tmp_file

    tmp_file=$(mktemp)

    if ! download_file "$UPDATE_URL" "$tmp_file"; then
        rm -f "$tmp_file"
        log "Self-update: download failed, keeping current version"
        return 1
    fi

    # Validate: non-empty, looks like AutoTDP, parses as valid bash
    if [[ ! -s "$tmp_file" ]] || ! grep -q "AutoTDP" "$tmp_file" || ! bash -n "$tmp_file"; then
        rm -f "$tmp_file"
        log "Self-update: downloaded file failed validation, keeping current version"
        return 1
    fi

    if [[ -f "$SCRIPT_DEST" ]] && cmp -s "$tmp_file" "$SCRIPT_DEST"; then
        rm -f "$tmp_file"
        return 0
    fi

    run_privileged install -m 0755 "$tmp_file" "$SCRIPT_DEST"
    rm -f "$tmp_file"
    log "Self-update: new version installed to $SCRIPT_DEST"

    if command -v systemctl > /dev/null 2>&1 && [[ -f "$SERVICE_FILE" ]] \
        && systemctl is-active --quiet autotdp.service; then
        log "Self-update: restarting autotdp.service"
        run_privileged systemctl restart autotdp.service
        exit 0
    fi

    return 0
}

create_default_config() {
    run_privileged tee "$CONFIG_FILE" > /dev/null <<EOF
MIN_TDP=$MIN_TDP
DEFAULT_TDP=$DEFAULT_TDP
MAX_CPU_TDP=$MAX_CPU_TDP
STEP_TDP=$STEP_TDP
RYZENADJ_EXEC=$RYZENADJ_EXEC
RYZENADJ_DELAY=$RYZENADJ_DELAY
MONITOR_INTERVAL=$MONITOR_INTERVAL
STABLE_SAMPLE_COUNT=$STABLE_SAMPLE_COUNT
BATTERY_MAX_TDP=$BATTERY_MAX_TDP
DEVICE_PROFILE=$DEVICE_PROFILE
DEVICE_PROFILE_FILE=$DEVICE_PROFILE_FILE
PERFORMANCE_MODE=$PERFORMANCE_MODE
GAME_PROFILE_FILE=$GAME_PROFILE_FILE
EOF

    run_privileged chmod 644 "$CONFIG_FILE"
}

# Main script

parse_arguments "$@"

if [[ $ACTION == "help" ]]; then
    print_usage
    exit 0
fi

if [[ $ACTION == "list-modes" ]]; then
    print_modes
    exit 0
fi

if [[ $ACTION == "list-profiles" && -f "$KNOWN_DEVICES_SOURCE_FILE" ]]; then
    print_device_profiles "$KNOWN_DEVICES_SOURCE_FILE"
    exit 0
fi

elevate_privileges "$@"

# Create configuration and log directories if they don't exist
run_privileged install -d -m 755 "$CONFIG_DIR"
run_privileged install -d -m 755 "$LOG_DIR"
install_known_device_profiles
install_game_profiles

run_privileged touch "$LOG_FILE"
run_privileged chmod 644 "$LOG_FILE"

# Create config file if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Creating configuration file at $CONFIG_FILE"
    create_default_config
fi

# Load configuration
source "$CONFIG_FILE"

: "${MIN_TDP:=5000}"
: "${DEFAULT_TDP:=10000}"
: "${MAX_CPU_TDP:=18000}"
: "${STEP_TDP:=1000}"
: "${RYZENADJ_EXEC:=ryzenadj}"
: "${RYZENADJ_DELAY:=4}"
: "${MONITOR_INTERVAL:=5}"
: "${STABLE_SAMPLE_COUNT:=2}"
: "${BATTERY_MAX_TDP:=$MAX_CPU_TDP}"
: "${DEVICE_PROFILE:=generic}"
: "${DEVICE_PROFILE_FILE:=$KNOWN_DEVICES_FILE}"
: "${PERFORMANCE_MODE:=balanced}"
: "${GAME_PROFILE_FILE:=$GAME_PROFILES_FILE}"

# Check for required packages before attempting to parse profile JSON
check_packages

if [[ -n "$CLI_PROFILE_OVERRIDE" ]]; then
    DEVICE_PROFILE=$CLI_PROFILE_OVERRIDE
fi

apply_cli_overrides "pre-profile"

apply_device_profile "$DEVICE_PROFILE_FILE" "$DEVICE_PROFILE"

apply_cli_overrides "post-profile"

if [[ -n "$CLI_MODE_OVERRIDE" ]]; then
    PERFORMANCE_MODE=$CLI_MODE_OVERRIDE
fi

if ! [[ "$STEP_TDP" =~ ^[0-9]+$ ]] || ! [[ "$RYZENADJ_DELAY" =~ ^[0-9]+$ ]] || ! [[ "$MONITOR_INTERVAL" =~ ^[0-9]+$ ]] || ! [[ "$STABLE_SAMPLE_COUNT" =~ ^[0-9]+$ ]]; then
    log "Invalid numeric configuration detected"
    exit 1
fi

if ! [[ "$MIN_TDP" =~ ^[0-9]+$ ]] || ! [[ "$DEFAULT_TDP" =~ ^[0-9]+$ ]] || ! [[ "$MAX_CPU_TDP" =~ ^[0-9]+$ ]] || ! [[ "$BATTERY_MAX_TDP" =~ ^[0-9]+$ ]]; then
    log "TDP configuration values must be positive integers"
    exit 1
fi

if (( MIN_TDP > DEFAULT_TDP || DEFAULT_TDP > MAX_CPU_TDP || BATTERY_MAX_TDP < MIN_TDP || BATTERY_MAX_TDP > MAX_CPU_TDP || STEP_TDP <= 0 || RYZENADJ_DELAY <= 0 || MONITOR_INTERVAL <= 0 || STABLE_SAMPLE_COUNT <= 0 )); then
    log "Configuration values are inconsistent"
    exit 1
fi

if ! validate_performance_mode "$PERFORMANCE_MODE"; then
    log "Invalid performance mode: $PERFORMANCE_MODE"
    exit 1
fi

BASE_MIN_TDP=$MIN_TDP
BASE_DEFAULT_TDP=$DEFAULT_TDP
BASE_MAX_CPU_TDP=$MAX_CPU_TDP
BASE_STEP_TDP=$STEP_TDP
BASE_RYZENADJ_EXEC=$RYZENADJ_EXEC
BASE_RYZENADJ_DELAY=$RYZENADJ_DELAY
BASE_MONITOR_INTERVAL=$MONITOR_INTERVAL
BASE_STABLE_SAMPLE_COUNT=$STABLE_SAMPLE_COUNT
BASE_BATTERY_MAX_TDP=$BATTERY_MAX_TDP
BASE_PERFORMANCE_MODE=$PERFORMANCE_MODE

resolve_active_game_profile

# Trap exit signals
trap cleanup EXIT

if [[ $ACTION == "help" ]]; then
    SKIP_CLEANUP=1
    print_usage
    exit 0
fi

if [[ $ACTION == "list-modes" ]]; then
    SKIP_CLEANUP=1
    print_modes
    exit 0
fi

if [[ $ACTION == "list-profiles" ]]; then
    SKIP_CLEANUP=1
    print_device_profiles "$DEVICE_PROFILE_FILE"
    exit 0
fi

if [[ $ACTION == "configure" ]]; then
    SKIP_CLEANUP=1

    if (( PERSIST_PROFILE == 1 )); then
        set_config_value "DEVICE_PROFILE" "$DEVICE_PROFILE"
    fi

    if (( PERSIST_MODE == 1 )); then
        set_config_value "PERFORMANCE_MODE" "$PERFORMANCE_MODE"
    fi

    restart_service_if_running
    log "Configuration updated: profile=$DEVICE_PROFILE mode=$PERFORMANCE_MODE"
    exit 0
fi

# Install service if requested
if [[ $ACTION == "install" ]]; then
    SKIP_CLEANUP=1
    install_service
    exit 0
fi

if [[ $ACTION == "update" ]]; then
    SKIP_CLEANUP=1
    perform_self_update
    exit $?
fi

# Start monitoring and adjusting TDP
log "Running with profile=$DEVICE_PROFILE mode=$PERFORMANCE_MODE max_tdp=$ACTIVE_MAX_TDP battery_max_tdp=$ACTIVE_BATTERY_MAX_TDP"

if (( ${#GAME_COMMAND[@]} > 0 )); then
    run_wrapped_command
    exit "$EXIT_STATUS"
fi

monitor_and_adjust
