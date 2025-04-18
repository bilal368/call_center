FROM node:20.6.0-bullseye
RUN mkdir -p /opt/DgVox/Docker/Backend
WORKDIR /opt/DgVox/Docker/Backend
COPY package.json  /opt/DgVox/Docker/Backend
COPY package-lock.json /opt/DgVox/Docker/Backend
RUN rm -rf node_modules
RUN npm ci
RUN npm install
RUN npm install ldapjs
RUN apt-get update && apt-get install -y ffmpeg
COPY . .
EXPOSE 5001
EXPOSE 3306
EXPOSE 389
EXPOSE 636
CMD ["node","app.js"]