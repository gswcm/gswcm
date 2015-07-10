BEGIN {
	FS = ",";
	print "function getBuildingData() {";
	print "   var buildingMap = {};";
}
{
	printf "   buildingMap['%s'] = {mini : '%s', maxi : '%s'};\n", $1, $2, $3
}
END {
	print "   return buildingMap;"
	print "}"
}
