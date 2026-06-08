# Upfinder

Lost and found service for connecting people with their misplaced items.

## Stack

- React + Vite
- Express
- MySQL

## Setup

Install dependencies:

```bash
cd server && npm install
cd ../client && npm install && npm run build
```

## Running on the server

Start the backend (runs on port 30004):

```bash
cd Upfinder/server
screen -dmS upfinder-back npm start
```

Start the frontend (runs on port 30005):

```bash
cd Upfinder/client
screen -dmS upfinder-front npm run preview -- --host 0.0.0.0 --port 30005
```

To check running sessions: `screen -ls`

To attach to a session: `screen -r upfinder-back` or `screen -r upfinder-front`

To detach: press `Ctrl+A` then `D`

## What's inside

The app has two sides: reporting lost items and claiming found ones. Users can post what they've lost, search through found items, and when there's a potential match, start a chat to verify ownership. The claim system includes a review process to help confirm legitimate owners.

Profile management, notifications, and match results are also part of the flow.

## Database

MySQL connection is configured in the server code. Check `server/src` for connection details and schema.

## Project structure

```
upfinder/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Main views
│       └── components/
└── server/          # Express API
    └── src/
```
