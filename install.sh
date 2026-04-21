#!/usr/bin/bash
if [ "$EUID" -eq 0 ]; then
    echo "Please do not run as root"
    exit
fi

echo "Removing previous install if it exists"
cd $HOME
sudo rm -rf $HOME/homebrew/plugins/AutoTDP

echo "Installing AutoTDP plugin for TDP control"
curl -s https://api.github.com/repos/luisho24/AutoTDP/releases/latest | grep "browser_download_url" | cut -d '"' -f 4 | xargs -I {} curl -L {} -o $HOME/AutoTDP.zip
sudo unzip -o $HOME/AutoTDP.zip -d $HOME/homebrew/plugins
rm $HOME/AutoTDP.zip

sudo systemctl restart plugin_loader.service
echo "Installation complete"