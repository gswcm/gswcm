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
#-- Identify column index of the "uid" column
colID=$(echo "$header" | awk -F"," -vcol="uid" '{for(i=1;i<=NF;i++){if($i == col){print i;break;}}}')
colTerm=$(echo "$header" | awk -F"," -vcol="term" '{for(i=1;i<=NF;i++){if($i == col){print i;break;}}}')
cat $$.raw | sort -t"," -k$colID | awk -F"," -vcolID=$colID -vcolTerm=$colTerm '{z[$colID]++;if(z[$colID] > 1){if($colTerm > a[$colID]){a[$colID]=$colTerm;b[$colID]=$0;}}else{b[$colID]=$0;a[$colID]=$colTerm}}END{for(i in b){print b[i]}}' | sort -k$colID > $$.sorted
echo $header | cat - $$.sorted
rm -f $$.*
#cat 2014.csv | awk -F, '!z[$4]++{ a[$4]=$0; } END {for (i in a) print z[i], a[i]}' | sort -k1

