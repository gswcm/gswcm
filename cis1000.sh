#!/bin/bash

if [ $# -eq 0 ]; then
	echo "Need one arument -- ZIP archive filename" 1>&2 
	exit 1
fi

if ! unzip -tq "$1" ; then
	exit 2;
fi

dirName="${1%.*}"
unzip "$1" -d "$dirName"
cd "$dirName"
mkdir -p unzipped

for f in *.zip; do 
	unzip -j "$f" -d unzipped/"$(echo "$f" | sed 's/^[0-9 -]\{2,\}\([a-zA-Z ]\{2,\}\) -..*$/\1/')"; 
done
