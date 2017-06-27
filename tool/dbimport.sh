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

mongoimport -d "$1" -c user	--type json -h "$SERV" "$2/user.json"
mongoimport -d "$1" -c event	--type json -h "$SERV" "$2/event.json"
mongoimport -d "$1" -c uid	--type json -h "$SERV" "$2/uid.json"
mongoimport -d "$1" -c file	--type json -h "$SERV" "$2/file.json"
mongoimport -d "$1" -c pm	--type json -h "$SERV" "$2/pm.json"
