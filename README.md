# Publicify

A simple tool to publish your localhost in seconds.

## What's this?

Have you ever thought that you'd feel happy if you could allow your friends to access your http://localhost:8000 without deploying?

Then easily install Publicify on your server & local machine. Publicify do the rest.

## Install

```sh
npm install publicify -g
```

## Usage

1\. Run command below on your **remote server**.

```sh
publicify server <port>
```

\<port> is a number of port you want to make the server listen on.

If 3000, the command is going to be

```sh
$ publicify server 3000
Publicify server has started.
Now it is listening on port 3000
```

Then access http://\<your-servers-hostname>:3000 to make sure that the server has successfully started and can receive requests.

If you see the screen like this, server is ready.

![](noclient.png)

2\. Run command below on your **local machine**.

```sh
publicify client <remotehost> <localhost>
```

\<remotehost> is a hostname or ipaddress and port on which you started publicify server.

\<localhost> is a hostname or ipaddress and port of your localhost you want to publish.

If your server's hostname is ysk.im and want to publish http://localhost:8000, the command is going to be

```sh
$ publicify client ysk.im:3000 localhost:8000
Connected. Proxying http://ysk.im:3000 => http://localhost:8000
```

3\. That's all. Now you can access your http://localhost:8000 by http://ysk.im:3000.

## Options

### Server

**-b, --basicAuth \<username:password>** - Enable basic authentication

**-c, --clientAuth \<username:password>** - Enable basic authentication for client

**-l, --log** - Displays access logs on stdout

```sh
# For example
publicify server 3000 -b testUser:testPass -c clientUser:clientPass -l
```

### Client

**-i, --indexFile** - Specify index file when access to /$

**-c, --clientAuth \<username:password>** - Set basic authentication

**-l, --log** - Displays access logs on stdout

```sh
# For example
publicify client ysk.im:3000 localhost:8000 -i mypage.html -c clientUser:clientPass -l
```

## License

[MIT](LICENSE)
