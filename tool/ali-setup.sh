#! /bin/bash

CONST_MONGODB_VERSION=ubuntu1604-3.4.7
CONST_NODE_VERSION=v8.6.0
CONST_ADMIN_NAME=rodlin
CONST_ADMIN_PASSWD=123456
CONST_ADMIN_HOME=/home/$CONST_ADMIN_NAME
CONST_FOCI_REPO=git@gitlab.com:zhengyal/foci-server.git
# https://gitlab.com/zhengyal/foci-server.git

#################################################################

# create admin user
egrep "^$CONST_ADMIN_NAME" /etc/passwd >& /dev/null
if [ $? -ne 0 ]; then # user not exist
    useradd $CONST_ADMIN_NAME -s /bin/bash -m -g sudo
    chpasswd <<< "$CONST_ADMIN_NAME:$CONST_ADMIN_PASSWD"
fi

function trace() {
    echo "### " $*
}

function admin_run() {
    sudo -u $CONST_ADMIN_NAME $*
}

function add_path() {
    trace "Adding path $1"
    export PATH=$1:$PATH
    echo "export PATH=$1:$PATH" >> $CONST_ADMIN_HOME/.bash_profile
}

if [ ! -f $CONST_ADMIN_HOME/.bash_profile ]; then
    admin_run touch $CONST_ADMIN_HOME/.bash_profile
fi

if [ ! -d foci-setup ]; then
    mkdir foci-setup
fi

cd foci-setup

trace "Downloading packages..."

# download mongodb and node
if [ ! -f mongodb-linux-x86_64-${CONST_MONGODB_VERSION}.tgz ]; then
    wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${CONST_MONGODB_VERSION}.tgz
fi

if [ ! -f node-${CONST_NODE_VERSION}-linux-x64.tar.gz ]; then
    wget https://nodejs.org/dist/${CONST_NODE_VERSION}/node-${CONST_NODE_VERSION}-linux-x64.tar.gz
fi

trace "Installing packages..."

if [ ! -d mongodb-linux-x86_64-${CONST_MONGODB_VERSION} ]; then
    tar -xzf mongodb-linux-x86_64-${CONST_MONGODB_VERSION}.tgz
fi

if [ ! -d node-${CONST_NODE_VERSION}-linux-x64 ]; then
    tar -xzf node-${CONST_NODE_VERSION}-linux-x64.tar.gz
fi

if [ ! -d /opt ]; then
    mkdir /opt
fi

if [ ! -d /opt/node-${CONST_NODE_VERSION}-linux-x64 ]; then
    cp -r node-${CONST_NODE_VERSION}-linux-x64 /opt/
fi

if [ ! -d /opt/mongodb-linux-x86_64-${CONST_MONGODB_VERSION} ]; then
    cp -r mongodb-linux-x86_64-${CONST_MONGODB_VERSION} /opt/
fi

MONGODB_PATH=/opt/mongodb-linux-x86_64-${CONST_MONGODB_VERSION}
NODE_PATH=/opt/node-${CONST_NODE_VERSION}-linux-x64

add_path $NODE_PATH/bin
add_path $MONGODB_PATH/bin

if [ ! -d $MONGODB_PATH/db ]; then
    mkdir $MONGODB_PATH/db
fi

if [ ! -f $MONGODB_PATH/mongodb.conf ]; then
    touch $MONGODB_PATH/mongodb.conf
    cat > $MONGODB_PATH/mongodb.conf <<< \
"bind_ip = 127.0.0.1
port = 3137

fork = true

logpath = $MONGODB_PATH/log
dbpath = $MONGODB_PATH/db
"
fi

echo "alias start-mongo='sudo $MONGODB_PATH/bin/mongod -v --config $MONGODB_PATH/mongodb.conf'" >> $CONST_ADMIN_HOME/.bash_profile

trace "Install finished"

trace "Downloading foci..."

cd $CONST_ADMIN_HOME

apt update

apt install git

# download foci from repo
admin_run mkdir foci
cd foci
admin_run git init
admin_run git remote add origin $CONST_FOCI_REPO
admin_run git pull origin master
# apt install gulp
npm install gulp --global

trace "Installing nginx..."

apt install nginx-full

trace "Configuring nginx..."

# config nginx server
cat > /etc/nginx/conf.d/foci.conf << END
server {
    listen 80;
    server_name foci.me;
    location / {
        proxy_pass http://127.0.0.1:3138;
        client_max_body_size 4m;

        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name api.foci.me;
    location / {
        proxy_pass http://127.0.0.1:3138;
        client_max_body_size 4m;
        
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
END

# define several user utils
cat >> $CONST_ADMIN_HOME/.bash_profile << END
function foci-setup() {
    cd ~/foci
    npm install
    gulp
}

alias foci-setup=foci-setup
alias start-nginx='sudo nginx -c /etc/nginx/nginx.conf'
alias start-foci='cd ~/foci && npm start'

alias start-all='start-mongo; start-nginx; start-foci'
END

# configure ssh for gitlab/github

# generate rsa keys
admin_run ssh-keygen -t rsa -f $CONST_ADMIN_HOME/.ssh/id_rsa
trace "PLEASE COPY THE FOLLOWING PUBLIC KEY TO GITHUB/GITLAB TO ENABLE SSH-BASED PUSH/PULL"
cat $CONST_ADMIN_HOME/.ssh/id_rsa.pub

login $CONST_ADMIN_NAME

# invoke!
# commands you can use:
#     1. start-{mongo, nginx, foci} - start these things
#     2. foci-setup - setup foci (npm install, etc.)
