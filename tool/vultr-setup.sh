#! /bin/bash

CONST_MONGODB_VERSION=ubuntu1604-3.4.7
CONST_NODE_VERSION=v8.2.1
CONST_ADMIN_NAME=rodlin
CONST_ADMIN_PASSWD=
CONST_ADMIN_HOME=/home/$CONST_ADMIN_NAME
CONST_FOCI_REPO=https://gitlab.com/zhengyal/foci-server.git

#################################################################

# create admin user
useradd $CONST_ADMIN_NAME -s /bin/bash -m -g sudo
chpasswd <<< "$CONST_ADMIN_NAME:$CONST_ADMIN_PASSWD"

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

admin_run touch $CONST_ADMIN_HOME/.bash_profile

mkdir foci-setup
cd foci-setup

trace "Downloading packages..."

# download mongodb and node
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${CONST_MONGODB_VERSION}.tgz
wget https://nodejs.org/dist/${CONST_NODE_VERSION}/node-${CONST_NODE_VERSION}-linux-x64.tar.gz

trace "Installing packages..."

tar -xzf mongodb-linux-x86_64-${CONST_MONGODB_VERSION}.tgz
tar -xzf node-${CONST_NODE_VERSION}-linux-x64.tar.gz

if [ ! -d /opt ]; then
    mkdir /opt
fi

cp -r node-${CONST_NODE_VERSION}-linux-x64 /opt/
cp -r mongodb-linux-x86_64-${CONST_MONGODB_VERSION} /opt/

MONGODB_PATH=/opt/mongodb-linux-x86_64-${CONST_MONGODB_VERSION}
NODE_PATH=/opt/node-${CONST_NODE_VERSION}-linux-x64

add_path $NODE_PATH/bin
add_path $MONGODB_PATH/bin

# ln -s $NODE_PATH/bin/node /usr/bin/node
# ln -s $NODE_PATH/bin/npm /usr/bin/npm

# ln -s $MONGODB_PATH/bin/mongod /usr/bin/mongod
# ln -s $MONGODB_PATH/bin/mongo /usr/bin/mongo
# ln -s $MONGODB_PATH/bin/mongoimport /usr/bin/mongoimport
# ln -s $MONGODB_PATH/bin/mongoexport /usr/bin/mongoexport

mkdir $MONGODB_PATH/db

touch $MONGODB_PATH/mongodb.conf
cat > $MONGODB_PATH/mongodb.conf <<< \
"bind_ip = 127.0.0.1
port = 3137

fork = true

logpath = $MONGODB_PATH/log
dbpath = $MONGODB_PATH/db
"

echo "alias start-mongo='sudo $MONGODB_PATH/bin/mongod -v --config $MONGODB_PATH/mongodb.conf'" >> $CONST_ADMIN_HOME/.bash_profile

trace "Install finished"

trace "Downloading foci..."

cd $CONST_ADMIN_HOME

# download foci from repo
admin_run mkdir foci
cd foci
admin_run git init
admin_run git remote add origin $CONST_FOCI_REPO
admin_run git pull origin master
apt install gulp

trace "Installing nginx..."

apt install nginx

trace "Configuring nginx..."

# config nginx server
cat >> /etc/nginx/conf.d/foci.conf << END
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

login $CONST_ADMIN_NAME

# invoke!
# commands you can use:
#     1. start-{mongo, nginx, foci} - start these things
#     2. foci-setup - setup foci (npm install, etc.)
