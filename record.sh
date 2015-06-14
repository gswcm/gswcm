#!/bin/bash

#--
[ ! -f /tmp/shflags ] && wget -P /tmp -q http://shflags.googlecode.com/svn/trunk/source/1.0/src/shflags
. /tmp/shflags
DEFINE_boolean 'debug' false 'show debug info' 'd'
FLAGS_HELP="USAGE: $(basename $0) [flags]"
FLAGS "$@" || exit 1
eval set -- "${FLAGS_ARGV}"
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
selectItem() {
	declare -a array=("${!1}")
	if	[ ${#array[@]} -eq 0 ]; then
		echo -1
	else
		for((i=0;i<${#array[@]};i++)); do
			echo "$(printf "%2d." $((i+1)))" ${array[$i]} >&2
		done
		while(true); do
			read -p "--> " x >&2
			[ -z "$x" ] && continue
			echo ${x} | grep -E '^[0-9]+$' > /dev/null && [ ${x} -gt 0 ] && [ ${x} -le ${#array[@]} ] && echo $((x-1)) && break
			echo "$(colorize RED 'ERROR:') Incorrect input, try again..." >&2
		done
	fi
}
#-- Sanitizing
[ ${FLAGS_help} -eq ${FLAGS_TRUE} ] && exit 0
#-- Retrieve geometry of the desktop
desktop_geom=( $(wmctrl -d | awk -F"[ ]+|[x]|[,]" '/[ ][*][ ]/{print $1,$10,$11,$12,$13}') )
desktop_id=${desktop_geom[0]}
desktop_x=${desktop_geom[1]}
desktop_y=${desktop_geom[2]}
desktop_w=${desktop_geom[3]}
desktop_h=${desktop_geom[4]}
[ ${FLAGS_debug} -eq ${FLAGS_TRUE} ] && echo "$(colorize GREEN DEBUG:) \${desktop_geom[@]} = ${desktop_geom[@]}"
#-- Select Master window to copy size and maximization state from
win_IDs=( $(wmctrl -l | awk -v id=$desktop_id '$2 == id  {print $1}') )
[ ${FLAGS_debug} -eq ${FLAGS_TRUE} ] && echo "$(colorize GREEN DEBUG:) \${win_IDs[@]} = ${win_IDs[@]}"
declare -a win_titles
echo "$(colorize CYAN Please select the \'Master\' window to copy size from:)"
for i in $(seq 0 $((${#win_IDs[@]}-1))); do
	win_titles[$i]=$(xwininfo -id ${win_IDs[$i]} | awk -F"\"" '/Window id:/{print $2}')
done
mID=${win_IDs[$(selectItem win_titles[@])]}
[ ${FLAGS_debug} -eq ${FLAGS_TRUE} ] && echo "$(colorize GREEN DEBUG:) \$mID = $mID"
win_w=$(xwininfo -id $mID | awk '/Width:/{print $2}')
win_h=$(xwininfo -id $mID | awk '/Height:/{print $2}')
[ ${FLAGS_debug} -eq ${FLAGS_TRUE} ] && echo "$(colorize GREEN DEBUG:) \$win_w x \$win_h = $win_w x $win_h"
tl_x=$(($desktop_x+$desktop_w/2-$win_w/2))
tl_y=$(($desktop_y+$desktop_h/2-$win_h/2))
[ ${FLAGS_debug} -eq ${FLAGS_TRUE} ] && echo "$(colorize GREEN DEBUG:) \$tl_x x \$tl_y = $tl_x x $tl_y"
#-- Loop through all windows on the current desktop
for id in ${win_IDs[@]}; do
	if [ "$id" != "$mID" ]; then
		[ ${FLAGS_debug} -eq ${FLAGS_TRUE} ] && echo $id
		#-- Clone master window maximization settings
		case $(xwininfo -id $mID -all | awk 'BEGIN{s=0}/Maximized Horz/{s+=2}/Maximized Vert/{s+=1}END{print s}') in
			0)	wmctrl -i -r $id -b remove,maximized_vert
				wmctrl -i -r $id -b remove,maximized_horz
				;;
			1) wmctrl -i -r $id -b remove,maximized_horz
				wmctrl -i -r $id -b add,maximized_vert
				;;
			2) wmctrl -i -r $id -b remove,maximized_vert
				wmctrl -i -r $id -b add,maximized_horz
				;;
			3) wmctrl -i -r $id -b add,maximized_horz,maximized_vert
				;;
		esac
		#-- Resize window to fit master
		wmctrl -i -r $id -e 1,$tl_x,$tl_y,$win_w,$win_h
	fi
done
#-- Activate 'master' window
wmctrl -i -a $mID
#-- Print ffmpeg command with appropriately set parameters for 'x11grab'
xwininfo -id $mID | awk -f <(sed -e '0,/^#!.*awk/d' $0) 1>&2
exit 0

#!/usr/bin/awk -f
BEGIN {
	FS = "[+]|[ \t]+"
	prefix = "sleep 5; beep; sleep 1; ffmpeg -y"
	postfix = "-f pulse -i default -c:v libx264 -crf 0 -preset ultrafast temp.mp4"
}
/Relative upper-left X/ {
	gapx = $5
}
/Relative upper-left Y/ {
	gapy = $5
}
/Width:/ {
	width = $3
}
/Height:/ {
	height = $3
}
/geometry/ {
	offx = $4
	offy = $5
	printf "%s -video_size %dx%d -framerate 25 -f x11grab -i :0.0+%d,%d %s\n", prefix, width + gapx, height + gapy, offx, offy, postfix
}























