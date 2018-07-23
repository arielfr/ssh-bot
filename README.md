# ssh-bot

![23550603_834202376757247_4960199550523408384_n](https://user-images.githubusercontent.com/4379982/32911933-515a7cee-cb16-11e7-941f-55444a3902f1.png)

This is not a common **Bot**, is not going to respond you to a hello or give you the weather... This **Bot** is for the Ninja Developer, the one that can solve problems with his *utility belt*. This **Bot** is the *utility belt* he need.

# Facebook Hackaton Winner 2017

This project won the Facebook "Developer Circles Community Challenge" - Hackaton - on December 2017. Thank you for all the support.

[Facebook Hackaton Post](https://devpost.com/software/ssh-bot)

![screen shot 2018-01-02 at 12 47 54](https://user-images.githubusercontent.com/4379982/34489464-33931350-efbb-11e7-905f-4f8f9f4def86.png)

# Description

This is the source-code for a `Facebook Messenger Chat Bot` that is going to allow you to connect through SSH into your server.

This is what we support:

- PEM connections (YES, you can use your Private Key)
- Password Connections
- String responses - The result of a command thrown
- **Image** responses - The result of a command on a image, like you are seeing the Terminal!

# Developers Circles

This project was made for the Community Challenge of [Facebook Developers Circles](https://developercircles.devpost.com).

We tried to construct an application that can **make the coders more productive** helping them to access servers, logs, restart applications, checking services status and **SHARE** outputs right on the palm of their hand (Mobile Devices).

# How-it-works (Messenger)

These are the available commands you can use with our *utility belt* bot:

- ssh -> Connect to your server
- cmd -> Send commands
- reconnect -> Connect to previous ssh connection
- disconnect -> Close connection
- help -> Show all the commands

## Usage

Next, we are going to explain all the commands on more detail

### ssh

You can use this command to connect to your server. We support the next arguments:

- host
- user
- password
- port: Default 22
- pem: Just add it, no values

If you want to start a connection with a server with a password

```bash
ssh --host 127.0.0.1 --user root --password root
```

If you want to use a PEM, you need to send it to use first. Don't worry!, your information is secure:

![screen shot 2017-11-16 at 16 55 55](https://user-images.githubusercontent.com/4379982/32912827-f7ade9bc-cb18-11e7-9d9b-6ccc77141748.png)

When you receive the acknowledge text, you are able to connect using the *PEM* file

```bash
ssh --host 127.0.0.1 --user root --pem
```

### cmd

This command would allow you to send commands (of course) to your server.

**Remember, this is not an interactive console. You are not going to have good responses if you send a --tail command"**

We support the next arguments:

- --image: Just add it, no values
- --interactive: Just add it, no values

Example:

```bash
cmd pwd
```

![screen shot 2017-11-16 at 17 02 06](https://user-images.githubusercontent.com/4379982/32913052-d1d0e73e-cb19-11e7-8f25-5f005f454598.png)

#### --image

Yes!, you here right. If you send the `--image` parameter you will recive the ouput on an image like your are seeing the terminal:

Example:

```bash
cmd ls -la
```

![screen shot 2017-11-16 at 17 24 26](https://user-images.githubusercontent.com/4379982/32914067-f1fb92b8-cb1c-11e7-9a3f-c43edd55362e.png)

**Yes, you can click and ZOOM IN**

#### --interactive

Lots of Linux servers if you are not running interactive, the .bashrc file will exit early. So? If that happends, there are many commands that you are going to lose. So, if you send `--interactive`, your command is going to work like a charm

Example:

```bash
cmd npm --version --interactive
```

![screen shot 2017-11-16 at 17 26 31](https://user-images.githubusercontent.com/4379982/32914145-3a4b7fc4-cb1d-11e7-8777-30b79df40fc3.png)

### reconnect

If you already login, you dont need to send the command of `ssh` again. You can just `reconnect`

```bash
reconnect
```

### disconnect

Just type `disconnect` to close your open connection

```bash
disconenct
```

### help

If you need help with the commands, you can just type `help`

```bash
help
```

## Technical Spoilers

Just read the code, don't be lazy. Just kidding. This application was done using **NodeJS**. This are the main packages that we are using:

- SHH connections: [node-ssh](https://www.npmjs.com/package/node-ssh).
- Facebook API: [FB](https://www.npmjs.com/package/fb).
- Images: [canvas](https://www.npmjs.com/package/canvas)

To upload the attachments we are manually doing the **request**.

## Install

### Dependency (Node Canvas)

To convert String Text to Images we are using **node-canvas**. Said that, you need to have **cairo** C++ package. To install it:

OS | Command
----- | -----
OS X | `brew install pkg-config cairo pango libpng jpeg giflib`
Ubuntu | `sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++`
Fedora | `sudo yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel`
Solaris | `pkgin install cairo pango pkg-config xproto renderproto kbproto xextproto`
Windows | [Instructions on our wiki](https://github.com/Automattic/node-canvas/wiki/Installation---Windows)

**El Capitan users:** If you have recently updated to El Capitan and are experiencing trouble when compiling, run the following command: `xcode-select --install`. Read more about the problem [on Stack Overflow](http://stackoverflow.com/a/32929012/148072).

### Application

Then, comes the **easy** thing:

```bash
npm install
```

Done! Easy...

#### Start (Production)

```bash
npm start
```

#### Start (Development)

If you start the application this way, you are not going to be posting messages on Facebook

```bash
npm start-dev
```

## Deployment

This application is currently deployed on a Now. It has the `now.json` already configured.

If you want to deploy it, you just need to execute:

```bash
now --docker --public
```

You can find it currently here:

[https://ssh-bot.now.sh/](https://ssh-bot.now.sh/)

## License

Released under the terms of the MIT license.

# About

- [Ariel Rey](https://github.com/arielfr/)
- [Joel Ibaceta](https://github.com/joelibaceta)
