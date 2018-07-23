# specify the node base image with your desired version node:<version>
FROM node:8

WORKDIR /ssh-bot

COPY . /ssh-bot

# replace this with your application's default port
EXPOSE 8080

RUN apt update
RUN apt --assume-yes install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

RUN npm install

CMD ["npm", "start"]
