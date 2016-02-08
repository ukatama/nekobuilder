FROM node:onbuild
MAINTAINER ukatama dev.ukatama@gmail.com

RUN apt-get update -yq
RUN apt-get install git
RUN apt-get install -yq libapparmor-dev
