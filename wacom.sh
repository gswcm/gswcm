#/bin/bash

# SHFLAGS related
#-----------------
[ ! -f /tmp/shflags ] && wget -P /tmp -q http://shflags.googlecode.com/svn/trunk/source/1.0/src/shflags
#-- source shflags from current directory
. /tmp/shflags
DEFINE_boolean 'full' false 'recover "desktop"-sized scaling' 'f'
DEFINE_boolean 'interactive' false 'enable interactive selection of the window' 'i'
DEFINE_string 'window' Xournal 'name of the window (returned by xwininfo)' 'w'
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
getIDs() {
	id_stylus=$(xsetwacom list dev | awk -F"id[:][ \t]+|[ \t]+type.*" '/STYLUS/{print $2}')
	id_eraser=$(xsetwacom list dev | awk -F"id[:][ \t]+|[ \t]+type.*" '/ERASER/{print $2}')
	id_pad=$(xsetwacom list dev | awk -F"id[:][ \t]+|[ \t]+type.*" '/PAD/{print $2}')
	id_touch=$(xsetwacom list dev | awk -F"id[:][ \t]+|[ \t]+type.*" '/TOUCH/{print $2}')
	id_win=""
	if [ ${FLAGS_full} -eq ${FLAGS_FALSE} ]; then
		if [ ${FLAGS_interactive} -eq ${FLAGS_TRUE} ]; then
			echo "Please select the window about which you would like information by clicking the mouse in that window."
			id_win=$(xwininfo | awk -F\" '/Window id/{print $2}')
		else
			id_win=${FLAGS_window}
			if ! xwininfo -name $id_win 1> /dev/null 2> /dev/null; then
				echo "$(colorize RED 'ERROR:') Cannot find '$id_win' window"
				exit 4
			fi
		fi
	fi
}
#-- Sanitizing
[ ${FLAGS_help} -eq ${FLAGS_TRUE} ] && exit 0
[ ${FLAGS_full} -eq ${FLAGS_TRUE} ] && FLAGS_interactive=${FLAGS_FALSE}
#-- Get ID of Wacom devices
getIDs
#-- Scaling and centering Xournal window if needed
if xwininfo -name "Xournal" 1> /dev/null 2> /dev/null; then
	echo "Would you like to scale 'Xournal' window and place in the middle of the screen? (Y/n)"
	YesNo 0 && wmctrl -i -r $(xwininfo -name 'Xournal' | awk '/Window id:/{print $4}') -e 1,938,264,1965,1633
fi
#-- Rescalling the tablet
if [ ${FLAGS_full} -eq ${FLAGS_FALSE} ]; then
	scaling=$(xwininfo -name $id_win | awk '/-geometry/{print $2}')
else
	scaling="desktop"
fi
xsetwacom set $id_stylus MapToOutput $scaling
xsetwacom set $id_eraser MapToOutput $scaling
xsetwacom set $id_touch touch off
