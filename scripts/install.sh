#!/bin/bash
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH
cd ..
BASEDIR=$(pwd -P)

echo "Writing run script..."

echo "$BASEDIR/miner $@" > "scripts/run.sh"
chmod +x "scripts/run.sh"

echo "Writing Systemd Unit file..."

echo "[Unit]"                           >  beepminer.service
echo "Description=beepminer"            >> beepminer.service
echo ""                                 >> beepminer.service
echo "[Service]"                        >> beepminer.service
echo "Type=simple"                      >> beepminer.service
echo "ExecStart=$SCRIPTPATH/run.sh"     >> beepminer.service
echo "WorkingDirectory=$BASEDIR"        >> beepminer.service
echo "Restart=always"                   >> beepminer.service
echo ""                                 >> beepminer.service
echo "[Install]"                        >> beepminer.service
echo "WantedBy=multi-user.target"       >> beepminer.service

sudo mv beepminer.service /etc/systemd/system/
sudo systemctl enable beepminer
sudo systemctl start beepminer
