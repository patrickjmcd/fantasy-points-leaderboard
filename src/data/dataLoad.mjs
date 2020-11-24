import espn from "espn-fantasy-football-api/node";
import { optimize } from "./optimize.mjs";
import { api } from "./api.mjs";
import _ from "lodash";

const leagueId = process.env.REACT_APP_ESPN_LEAGUE_ID;
const myClient = new espn.Client({ leagueId });
// myClient.setCookies(cookie);

const getTeamsFromESPN = async (leagueId, seasonId, weekId) => {
    try {
        const teams = await myClient.getTeamsAtWeek({
            scoringPeriodId: weekId,
            seasonId,
        });
        return teams;
    } catch (error) {
        console.log(error);
    }
};

const loadTeams = async (leagueId, seasonId, weekId) => {
    const jwt = await api.login();
    console.log({ leagueId, seasonId, weekId });
    const teams = await getTeamsFromESPN(leagueId, seasonId, weekId);
    const teamsPromise = teams.map(async (t) => {
        const dbId = await api.getTeamId(jwt, t.id);
        if (!dbId) {
            console.log(`Team ${t.name} created`);
            return await api.addTeam(jwt, {
                teamId: t.id,
                name: t.name,
                abbreviation: t.abbreviation,
                logoURL: t.logoURL,
                seasonId: t.seasonId,
            });
        } else {
            console.log(`Team ${t.name} updated`);
            return await api.updateTeam(jwt, {
                dbId,
                teamId: t.id,
                name: t.name,
                abbreviation: t.abbreviation,
                logoURL: t.logoURL,
                seasonId: t.seasonId,
            });
        }
    });
    return await Promise.all(teamsPromise);
};

const loadBoxScores = async (leagueId, seasonId, weekId) => {
    const jwt = await api.login();
    const i = weekId;
    const boxScores = await optimize.getBoxScoresWithBest(
        leagueId,
        seasonId,
        weekId
    );
    const bsPromises = boxScores.map(async (b) => {
        // load matchups
        const dbId = await api.getMatchupId(jwt, {
            weekId: weekId,
            seasonId,
            awayTeamId: b.away.teamId,
            homeTeamId: b.home.teamId,
        });
        if (!dbId) {
            console.log(
                `Week ${i} Matchup ${b.away.teamId} @ ${b.home.teamId} created`
            );
            await api.addMatchup(jwt, {
                weekId: weekId,
                seasonId,
                awayTeamId: b.away.teamId,
                homeTeamId: b.home.teamId,
            });
        } else {
            console.log(
                `Week ${i} Matchup ${b.away.teamId} @ ${b.home.teamId} updated`
            );
            await api.updateMatchup(jwt, {
                dbId,
                weekId: weekId,
                seasonId,
                awayTeamId: b.away.teamId,
                homeTeamId: b.home.teamId,
            });
        }

        // load team_weeks
        const twPromises = ["home", "away"].map(async (t) => {
            const dbId = await api.getTeamWeekId(jwt, {
                weekId: weekId,
                seasonId,
                teamId: b[t].teamId,
            });
            if (!dbId) {
                console.log(`Week ${i} TeamWeek ${b[t].teamId} created`);
                return await api.addTeamWeek(jwt, {
                    weekId: weekId,
                    seasonId,
                    teamId: b[t].teamId,
                    score: b[t].score,
                    bestPossibleScore: b[t].bestScore,
                });
            } else {
                console.log(`Week ${i} TeamWeek ${b[t].teamId} updated`);
                return await api.updateTeamWeek(jwt, {
                    dbId,
                    weekId: weekId,
                    seasonId,
                    teamId: b[t].teamId,
                    score: b[t].score,
                    bestPossibleScore: b[t].bestScore,
                });
            }
        });
        await Promise.all(twPromises);
    });
    await Promise.all(bsPromises);
    return true;
};

const calculateWeekWinner = async (leagueId, seasonId, weekId) => {
    const jwt = await api.login();
    const teamWeeks = await api.getTeamWeeksForWeek(jwt, { seasonId, weekId });

    const orderedTeamWeeks = _.orderBy(teamWeeks, "score", "desc");

    const promises = orderedTeamWeeks.map(async (tw, ind) => {
        let changed = false;

        if (ind === 0) {
            if (tw.is_bitch !== false || tw.is_winner !== true) {
                tw.is_bitch = false;
                tw.is_winner = true;
                changed = true;
            }
        } else {
            const shouldBeBitch =
                tw.best_possible_score > orderedTeamWeeks[0].score;
            if (
                _.isNull(tw.is_winner) ||
                tw.is_winner !== false ||
                _.isNull(tw.is_bitch) ||
                tw.is_bitch !== shouldBeBitch
            ) {
                tw.is_winner = false;
                tw.is_bitch = shouldBeBitch;
                changed = true;
            }
        }

        if (changed) {
            delete tw.published_at;
            delete tw.created_at;
            delete tw.updated_at;

            return await api.updateTeamWeek(jwt, {
                dbId: tw.id,
                seasonId: tw.season_id,
                weekId: tw.week_id,
                teamId: tw.team_id,
                score: tw.score,
                bestPossibleScore: tw.best_possible_score,
                isWinner: tw.is_winner,
                isBitch: tw.is_bitch,
            });
        }
        return null;
    });

    const tws = await Promise.all(promises);
    return tws;
};

const load = async (leagueId, seasonId, weekId) => {
    await loadTeams(leagueId, seasonId, weekId);
    await loadBoxScores(leagueId, seasonId, weekId);
    await calculateWeekWinner(leagueId, seasonId, weekId - 1);
    return true;
};

export default load;
