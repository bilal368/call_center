### STAGE 1: Build ###
FROM node:20.6.0-bullseye AS builder

RUN mkdir -p /opt/DgVox/Docker/Frontend
WORKDIR /opt/DgVox/Docker/Frontend


RUN apt update
RUN apt install sudo
RUN apt install -y npm
RUN npm install -g @angular/cli@latest
COPY package.json /opt/DgVox/Docker/Frontend
COPY package-lock.json /opt/DgVox/Docker/Frontend
COPY angular.json /opt/DgVox/Docker/Frontend
COPY tsconfig.app.json /opt/DgVox/Docker/Frontend
COPY tsconfig.json /opt/DgVox/Docker/Frontend
COPY tsconfig.spec.json /opt/DgVox/Docker/Frontend
RUN rm -rf node_modules
RUN npm ci
RUN npm install
COPY . .
RUN ng build 
RUN ls -la
EXPOSE 8080

### STAGE 2: Build ###
FROM nginx:latest
COPY nginxdocker /etc/nginx
COPY --from=builder /opt/DgVox/Docker/Frontend/dist /usr/share/nginx/html
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
RUN service nginx stop
RUN service nginx start