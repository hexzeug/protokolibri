#!/usr/bin/env bash
set -e
set -o pipefail
cd ~

# clone code
if [ -d "protokolibri/.git" ]; then
  echo "Updating protokolibri code from GitHub..."
  git -C "protokolibri" fetch --depth=1 > /dev/null 2>&1
  git -C "protokolibri" reset --hard > /dev/null 2>&1
else
  echo "Downloading protokolibri code from GitHub..."
  git clone --depth=1 https://github.com/hexzeug/protokolibri.git protokolibri > /dev/null 2>&1
fi
echo "Download complete."

# install node
echo "Installing nvm and nodejs..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh 2> /dev/null | bash > /dev/null 2>&1
source .nvm/nvm.sh
nvm install node 2>&1 | grep -E "installing|installed"
echo "Done."

# install and update npm packages
echo "Installing and updating libraries using npm..."
npm --prefix="protokolibri/server" install --omit=dev --silent
echo "Libraries installed."

# setup systemd service
echo "Setting up systemd protokolibri.service..."
touch protokolibri.env
mkdir -p .config/systemd/user
cp protokolibri/server/protokolibri.service .config/systemd/user/
loginctl enable-linger $USER
systemctl --user daemon-reload
echo "Done."

echo
echo "Protokolibri installed!"
echo
echo "Please configure the environment variables in $HOME/protokolibri.env"
echo "To enable run: systemctl --user enable protokolibri"
echo "To start run: systemctl --user start protokolibri"