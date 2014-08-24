#!/bin/bash

if [ $# -eq 0 ]; then
	echo "Usage: $(basename $0) csv1 csv2 ..." 1>&2
	exit 1
fi

arg=$1
while [ ! -z "$arg" ]; do
	if [ -r "$arg" ]; then
		[ -z $header ] && header="$(head -1 "$arg")"
		tail -n +2 "$arg"
	fi
	shift;
	arg="$1"
done >> $$.raw
col=$(echo "$header" | awk -F"," -vcol="uid" '{for(i=1;i<=NF;i++){if($i == col){print i;break;}}}')
cat $$.raw | sort -t"," -k$col | uniq $$.sorted
echo $header | cat - $$.sorted
rm -f $$.*
#cat 2014.csv | awk -F, '!z[$4]++{ a[$4]=$0; } END {for (i in a) print z[i], a[i]}' | sort -k1
