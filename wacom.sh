#/bin/bash

# SHFLAGS related
#-----------------
[ ! -f /tmp/shflags ] && wget -P /tmp -q http://shflags.googlecode.com/svn/trunk/source/1.0/src/shflags
#-- source shflags from current directory
. /tmp/shflags
DEFINE_boolean 'interactive' false 'enable interactive selection of the window' 'i'
DEFINE_string 'name' Xournal 'name of the window (returned by xwininfo)' 'n'
FLAGS_HELP="USAGE: $(basename $0) [flags]"
#-- parse the command-line
FLAGS "$@" || exit 1
eval set -- "${FLAGS_ARGV}"
#--
YesNo() {
	while(true); do
		read userConfirm >&2
		if [ -z ${userConfirm} ]; then
			#[ ${1} -eq 0 ] && echo "Y" || echo "N"
			return ${1}
		fi
		case $userConfirm in
			yes|YES|y|Y)
			return 0;;
			no|NO|n|N)
			return 1;;
		esac
		echo "Incorrect input, try again..." >&2
	done
}
#--
colorize() {
	bold="0"
	GREEN="\033[$bold;32m"
	CYAN="\033[$bold;36m"
	GRAY="\033[$bold;37m"
	BLUE="\033[$bold;34m"
	RED="\033[$bold;31m"
	YELLOW="\033[$bold;33m"
	NORMAL="\033[m"
	color=\$${1:-NORMAL}
	# activate color passed as argument
	echo -ne "`eval echo ${color}`"
	# read stdin (pipe) and print from it:
	# cat
	shift; printf "$*"
	# Note: if instead of reading from the pipe, you wanted to print
	# the additional parameters of the function, you could do:
	# shift; echo $*
	# back to normal (no color)
	echo -ne "${NORMAL}"
}
#--
reinit() {
	id_usb=$(dmesg | awk -F"[:]|[ ]" '/Manufacturer: Wacom/{print $3}' | tail -1)
	if [ ${#id_usb} -eq 0 ]; then
		echo "$(colorize RED 'ERROR:') Couldn't identify USB Device ID. You have to unplug/plug the device and restart the script"
		exit 2
	fi
	echo "Unplugging..."
	sudo sh -c "echo $id_usb > /sys/bus/usb/drivers/usb/unbind"
	echo "Plugging..."
	sudo sh -c "echo $id_usb > /sys/bus/usb/drivers/usb/bind"
	echo "Waiting..."
	sleep 3
}
#--
getIDs() {
	id_stylus=$(xsetwacom list dev | awk -F"id[:][ \t]+|[ \t]+type.*" '/STYLUS/{print $2}')
	id_eraser=$(xsetwacom list dev | awk -F"id[:][ \t]+|[ \t]+type.*" '/ERASER/{print $2}')
	id_pad=$(xsetwacom list dev | awk -F"id[:][ \t]+|[ \t]+type.*" '/PAD/{print $2}')
	id_touch=$(xsetwacom list dev | awk -F"id[:][ \t]+|[ \t]+type.*" '/TOUCH/{print $2}')
	id_win=""
	if [ ${FLAGS_interactive} -eq ${FLAGS_TRUE} ]; then
		echo "Please select the window about which you would like information by clicking the mouse in that window."
		id_win=$(xwininfo | awk -F\" '/Window id/{print $2}')
	else
		id_win=${FLAGS_name}
		if ! xwininfo -name $id_win 1> /dev/null 2> /dev/null; then
			echo "$(colorize RED 'ERROR:') Cannot find '$id_win' window"
			exit 4
		fi
	fi
}

getIDs
[ ${FLAGS_help} -eq ${FLAGS_TRUE} ] && exit 0

# x y w h: 0 0 15200 9500
geom_stylus=( $(xsetwacom --get $id_stylus area 2> /dev/null) )
if [ ${#geom_stylus[@]} -ne 4 -o ${geom_stylus[0]} -ne 0 -o ${geom_stylus[1]} -ne 0 ]; then
	echo "$(colorize RED 'ERROR:') It appears that coordinates of the 'stylus' area were modified from the original values." 1>&2
	printf "$(colorize GREEN 'INFO:') I can try to fix it for you but you'll neet to give me 'root' privilege. Would you like to try [y/N]? "
	if YesNo 1; then
		reinit
		getIDs
		geom_stylus=( $(xsetwacom --get $id_stylus area) )
		if [ ${#geom_stylus[@]} -eq 4 -a ${geom_stylus[0]} -eq 0 -a ${geom_stylus[1]} -eq 0 ]; then
			echo OK!
		else
			echo "Didn't work, please unplug/plug the device and restart the script"
			exit 3
		fi
	else
		echo "Please unplug/plug the device and restart the script" 1>&2
		exit 1
	fi
fi
# w h x y: 1000 1318 1861 408
geom_win=( $(xwininfo -name $id_win | awk -F"[x]|[+]|[ \x09]" '/geometry/{print $4,$5,$6,$7}') )
# w h: 3840 2160
geom_screen=( $(xrandr | awk -F"[x]|[ ]*" '/[*]/{print $2,$3}') )

w_scale=$(bc <<< "scale=5;${geom_win[0]}/${geom_screen[0]}")
h_scale=$(bc <<< "scale=5;${geom_win[1]}/${geom_screen[1]}")
w_stylus=$(bc <<< "${geom_stylus[2]}/${w_scale}")
h_stylus=$(bc <<< "${geom_stylus[3]}/${h_scale}")
x_tl=$(bc <<< "-${geom_win[2]}*${w_stylus}/${geom_screen[0]}")
y_tl=$(bc <<< "-${geom_win[3]}*${h_stylus}/${geom_screen[1]}")
x_br=$(bc <<< "$x_tl+$w_stylus")
y_br=$(bc <<< "$y_tl+$h_stylus")

xsetwacom set $id_stylus area $x_tl $y_tl $x_br $y_br
xsetwacom set $id_eraser area $x_tl $y_tl $x_br $y_br
xsetwacom set $id_touch touch off
