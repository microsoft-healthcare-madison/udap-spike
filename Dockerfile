FROM node:16

WORKDIR /usr/src/app
RUN mkdir ehr-ui && mkdir app-ui

ADD package*.json ./
ADD ehr-ui/package*.json ./ehr-ui/
# ADD app-ui/package*.json ./app-ui/

RUN npm install && \
    cd ehr-ui && npm install && \
    cd ../app-ui && npm install

COPY . .

RUN cd ehr-ui && npm run build && \
    cp -r build/* ../src/ehr/static
    # cd .. && \
    # cd app-ui && npm run build && \
    # cp -r build/* ../src/app/static

CMD ["npm", "run", "serve"]