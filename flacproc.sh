#!/bin/bash

# SHFLAGS related
#-----------------
[ ! -f /tmp/shflags ] && wget -P /tmp -q http://shflags.googlecode.com/svn/trunk/source/1.0/src/shflags
#-- source shflags from current directory
. /tmp/shflags
DEFINE_string 'cue' '' 'CUE sheet filename' 'c'
DEFINE_string 'flac' '' 'FLAC track filename' 'f'
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
[ ${FLAGS_help} -eq ${FLAGS_TRUE} ] && exit 0
if [ ${#FLAGS_cue} -eq 0 -o ${#FLAGS_flac} -eq 0 ]; then
	flags_help
	exit 1
fi
#--
isInstalled() {
	which "$1" > /dev/null || {
		echo "$(colorize RED 'ERROR:') missing dependence(s). Please install '$1' and re-run the script." 1>&2
		return 1;
	}
	return 0
}
#--
YesNo() {
	while(true); do
		read userConfirm >&2
		[ -z ${userConfirm} ] && return ${1}
		case $userConfirm in
			yes|YES|y|Y)
			return 0;;
			no|NO|n|N)
			return 1;;
		esac
		echo "Incorrect input, try again..." >&2
	done
}
#-- Check dependencies
isInstalled "shntool"  || exit 11
isInstalled "cuetag"	  || exit 12
isInstalled "metaflac" || exit 13
#-- Processing CUE + FLAC
workdir="/tmp/flacproc"
mkdir -p "$workdir"
rm -rf "$workdir"/*
echo "$(colorize GREEN INFO:) Splitting CUE + FLAC..."
shntool split -d "$workdir" -f "${FLAGS_cue}" -o flac "${FLAGS_flac}" || { echo "$(colorize RED ERROR:) Cannot split FLAC file"; exit 21; }
echo "$(colorize GREEN INFO:) Assigning tags..."
cuetag "${FLAGS_cue}" "$workdir"/split-track*.flac 2> /dev/null || { echo "$(colorize RED ERROR:) Assign tags to track-based FLACs"; exit 22; }
echo "$(colorize GREEN INFO:) Renaming and moving track-based FLAC files to the current directory..."
for f in "$workdir"/split-track*.flac; do
	temp=0
	tag_artist=$(metaflac "$f" --show-tag=ARTIST | awk -F= '{print $2}' 2> /dev/null)
	((temp+=$?))
	tag_title=$(metaflac "$f" --show-tag=TITLE | awk -F= '{print $2}' 2> /dev/null)
	((temp+=$?))
	tag_track=$(metaflac "$f" --show-tag=TRACKNUMBER | awk -F= '{print $2}' 2> /dev/null)
	((temp+=$?))
	[ $temp -ne 0 ] && { echo "$(colorize RED ERROR:) Cannot extract tags from '$f'"; continue; }
	mv "$f" "./$tag_track - $tag_title.flac"
done
echo "$(colorize GREEN QUESTION:) Remove original FLAC file '${FLAGS_flac}'? (Y/n):"
YesNo 0 && rm "${FLAGS_flac}"


