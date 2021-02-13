'use strict';

// eslint-disable-next-line import/no-unresolved
const express = require('express');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');
const { dynamodb } = require('./aws');

const app = express();
app.use(express.json())

// Routes
app.get('/', async (req, res) => {
	const gameID = uuidv4();
	const chess = new Chess();
	try {
		await dynamodb.create({
			FEN: { S: chess.fen() },
			Player1: { S: null },
			Player2: { S: null },
			gameID: gameID
		})
		res.redirect(`${gameID}`)
	} catch(err) {
		res.send(err + gameID)
	}
});


//REFACTOR: Put these two routes below into.

/*
app.get('/:gameID', async (req, res) => {
	try {
		const dbItem = await dynamodb.get({
			gameID: req.params.gameID 
		})
	
		const chess = new Chess(dbItem.FEN.S)

		res.send('<plaintext>'+'\n'+ 
			`${chess.turn()} to move\n`+
			`${chess.ascii()}`)
	} catch(err) {
		res.send(err)
	}
});
*/

app.get('/:gameID', async (req, res) => {
	try {
		const dbItem = await dynamodb.get({
			gameID: req.params.gameID
		})

		const chess = new Chess(dbItem.FEN.S)

		if (req.query.color !== chess.turn()) {
			throw new Error('wrong player color')
		}

		if (req.query.move) {
			const move = req.query.move

			chess.move(move)

			await dynamodb.create({
				FEN: { S: chess.fen() },
				gameID: req.params.gameID
			})
		}

		res.send('<plaintext> \n'+ 
			`${chess.turn()} to move\n`+
			`${chess.ascii()}`)
	} catch(err) {
		res.send(err)
	}
});


// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Serverless Error' + err);
});

module.exports = app;
