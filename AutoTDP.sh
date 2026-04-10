#!/bin/bash

set -u

# Configuration
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
CONFIG_DIR="/etc/AutoTDP"  # Shared configuration directory
CONFIG_FILE="$CONFIG_DIR/AutoTDP.config"
KNOWN_DEVICES_FILE="$CONFIG_DIR/known_devices.json"
KNOWN_DEVICES_SOURCE_FILE="$SCRIPT_DIR/known_devices.json"
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
MONITOR_INTERVAL=5
STABLE_SAMPLE_COUNT=2
BATTERY_MAX_TDP=$MAX_CPU_TDP
DEVICE_PROFILE="generic"
DEVICE_PROFILE_FILE="$KNOWN_DEVICES_FILE"
SKIP_CLEANUP=0

SERVICE_FILE="/etc/systemd/system/autotdp.service"
SCRIPT_DEST="/usr/local/bin/autotdp.sh"  # Destination for the script copy

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
    if run_privileged "$RYZENADJ_EXEC" --stapm-limit "$value" --fast-limit "$value" --slow-limit "$value"; then
        log "TDP set to $value"
    else
        log "Failed to set TDP to $value"
    fi
}

# Function to read cumulative CPU time counters from /proc/stat
read_cpu_times() {
    local cpu user nice system idle iowait irq softirq steal guest guest_nice
    read -r cpu user nice system idle iowait irq softirq steal guest guest_nice < /proc/stat

    local total=$((user + nice + system + idle + iowait + irq + softirq + steal))
    local idle_total=$((idle + iowait))

    echo "$total $idle_total"
}

# Function to calculate CPU utilization percentage from two /proc/stat samples
get_cpu_usage() {
    local previous_total=$1
    local previous_idle=$2
    local current_total
    local current_idle
    local total_delta
    local idle_delta
    local busy_delta

    read -r current_total current_idle < <(read_cpu_times)

    total_delta=$((current_total - previous_total))
    idle_delta=$((current_idle - previous_idle))

    if (( total_delta <= 0 )); then
        echo "0 $current_total $current_idle"
        return
    fi

    busy_delta=$((total_delta - idle_delta))
    if (( busy_delta < 0 )); then
        busy_delta=0
    fi

    echo "$(( (busy_delta * 100) / total_delta )) $current_total $current_idle"
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

apply_power_source_limit() {
    local requested_tdp=$1

    if is_on_external_power; then
        echo "$requested_tdp"
    else
        if (( requested_tdp > BATTERY_MAX_TDP )); then
            echo "$BATTERY_MAX_TDP"
        else
            echo "$requested_tdp"
        fi
    fi
}

install_known_device_profiles() {
    if [[ -f "$KNOWN_DEVICES_SOURCE_FILE" && ! -f "$KNOWN_DEVICES_FILE" ]]; then
        run_privileged install -m 0644 "$KNOWN_DEVICES_SOURCE_FILE" "$KNOWN_DEVICES_FILE"
    fi
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
    local tdp=$MIN_TDP
    local i

    local tdp_values=($MIN_TDP $((MAX_CPU_TDP * 1 / 8)) $((MAX_CPU_TDP * 1 / 4)) $((MAX_CPU_TDP * 3 / 8)) \
                $((MAX_CPU_TDP * 1 / 2)) $((MAX_CPU_TDP * 5 / 8)) $((MAX_CPU_TDP * 3 / 4)) \
                $((MAX_CPU_TDP * 7 / 8)) $MAX_CPU_TDP)

    local cpu_load_thresholds=(0 10 20 30 40 50 60 70 80)

    for i in "${!cpu_load_thresholds[@]}"; do
        if (( cpu_usage > cpu_load_thresholds[i] )); then
            tdp=${tdp_values[$i]}
        fi
    done

    echo $(( (tdp / STEP_TDP) * STEP_TDP ))
}

# Function to monitor and adjust TDP based on CPU utilization
monitor_and_adjust() {
    local last_adjustment=0
    local current_tdp=$DEFAULT_TDP
    local previous_total
    local previous_idle
    local cpu_usage
    local new_tdp
    local limited_tdp
    local candidate_tdp=$DEFAULT_TDP
    local stable_samples=0

    read -r previous_total previous_idle < <(read_cpu_times)

    log "Monitoring and adjusting TDP started"

    while true; do
        sleep "$MONITOR_INTERVAL"

        # Get CPU utilization over the sampling window
        read -r cpu_usage previous_total previous_idle < <(get_cpu_usage "$previous_total" "$previous_idle")

        log "Current CPU usage: ${cpu_usage}%"

        # Determine the new TDP and apply handheld-friendly battery cap if needed
        new_tdp=$(determine_tdp "$cpu_usage")
        limited_tdp=$(apply_power_source_limit "$new_tdp")

        if [[ $limited_tdp == "$current_tdp" ]]; then
            candidate_tdp=$limited_tdp
            stable_samples=0
            continue
        fi

        if [[ $limited_tdp == "$candidate_tdp" ]]; then
            stable_samples=$((stable_samples + 1))
        else
            candidate_tdp=$limited_tdp
            stable_samples=1
        fi

        if (( stable_samples < STABLE_SAMPLE_COUNT )); then
            log "Candidate TDP $candidate_tdp waiting for stability ($stable_samples/$STABLE_SAMPLE_COUNT)"
            continue
        fi

        if (( $(($(date +%s) - last_adjustment)) >= RYZENADJ_DELAY )); then
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
        exit 0
    fi

    set_tdp "$DEFAULT_TDP"
    log "Script exited, TDP reset to default"
    exit 0
}

# Function to install the script as a systemd service
install_service() {
    # Copy the script to the destination directory
    run_privileged install -m 0755 "$(realpath "$0")" "$SCRIPT_DEST"
    install_known_device_profiles

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
    run_privileged systemctl start autotdp.service

    log "AutoTDP service installed and started"
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
EOF

    run_privileged chmod 644 "$CONFIG_FILE"
}

# Main script

elevate_privileges "$@"

# Create configuration and log directories if they don't exist
run_privileged install -d -m 755 "$CONFIG_DIR"
run_privileged install -d -m 755 "$LOG_DIR"
install_known_device_profiles

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

# Check for required packages before attempting to parse profile JSON
check_packages

apply_device_profile "$DEVICE_PROFILE_FILE" "$DEVICE_PROFILE"

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

# Trap exit signals
trap cleanup EXIT

# Install service if requested
if [[ ${1:-} == "--install" ]]; then
    SKIP_CLEANUP=1
    install_service
    exit 0
fi

# Start monitoring and adjusting TDP
monitor_and_adjust
