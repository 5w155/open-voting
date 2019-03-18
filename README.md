# Open Voting webapp

Vote at hackathons!

---

## Authors
- [Pablo Pfister](mailto:pp@5w155.ch) - [5w155 SA](https://5w155.ch)

---

## Introduction
Open voting is a webapp that allows to launch votes and collect responses. It supports two types of votes: public votes, where everyone can participate and jury votes, where only users having an access code can participate.
The app was initially developed for Hackathon HUG #3 (April 2018) and required public and jury vote. The mechanism to control the connection of the user and his non-cheating was required to be extremely lightweight.
See the "How to use" section for detailed instruction on how to configure and use the app.

---

## How to use
The app provides two vote modes that can be used simultaneously: public and jury modes.

#### Public user
A user can access the public vote by connecting to the root url: `https://domain-name.com/`. A simple email is required to participate in the vote. The app will store a cookie in the user's browser to remember him.

#### Jury member
A jury member can connect to the `https://domain-name.com/jury` url to login with an access code (see admin section to generate new jury access tokens).

#### Admin
The admin can login to the admin console at the url `https://domain-name.com/admin` by providing the secret code hardcoded in the config files (see "How to config" section for more details). From there he can:
- Manage votes accessibility: open and close vote sessions (when a vote is closed none can vote)
- Manage jury tokens: create new tokens (each token will allow one jury member to connect and vote in the apposite section)
- See votes results: one chart per vote mode is accessible

---

## How to config
In order to setup a new vote there's a configuration file allowing to specify:
- public and jury questions, alongside the possible answers and related values
- challenges to vote on
The config file is `/app/config/vote-config.json`. Modify it by keeping its structure.

---

## Deploying the application
This repository contains some docker configurations allowing to run the application.
Run `docker-compose build` from the root of this repository to build the container(s).
Run `docker-compose up` from the root of this repository to start the container(s) (add the -d flag to run it as a background process).

A webserver (ex: nginx) need to be installed alongside an SSL certificate to serve the application over the public internet.

On a local machine, the app can be run by typing `npm start` inside the `app/` folder. The webapp is then accessible on `localhost:3000`.

---

## Acknowledgement and vulnerabilities
This software was built in a few days, it's far from being perfect and bug-less. In fact, many vulnerabilities are present and need to be addressed.

---

## License
[BSD-3-Clause](https://opensource.org/licenses/BSD-3-Clause) © 2019 [5w155 SA](https://5w155.ch)
