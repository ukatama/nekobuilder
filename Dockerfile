FROM node
MAINTAINER ukatama dev.ukatama@gmail.com

RUN apt-get update -yq
RUN apt-get install git
RUN apt-get install -yq libapparmor-dev

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ONBUILD COPY package.json /usr/src/app/
ONBUILD RUN npm install
ONBUILD COPY . /usr/src/app

CMD [ "npm", "start" ]