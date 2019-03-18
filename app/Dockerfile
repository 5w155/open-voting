FROM node:8

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

#RUN npm install
# If you are building your code for production
RUN npm install --only=production

# Bundle app source
COPY . .

# Ensure that the app files are owned by the non-root user
COPY --chown=node:node . .

# Set the user to node
USER node

EXPOSE 3000

CMD [ "npm", "start" ]
