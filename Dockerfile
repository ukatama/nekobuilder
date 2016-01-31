FROM ubuntu
MAINTAINER ukatama dev.ukatama@gmail.com

apt-get update -yq
apt-get install -yq git
apt-get install -yq build-essential
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
apt-get install -yq nodejs
apt-get clean

COPY package.json /src/app/package.json
WORKDIR /src/app
RUN npm install
COPY . /src/app/

ENTRYPOINT npm run start
EXPOSE 80
