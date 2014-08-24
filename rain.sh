#!/bin/bash

# download shflags if missing
[ ! -f shflags ] && wget -q http://shflags.googlecode.com/svn/trunk/source/1.0/src/shflags

# source shflags from current directory
. ./shflags

# define flags
DEFINE_boolean 'debug' false 'Enable debug mode' 'd'
DEFINE_string 'major' '' 'Student major (e.g. CSBS,CSMS,CSMA,ITCB,ITCM,ENGR)' 'm'
DEFINE_string 'term' '' 'Term code (e.g. 201402 for SP14, 201405 for SU14, 201408 for FA14)' 't'
DEFINE_string 'user' '' 'Username to access RAIN website' 'u'
DEFINE_string 'pass' '' 'Password of the username' 'p'

# define debug() function
debug() {
  [ ${FLAGS_debug} -eq ${FLAGS_TRUE} ] && echo "DEBUG: $@" >&2
}

# parse the command-line
FLAGS "$@" || exit 1
eval set -- "${FLAGS_ARGV}"

# sanity check
if [ ${#FLAGS_term} -eq 0 -o ${#FLAGS_user} -eq 0 -o ${#FLAGS_pass} -eq 0 ]; then
   flags_help
   exit 1
fi
if [ ! -w $(pwd) ]; then
	echo "Current directory is not writable." 1>&2
	exit 2
fi
#-- Prepare list of majors and OUs
if [ ${#FLAGS_major} -eq 0 ]; then
	majr=( CSBS ITCB ITCM ENGR CSMS CSMA QISC TCSA GRTI MGMA MTAS MTCS MTFE MTHM MTTC PEMT )
	ou=( CS CS CS CS CS CS CS CS Math Math Math Math Math Math Math Math )
else
	majr=( ${FLAGS_major} )
	ou=( )
fi
url_base="https://rain.gsw.edu/prod8x"
url_loginValidation="${url_base}/twbkwbis.P_ValLogin"
url_authorizeFromLogin="${url_base}/ztgkauth.zp_authorize_from_login"
url_facutyServices="${url_base}/twbkwbis.P_GenMenu?name=bmenu.P_FacMainMnu"
url_listMajors="${url_base}/bwwkmajr.P_GetListMajrCode"
url_listStudentsByMajor="${url_base}/bwwkmajr.P_DispMajrList"
url_listTerms="${url_base}/bwlkostm.P_FacSelTerm"
url_storeTerm="${url_base}/bwlkostm.P_FacStoreTerm"
url_logOut="${url_base}/twbkwbis.P_Logout"
#-- Header into csv file
output="${FLAGS_term}.csv"
[ -z ${FLAGS_major} ] || output="${FLAGS_term}-${FLAGS_major}.csv"
echo "fname,mname,lname,uid,passwd,year,ou" > "$output"
#-- Cookie file
cookie="session.$$"
touch $cookie
chmod 600 $cookie
#-- Enter login credentials
curl --cookie "TESTID=set" --cookie-jar $cookie --data "sid=${FLAGS_user}&PIN=${FLAGS_pass}" $url_loginValidation -s -o /dev/null
#-- Redirect to successfull login page
curl --cookie $cookie $url_authorizeFromLogin -s -o /dev/null
#-- Select term
curl --cookie $cookie --data "term=${FLAGS_term}&name1=bmenu.P_FacMainMnu" $url_storeTerm -s -o /dev/null
#-- Select major
i=0
rm -f $output.raw
for m in ${majr[@]}; do 	
	curl --cookie $cookie --data "majr=${m}" $url_listStudentsByMajor -s | 
		html2text -width 120 |
		grep "^913" | tee -a $output.raw |
		sed "s/^913\([0-9]\{6\}\) \([A-Z][A-Za-z\x20\x27]\{1,\}\), \([A-Z][A-Za-z\x27]\{1,\}\) \([A-Z]*[.]*[a-z]*\) \{0,\}\([A-Z]\{2,\}\) \{1,\}\([a-z]\{1,\}[0-9]*\)@radar.gsw.edu$/\3,\4,\2,\6,\1,\5,${ou[$i]}/g" >> $output
		((i++))
done
#-- Logout
curl --cookie $cookie $url_logOut -s -o /dev/null
#-- Clean up
rm -f $cookie
[ ${FLAGS_debug} -eq ${FLAGS_FALSE} ] && rm -f "$output.raw"


