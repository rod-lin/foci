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

mongoexport -d "$1" -c user -o "$2/user.json" --type json -h "$SERV"
mongoexport -d "$1" -c event -o "$2/event.json" --type json -h "$SERV"
mongoexport -d "$1" -c uid -o "$2/uid.json" --type json -h "$SERV"
mongoexport -d "$1" -c file -o "$2/file.json" --type json -h "$SERV"
mongoexport -d "$1" -c pm -o "$2/pm.json" --type json -h "$SERV"
