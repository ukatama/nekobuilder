FROM node:onbuild
MAINTAINER ukatama dev.ukatama@gmail.com

RUN apt-get update -yq
RUN apt-get install -yq git
RUN apt-get install -yq libapparmor-dev

EXPOSE 80
