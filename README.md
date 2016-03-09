# Nekobuilder
[![Build Status](https://img.shields.io/travis/ukatama/nekobuilder/master.svg?style=flat-square)](https://travis-ci.org/ukatama/nekobuilder)
[![Coverage Status](https://img.shields.io/coveralls/ukatama/nekobuilder.svg?style=flat-square)](https://coveralls.io/github/ukatama/nekobuilder)
[![PeerDependencies](https://img.shields.io/david/peer/ukatama/nekobuilder.svg?style=flat-square)](https://david-dm.org/ukatama/nekobuilder#info=peerDependencies&view=list)
[![Dependencies](https://img.shields.io/david/ukatama/nekobuilder.svg?style=flat-square)](https://david-dm.org/ukatama/nekobuilder)
[![DevDependencies](https://img.shields.io/david/dev/ukatama/nekobuilder.svg?style=flat-square)](https://david-dm.org/ukatama/nekobuilder#info=devDependencies&view=list)

Automated self-hosted docker image builder.
Run `docker build` after the push notification from GitHub Webhooks.

## As a container
### Install builder
```sh
git clone https://github.com/ukatama/nekobuilder-builder.git
docker build -t ukatama/nekobuilder-builder nekobuilder-builder
```

### Install
```sh
git clone https://github.com/ukatama/nekobuilder.git
cd nekobuilder
git submodule update --init
docker build -t nekobuilder .
```

### Run
```sh
docker run -d \
  --name nekobuilder \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker \
  -p <PORT>:80 \
  -e SECRET=<SECRET> \
  nekobuilder
```

`<PORT>` and `<SECRET>` are set to the same as the value set in Webhooks.

## As a standalone server
### Install builder
```sh
git clone https://github.com/ukatama/nekobuilder-builder.git
docker build -t ukatama/nekobuilder-builder nekobuilder-builder
```

### Install
```
git clone https://github.com/ukatama/nekobuilder.git
cd nekobuilder
git submodule update --init
npm install
```

### Run
```
PORT=<PORT> SECRET=<SECRET> npm start
```

`<PORT>`(Default:80) and `<SECRET>` are set to the same as the value set in Webhooks.
