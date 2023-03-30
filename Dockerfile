FROM node:18 as Builder

WORKDIR /action

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn run build

ENTRYPOINT ["node", "/action/dist/index.js"]
