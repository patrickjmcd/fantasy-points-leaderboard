import _ from "lodash";
import espn from "espn-fantasy-football-api/node";
import cookie from "./cookie";

const filterPosition = (boxscorePlayer, position) => {
    return (
        boxscorePlayer.position === position ||
        _.includes(boxscorePlayer.player.eligiblePositions, position)
    );
};

const handleNonFlexPosition = (lineup, position) => {
    const players = _.filter(lineup, (player) =>
        filterPosition(player, position)
    );
    const sortedPlayers = _.sortBy(players, ["totalPoints"]);
    return _.last(sortedPlayers);
};

const analyzeLineup = (lineup, score) => {
    let bestSum = 0;
    const bestRoster = [];
    let numChanges = 0;

    const bestQB = handleNonFlexPosition(lineup, "QB");
    bestRoster.push(bestQB.player.fullName);
    bestSum += bestQB.totalPoints;
    if (bestQB.position === "Bench") {
        numChanges += 1;
    }

    const bestDefense = handleNonFlexPosition(lineup, "D/ST");
    bestRoster.push(bestDefense.player.fullName);
    bestSum += bestDefense.totalPoints;
    if (bestDefense.position === "Bench") {
        numChanges += 1;
    }

    const bestKicker = handleNonFlexPosition(lineup, "K");
    bestRoster.push(bestKicker.player.fullName);
    bestSum += bestKicker.totalPoints;
    if (bestKicker.position === "Bench") {
        numChanges += 1;
    }

    const flexPlayers = _.filter(
        lineup,
        (player) =>
            filterPosition(player, "RB") ||
            filterPosition(player, "WR") ||
            filterPosition(player, "TE")
    );
    const sortedFlexPlayers = _.sortBy(flexPlayers, ["totalPoints"]);

    const flexPos = { RB: 2, WR: 2, TE: 1, FLEX: 1 };

    while (_.sum(_.values(flexPos)) && !_.isEmpty(sortedFlexPlayers)) {
        const player = sortedFlexPlayers.pop();
        const acceptPlayer = () => {
            bestRoster.push(player.player.fullName);
            bestSum += player.totalPoints;
            if (player.position === "Bench") {
                numChanges += 1;
            }
        };

        if (flexPos.RB && _.includes(player.player.eligiblePositions, "RB")) {
            acceptPlayer();
            flexPos.RB -= 1;
        } else if (
            flexPos.WR &&
            _.includes(player.player.eligiblePositions, "WR")
        ) {
            acceptPlayer();
            flexPos.WR -= 1;
        } else if (
            flexPos.TE &&
            _.includes(player.player.eligiblePositions, "TE")
        ) {
            acceptPlayer();
            flexPos.TE -= 1;
        } else if (flexPos.FLEX) {
            acceptPlayer();
            flexPos.FLEX -= 1;
        }
    }

    return {
        bestSum,
        bestRoster,
        currentScore: score,
        numChanges,
    };
};

const getSortedScores = async (leagueId, seasonId, weekId) => {
    const myClient = new espn.Client({ leagueId });
    myClient.setCookies(cookie);

    try {
        const boxscores = await myClient.getBoxscoreForWeek({
            matchupPeriodId: weekId,
            scoringPeriodId: weekId,
            seasonId,
        });
        const teams = await myClient.getTeamsAtWeek({
            scoringPeriodId: weekId,
            seasonId,
        });

        const keyedTeams = _.keyBy(teams, "id");

        const allScores = [];

        const boxWithResults = boxscores.map((s) => {
            const aHome = analyzeLineup(s.homeRoster, s.homeScore);
            const aAway = analyzeLineup(s.awayRoster, s.awayScore);
            const boxHome = {
                teamId: s.homeTeamId,
                name: keyedTeams[s.homeTeamId].name,
                score: s.homeScore,
                bestScore: aHome.bestSum,
            };
            const boxAway = {
                teamId: s.awayTeamId,
                name: keyedTeams[s.awayTeamId].name,
                score: s.awayScore,
                bestScore: aAway.bestSum,
            };

            allScores.push(boxHome);
            allScores.push(boxAway);

            const box = {
                home: boxHome,
                away: boxAway,
            };

            const actWinner = boxHome.score > boxAway.score ? "home" : "away";
            const actLoser = boxHome.score < boxAway.score ? "home" : "away";

            const optWinner =
                boxHome.bestScore > boxAway.bestScore ? "home" : "away";
            const optLoser =
                boxHome.bestScore < boxAway.bestScore ? "home" : "away";

            box.result = {
                actual: {
                    winner: box[actWinner].name,
                    winnerScore: box[actWinner].score,
                    loser: box[actLoser].name,
                    loserScore: box[actLoser].score,
                },
                optimized: {
                    winner: box[optWinner].name,
                    winnerScore: box[optWinner].bestScore,
                    loser: box[optLoser].name,
                    loserScore: box[optLoser].bestScore,
                },
                differenceMade: actWinner !== optWinner,
            };

            return box;
        });

        const scoresByActual = _.sortBy(allScores, "score").reverse();
        const scoresByBestScore = _.sortBy(allScores, "bestScore").reverse();

        return {
            actual: scoresByActual,
            bestPossible: scoresByBestScore,
        };
    } catch (error) {
        console.log(error);
    }
};

const printAllScores = async (leagueId, seasonId, currentWeek) => {
    for (let i = 1; i <= currentWeek; i++) {
        const sortedScores = await getSortedScores(leagueId, seasonId, i);
        const isCurrentWeek = i === currentWeek;

        const actWinner = sortedScores.actual[0];
        const optWinner = sortedScores.bestPossible[0];

        if (!isCurrentWeek) {
            const winnerString = `WEEK ${i} WINNER: ${actWinner.name} - ${actWinner.score} (best possible: ${actWinner.bestScore})`;
            console.log(winnerString);
            if (actWinner.name !== optWinner.name) {
                const idiotString = `   -- IDIOT OF THE WEEK: ${optWinner.name} - ${optWinner.score} (best possible: ${optWinner.bestScore})`;
                console.log(idiotString);
            }
        } else {
            const leaderString = `-----------\nWEEK ${i} LEADER: ${actWinner.name} - ${actWinner.score}`;
            console.log(leaderString);
        }
    }
};

const getBoxScoresWithBest = async (leagueId, seasonId, weekId) => {
    const myClient = new espn.Client({ leagueId });
    myClient.setCookies(cookie);

    try {
        const boxscores = await myClient.getBoxscoreForWeek({
            matchupPeriodId: weekId,
            scoringPeriodId: weekId,
            seasonId,
        });

        const boxWithResults = boxscores.map((s) => {
            const aHome = analyzeLineup(s.homeRoster, s.homeScore);
            const aAway = analyzeLineup(s.awayRoster, s.awayScore);
            const boxHome = {
                teamId: s.homeTeamId,
                score: s.homeScore,
                bestScore: aHome.bestSum,
            };
            const boxAway = {
                teamId: s.awayTeamId,
                score: s.awayScore,
                bestScore: aAway.bestSum,
            };

            const box = {
                home: boxHome,
                away: boxAway,
                weekId,
            };

            const actWinner = boxHome.score > boxAway.score ? "home" : "away";
            const actLoser = boxHome.score < boxAway.score ? "home" : "away";

            const optWinner =
                boxHome.bestScore > boxAway.bestScore ? "home" : "away";
            const optLoser =
                boxHome.bestScore < boxAway.bestScore ? "home" : "away";

            box.result = {
                actual: {
                    winner: box[actWinner].teamId,
                    winnerScore: box[actWinner].score,
                    loser: box[actLoser].teamId,
                    loserScore: box[actLoser].score,
                },
                optimized: {
                    winner: box[optWinner].teamId,
                    winnerScore: box[optWinner].bestScore,
                    loser: box[optLoser].teamId,
                    loserScore: box[optLoser].bestScore,
                },
                differenceMade: actWinner !== optWinner,
            };

            return box;
        });
        return boxWithResults;
    } catch (error) {
        console.log(error);
    }
};

export const optimize = {
    analyzeLineup,
    getSortedScores,
    printAllScores,
    getBoxScoresWithBest,
};
