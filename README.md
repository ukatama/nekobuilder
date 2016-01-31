# Nekobuilder
Automated self-hosted docker image builder.
Run `docker build` after the push notification fron GitHub Webhooks.

## As a container
### Install
```sh
git clone https://github.com/ukatama/nekobuilder.git
docker buidt -t nekobuilder nekobuilder
```

### Run
```sh
docker run -d \
  --name nekobuilder \
  -p <PORT>:80 \
  -e SECRET=<SECRET> \
  nekobuilder
```

`<PORT>` and `<SECRET>` are set to the same as the value set in Webhooks.

## As a standalone server
### Install
```
git clone https://github.com/ukatama/nekobuilder.git
cd nekobuilder
npm install
```

### Run
```
PORT=<PORT> SECRET=<SECRET> npm start
```

`<PORT>`(Default:80) and `<SECRET>` are set to the same as the value set in Webhooks.
