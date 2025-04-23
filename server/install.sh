#!/usr/bin/env bash
set -e
set -o pipefail
cd ~

readonly OP_UP_PROTO="Update protokolibri from GitHub"
readonly OP_UP_DEP="Update dependencies only"
readonly OP_CANCEL="Cancel"
option="$OP_UP_PROTO"

# clone code
if [ -d "protokolibri/.git" ]; then
  echo "Protokolibri is already installed. How do you wish to proceed?"
  select option in "$OP_UP_PROTO" "$OP_UP_DEP" "$OP_CANCEL"; do
    case "$option" in
      "$OP_UP_PROTO" ) break;;
      "$OP_UP_DEP" ) break;;
      "$OP_CANCEL" ) exit;;
    esac
  done
  if [ "$option" = "$OP_UP_PROTO" ]; then
    echo "Updating protokolibri code from GitHub..."
    git -C "protokolibri" fetch --depth=1 > /dev/null 2>&1
    git -C "protokolibri" reset --hard > /dev/null 2>&1
    echo "Download complete."
  fi
else
  echo "Downloading protokolibri code from GitHub..."
  git clone --depth=1 https://github.com/hexzeug/protokolibri.git protokolibri > /dev/null 2>&1
  echo "Download complete."
fi

# install node
echo "Installing nvm..."
if [ -d ".nvm" ]; then
  read -p "Node version manager (nvm) is already installed. Do you wish to update it? (y/N) " yn
  if [ "$yn" = "y" ]; then
    bash .nvm/install.sh > /dev/null 2>&1
    echo "Nvm updated."
  fi
else
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh 2> /dev/null | bash > /dev/null 2>&1
  echo "Nvm installed."
fi
source .nvm/nvm.sh
echo "Installing nodejs..."
nvm install node 2>&1 | grep -E "installing|installed"
echo "Done."

# install and update npm packages
echo "Installing and updating libraries using npm..."
npm --prefix="protokolibri/server" install --omit=dev --silent
echo "Libraries installed."

# setup systemd service
if [ "$option" = "$OP_UP_PROTO" ]; then
  echo "Setting up systemd protokolibri.service..."
  touch protokolibri.env
  mkdir -p .config/systemd/user
  cp protokolibri/server/protokolibri.service .config/systemd/user/
  loginctl enable-linger $USER
  systemctl --user daemon-reload
  echo "Done."
fi

echo
echo "Protokolibri installed!"
echo
echo "Please configure the environment variables in $HOME/protokolibri.env before starting"
echo "To enable/start/restart run:"
echo "  systemctl --user enable protokolibri"
echo "  systemctl --user start protokolibri"
echo "  systemctl --user restart protokolibri"
echo "To view protokolibri logs run:"
echo "  journalctl --user -eu protokolibri -f"