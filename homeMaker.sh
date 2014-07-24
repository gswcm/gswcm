#!/bin/sh


# Functions
#-----------
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
colorize() {
	bold="${1}"
	shift;
	GREEN="\033[$bold;32m"
	CYAN="\033[$bold;36m"
	GRAY="\033[$bold;37m"
	BLUE="\033[$bold;34m"
	RED="\033[$bold;31m"
	YELLOW="\033[$bold;33m"
	NORMAL="\033[m"
	color=\$${1:-NORMAL}
	echo -ne "`eval echo ${color}`"
	shift; printf "$*"
	echo -ne "${NORMAL}"
}

# Options
#---------
domain="GSWCM"
account="administrator"
verbose=1
while getopts ":qh" opt; do 
	case $opt in
		q)
			verbose=0
			;;
		h)
			echo "Usage: $(basename $0) [-v] [-h]"
			echo ""
			echo "Optional arguments:"
			echo "  -q    quiet operations"
			echo "  -h    print this message"
			exit 0
			;;
		\?)
			echo "Invalid option: -$OPTARG" >&2
			exit 0
			;;
	esac
done

# Remove home directories of non-existent users
#---------------------------------------------------
cd "$(getent passwd | grep -i "$domain[\]$account" | cut -d: -f6)/.."
flag=0
for dn in *; do 
	if [ ! -d ${dn} ]; then 
		rm -rf "$dn" 1> /dev/null 2> /dev/null
		[ $verbose -gt 0 ] && echo "$(colorize 0 GREEN 'INFO'): file '$dn' was removed from domain directory" 1>&2
		continue
	fi
	[ $flag -eq 0 ] && { getent passwd | grep -q "^$domain[\]$dn[:]" || flag=1; }
done
#-- Check if there exist at least one directory to be removed
if [ $verbose -gt 0 -a $flag -gt 0 ]; then
	echo "$(colorize 0 GREEN 'INFO'): Domain '$domain' contains director{y|ies} which are not bound to existing users:"
fi
for dn in *; do 
	if ! getent passwd | grep -q "^$domain[\]$dn[:]"; then 
		if [ $verbose -gt 0 ]; then
			printf "      Would you like to delete '$(colorize 0 CYAN $dn)'? [Y/n]: " 
			YesNo 0 || continue  	
		fi
		rm -rf "$dn"
	fi 
done

# Create home directories for new users
#------------------------------------
cnt=0
cd ${0%/*}
getent passwd | awk -F":" -v search="^$domain" '$0 ~ search {printf("%s,%s,%s,%s,%s\n",substr($1,index($1,"\\")+1),$3,$4,$5,$6)}' > /tmp/$$
while IFS="," read id uid gid name home; do 
	if [ ! -d "$home" ]; then
		[ $id = "guest" -o $id = "krbtgt" ] && continue;
		[ $verbose -gt 0 ] && printf "Creating home directory for account %-40s\n" "'$name'"
		((cnt++))
	fi
	chown -R "$uid:$gid" "$home"		
	chmod 700 "$home"
done < /tmp/$$
if [ $verbose -gt 0 -a $cnt -gt 0 ]; then
	printf "$(colorize 0 GREEN 'INFO'): Total number of newly created home directories is %d\n" $cnt
fi
rm -f /tmp/$$


