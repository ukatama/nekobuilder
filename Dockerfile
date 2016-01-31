FROM node:onbuild
MAINTAINER ukatama dev.ukatama@gmail.com

RUN apt-get install -yq git

EXPOSE 80
