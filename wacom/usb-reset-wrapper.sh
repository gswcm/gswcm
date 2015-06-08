#!/bin/bash

if [ $# -lt 1 ]; then
	echo "Usage: $(basename "$0") <USB device name>" 1>&2
	exit 1
fi

if [ $UID -ne 0 ]; then
	echo "Must be run by 'root'" 1>&2
	exit 2
fi

id_usb=( $(lsusb | awk -v name="$1" -F"[ ]+|[:]" '$0 ~ name {print $2,$4}') )
echo "Device /dev/bus/usb/${id_usb[0]}/${id_usb[1]} is about to be reset..." 1>&2
#echo 0 > /sys/bus/usb/devices/1-1/authorized && sleep 5 && echo 1 > /sys/bus/usb/devices/1-1/authorized
./usb-reset /dev/bus/usb/${id_usb[0]}/${id_usb[1]}
[ $? -eq 0 ] && echo "OK" || echo "NOK"
