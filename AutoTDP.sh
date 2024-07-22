#!/bin/bash

# Configuration
CONFIG_DIR="$HOME/.config/AutoTDP"
CONFIG_FILE="$CONFIG_DIR/AutoTDP.config"
LOG_DIR="$CONFIG_DIR/logs"
LOG_FILE="$LOG_DIR/tdp_manager.log"
REQUIRED_PACKAGES=("bc" "gawk" "sudo" "ryzenadj")

# Global variables
MIN_TDP=5000
DEFAULT_TDP=10000
MAX_CPU_TDP=18000
STEP_TDP=1000  # Step increment for TDP adjustments

RYZENADJ_EXEC=ryzenadj
RYZENADJ_DELAY=4  # Delay in seconds between adjustments

SERVICE_FILE="/etc/systemd/system/autotdp.service"

# Function to log messages to console and log file
log() {
    local message=$1
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo "$timestamp - $message"
    echo "$timestamp - $message" >> $LOG_FILE
}

# Function to check if required packages are installed
check_packages() {
    local missing_packages=()
    for package in "${REQUIRED_PACKAGES[@]}"; do
        if ! command -v $package &> /dev/null; then
            missing_packages+=($package)
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
    if sudo $RYZENADJ_EXEC --stapm-limit $value --fast-limit $value --slow-limit $value; then
        log "TDP set to $value"
    else
        log "Failed to set TDP to $value"
    fi
}

# Function to determine the appropriate TDP based on CPU load
determine_tdp() {
    local cpu_load=$(echo "$1 * 100" | bc -l)
    local tdp=$MIN_TDP

    tdp_values=($MIN_TDP $((MAX_CPU_TDP * 1 / 8)) $((MAX_CPU_TDP * 1 / 4)) $((MAX_CPU_TDP * 3 / 8)) \
                $((MAX_CPU_TDP * 1 / 2)) $((MAX_CPU_TDP * 5 / 8)) $((MAX_CPU_TDP * 3 / 4)) \
                $((MAX_CPU_TDP * 7 / 8)) $MAX_CPU_TDP)

    cpu_load_thresholds=(0 10 20 30 40 50 60 70 80)

    for i in ${!cpu_load_thresholds[@]}; do
        if (( $(echo "$cpu_load > ${cpu_load_thresholds[$i]}" | bc -l) )); then
            tdp=${tdp_values[$i]}
        fi
    done

    echo $(( (tdp / STEP_TDP) * STEP_TDP ))
}

# Function to monitor and adjust TDP based on CPU load
monitor_and_adjust() {
    local last_adjustment=0
    local current_tdp=$DEFAULT_TDP

    log "Monitoring and adjusting TDP started"

    while true; do
        # Get CPU load (1-minute average)
        cpu_load=$(awk '{print $1}' /proc/loadavg)

        log "Current CPU load: $cpu_load"

        # Determine the new TDP
        new_tdp=$(determine_tdp $cpu_load)

        # Adjust TDP if necessary
        if [[ $new_tdp != $current_tdp && $(($(date +%s) - last_adjustment)) -ge $RYZENADJ_DELAY ]]; then
            log "Adjusting TDP from $current_tdp to $new_tdp"
            set_tdp $new_tdp
            current_tdp=$new_tdp
            last_adjustment=$(date +%s)
        fi

        sleep 5  # Adjust as needed based on monitoring frequency
    done
}

# Function to handle script exit
cleanup() {
    set_tdp $DEFAULT_TDP
    log "Script exited, TDP reset to default"
    exit 0
}

# Function to install the script as a systemd service
install_service() {
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=AutoTDP Service
After=network.target

[Service]
ExecStart=$(realpath $0)
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable autotdp.service
    sudo systemctl start autotdp.service

    log "AutoTDP service installed and started"
}

# Main script

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root."
    exit 1
fi

# Create configuration and log directories if they don't exist
mkdir -p $CONFIG_DIR
mkdir -p $LOG_DIR

# Create config file if it doesn't exist
if [ ! -f $CONFIG_FILE ]; then
    echo "Creating configuration file at $CONFIG_FILE"
    echo "MIN_TDP=$MIN_TDP" > $CONFIG_FILE
    echo "DEFAULT_TDP=$DEFAULT_TDP" >> $CONFIG_FILE
    echo "MAX_CPU_TDP=$MAX_CPU_TDP" >> $CONFIG_FILE
    echo "STEP_TDP=$STEP_TDP" >> $CONFIG_FILE
    echo "RYZENADJ_EXEC=$RYZENADJ_EXEC" >> $CONFIG_FILE
    echo "RYZENADJ_DELAY=$RYZENADJ_DELAY" >> $CONFIG_FILE
fi

# Load configuration
source $CONFIG_FILE

# Check for required packages
check_packages

# Trap exit signals
trap cleanup EXIT

# Install service if requested
if [[ $1 == "--install" ]]; then
    install_service
    exit 0
fi

# Start monitoring and adjusting TDP
monitor_and_adjust
