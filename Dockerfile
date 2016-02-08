FROM node
MAINTAINER ukatama dev.ukatama@gmail.com

RUN apt-get update -yq
RUN apt-get install -yq libapparmor-dev

RUN mkdir -p /usr/src/app/nekodev

WORKDIR /usr/src/app/nekodev
COPY nekodev/package.json /usr/src/app/nekodev
RUN npm install

WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install
COPY . /usr/src/app

RUN npm run build

EXPOSE 80
CMD ["npm", "start"]
