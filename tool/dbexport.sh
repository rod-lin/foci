#! /bin/bash

if [ -z "$1" ]; then
	echo "missing the first argument(database)"
	exit 1
fi

if [ -z "$2" ]; then
	echo "missing the second argument(output dir)"
	exit 1
fi

if [ ! -d "$2" ]; then
	echo "output dir does not exist"
	exit 1
fi

if [ -z "$3" ]; then
	echo "server ip not specified. Using 127.0.0.1:3137"
	SERV="127.0.0.1:3137"
else
	SERV="$3"
fi

DATABASE=$1
OUTPUT=$2

function doexport() {
	mongoexport -d $DATABASE -c $1 -o $OUTPUT/$1.json --type json -h $SERV
}

doexport user
doexport event
doexport uid
doexport file
doexport pm
doexport cover
