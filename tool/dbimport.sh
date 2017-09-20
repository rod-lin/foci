#! /bin/bash

if [ -z "$1" ]; then
	echo "missing the first argument(database)"
	exit 1
fi

if [ -z "$2" ]; then
	echo "missing the second argument(input dir)"
	exit 1
fi

if [ ! -d "$2" ]; then
	echo "input dir does not exist"
	exit 1
fi

if [ -z "$3" ]; then
	echo "server ip not specified. Using 127.0.0.1:3137"
	SERV="127.0.0.1:3137"
else
	SERV="$3"
fi

DATABASE=$1
INPUT=$2

function doimport() {
	mongoimport -d $DATABASE -c $1 --type json -h $SERV $INPUT/$1.json
}

doimport user
doimport club
doimport event
doimport uid
doimport file
doimport pm
doimport cover
doimport invcode
