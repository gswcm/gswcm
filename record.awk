BEGIN {
	FS = "[+]|[ \t]+"
	prefix = "ffmpeg -y"
	postfix = "-f pulse -i default -c:v libx264 -crf 0 -preset ultrafast test.mp4"
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
