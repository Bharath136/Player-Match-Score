const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
app.use(express.json());

module.exports = app;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3005, async (request, response) => {
      console.log("Server Running at http://localhost:3005/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// GET Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT player_id,player_name FROM player_details;
    `;
  const playersArray = await db.all(getPlayersQuery);
  const array = playersArray.map((obj) => {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    };
  });
  response.send(array);
});

//Get Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT * FROM player_details WHERE player_id = '${playerId}';
    `;
  const obj = await db.get(getPlayerQuery);
  response.send({
    playerId: obj.player_id,
    playerName: obj.player_name,
  });
});

//Update Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.query;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
        UPDATE 
            player_details
        SET 
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT * FROM match_details WHERE match_id = ${matchId};
    `;
  const matchDetails = await db.get(getMatchQuery);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

//Get All Match API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT 
            * 
        FROM 
            player_match_score NATURAL JOIN player_details
        WHERE 
            player_id = ${playerId};
    `;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  const arr = playerMatches.map((obj) => {
    return {
      playerMatchId: obj.player_match_id,
      playerId: obj.player_id,
      matchId: obj.match_id,
      score: obj.score,
      fours: obj.fours,
      sixes: obj.sixes,
      playerName: obj.player_name,
    };
  });
  response.send(playerMatches);
});

//Get All Player API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName
        FROM player_match_score INNER JOIN player_details ON player_match_score.player_id = player_details.player_id JOIN match_details ON player_match_score.match_id = match_details.match_id WHERE match_details.match_id = ${matchId};
    `;
  const matchPlayers = await db.all(getMatchPlayersQuery);
  response.send(matchPlayers);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(player_match_score.score) AS totalScore,
            SUM(player_match_score.fours) AS totalFours,
            SUM(player_match_score.sixes) AS totalSixes
        FROM player_match_score INNER JOIN player_details ON player_match_score.player_id = player_details.player_id WHERE player_details.player_id = ${playerId};
    `;
  const matchPlayers = await db.get(getMatchPlayersQuery);
  response.send(matchPlayers);
});
