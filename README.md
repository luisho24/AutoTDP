# AutoTDP

AutoTDP is a bash script for dynamically adjusting the Thermal Design Power (TDP) of AMD Ryzen processors based on CPU load. This script leverages the `ryzenadj` utility to set TDP values, aiming to optimize power consumption and performance.

## Features

- Dynamically adjusts TDP based on CPU load
- Logs CPU load and TDP adjustments
- Customizable configuration file
- Ensures required packages are installed
- Provides cleanup on exit to reset TDP to default
- Optional Install argument to install this script as a systemd service

## Prerequisites

Ensure the following packages are installed on your system:

- `bc`
- `gawk`
- `sudo`
- `ryzenadj`



## Default Config file:

```code
MIN_TDP=5000
DEFAULT_TDP=10000
MAX_CPU_TDP=18000
STEP_TDP=1000
RYZENADJ_EXEC=ryzenadj
RYZENADJ_DELAY=4
```
A config file with the default values will be located at `~./config/AutoTDP/AutoTDP.config`

## Systemd Service Installation:

To run the script as a systemd service simply execute it with the `--install` argument

```code
sudo ./AutoTDP.sh --install
```

You can check if the service is running by executing

```code
sudo systemctl status autotdp.service
```

## Logs

Log files are stored in ~/.config/AutoTDP/logs/. The main log file is tdp_manager.log.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

