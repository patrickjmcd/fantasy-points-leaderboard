import axios from "axios";
import _ from "lodash";

const strapiURL = process.env.REACT_APP_STRAPI_URL;
const strapiUsername = process.env.REACT_APP_STRAPI_USERNAME;
const strapiPassword = process.env.REACT_APP_STRAPI_PASSWORD;

const login = async () => {
    try {
        const { data } = await axios.post(`${strapiURL}/auth/local`, {
            identifier: strapiUsername,
            password: strapiPassword,
        });
        return data.jwt;
    } catch (error) {
        console.error(error);
    }
};

const getConfigData = async (jwt) => {
    try {
        const { data } = await axios.get(`${strapiURL}/configs`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        });
        return data;
    } catch (error) {
        console.error(error);
    }
};

const setConfigData = async (jwt, { leagueId, seasonId, weekId }) => {
    const newConfigData = {
        league_id: leagueId,
        current_season_id: seasonId,
        current_week_id: weekId,
        last_score_update: new Date().toISOString(),
    };
    const configDataExisting = await getConfigData(jwt);
    console.log(configDataExisting);

    if (configDataExisting.length === 0) {
        // no existing config exists
        try {
            const { data } = await axios.post(
                `${strapiURL}/configs`,
                newConfigData,
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                }
            );
            return data;
        } catch (error) {
            console.error(error);
        }
    } else {
        //config already exsits
        try {
            const { data } = await axios.put(
                `${strapiURL}/configs/${configDataExisting[0].id}`,
                newConfigData,
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                }
            );
            return data;
        } catch (error) {
            console.error(error);
        }
    }
};

const getMatchups = async (jwt) => {
    try {
        const { data } = await axios.get(`${strapiURL}/matchups`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        });
        return data;
    } catch (error) {
        console.error(error);
    }
};

const addMatchup = async (
    jwt,
    { weekId, seasonId, homeTeamId, awayTeamId }
) => {
    const matchupData = {
        week_id: weekId,
        season_id: seasonId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
    };

    try {
        const { data } = await axios.post(
            `${strapiURL}/matchups`,
            matchupData,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error(error);
    }
};

const updateMatchup = async (
    jwt,
    { dbId, weekId, seasonId, homeTeamId, awayTeamId }
) => {
    const matchupData = {
        week_id: weekId,
        season_id: seasonId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
    };

    try {
        const { data } = await axios.put(
            `${strapiURL}/matchups/${dbId}`,
            matchupData,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error(error);
    }
};

const getMatchupId = async (
    jwt,
    { weekId, seasonId, awayTeamId, homeTeamId }
) => {
    try {
        const { data } = await axios.get(
            `${strapiURL}/matchups?week_id=${weekId}&season_id=${seasonId}&away_team_id=${awayTeamId}&home_team_id=${homeTeamId}`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        if (data.length > 0) {
            return data[0].id;
        }
        return false;
    } catch (error) {
        console.error(error);
    }
};

const getTeamWeeks = async (jwt) => {
    try {
        const { data } = await axios.get(`${strapiURL}/team-weeks`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        });
        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
    }
};

const addTeamWeek = async (
    jwt,
    { seasonId, weekId, teamId, score, bestPossibleScore }
) => {
    const teamWeekData = {
        week_id: weekId,
        season_id: seasonId,
        team_id: teamId,
        score,
        best_possible_score: bestPossibleScore,
    };

    try {
        const { data } = await axios.post(
            `${strapiURL}/team-weeks`,
            teamWeekData,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error(error);
    }
};

const updateTeamWeek = async (
    jwt,
    {
        dbId,
        seasonId,
        weekId,
        teamId,
        score,
        bestPossibleScore,
        isWinner,
        isBitch,
    }
) => {
    const teamWeekData = {
        week_id: weekId,
        season_id: seasonId,
        team_id: teamId,
        score,
        best_possible_score: bestPossibleScore,
        is_winner: isWinner,
        is_bitch: isBitch,
    };

    try {
        const { data } = await axios.put(
            `${strapiURL}/team-weeks/${dbId}`,
            teamWeekData,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error(error);
    }
};

const getTeamWeekId = async (jwt, { seasonId, weekId, teamId }) => {
    try {
        const { data } = await axios.get(
            `${strapiURL}/team-weeks?week_id=${weekId}&season_id=${seasonId}&team_id=${teamId}`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        if (data.length > 0) {
            return data[0].id;
        }
        return false;
    } catch (error) {
        console.error(error);
    }
};

const getTeamWeeksForWeek = async (jwt, { seasonId, weekId }) => {
    try {
        const { data } = await axios.get(
            `${strapiURL}/team-weeks?week_id=${weekId}&season_id=${seasonId}`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error(error);
    }
};

const getWinners = async (jwt) => {
    try {
        const { data } = await axios.get(
            `${strapiURL}/team-weeks?is_winner=true`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        const teams = await getTeams(jwt);
        const keyedTeams = _.keyBy(teams, "team_id");

        const winners = data.map((tw) => {
            tw.team = keyedTeams[tw.team_id];
            return tw;
        });

        return winners;
    } catch (error) {
        console.error(error);
    }
};

const getTeams = async (jwt) => {
    try {
        const { data } = await axios.get(`${strapiURL}/teams`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        });
        return data;
    } catch (error) {
        console.error(error);
    }
};

const addTeam = async (
    jwt,
    { teamId, abbreviation, name, seasonId, logoURL }
) => {
    const teamData = {
        team_id: teamId,
        abbreviation,
        name,
        season_id: seasonId,
        logoURL: logoURL,
    };

    try {
        const { data } = await axios.post(`${strapiURL}/teams`, teamData, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        });
        return data;
    } catch (error) {
        console.error(error);
    }
};

const updateTeam = async (
    jwt,
    { dbId, teamId, abbreviation, name, seasonId, logoURL }
) => {
    const teamData = {
        team_id: teamId,
        abbreviation,
        name,
        season_id: seasonId,
        logoURL: logoURL,
    };

    try {
        const { data } = await axios.put(
            `${strapiURL}/teams/${dbId}`,
            teamData,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error(error);
    }
};

const getTeamId = async (jwt, teamId) => {
    try {
        const { data } = await axios.get(
            `${strapiURL}/teams?team_id=${teamId}`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            }
        );
        if (data.length > 0) {
            return data[0].id;
        }
        return false;
    } catch (error) {
        console.error(error);
    }
};

const getWeeklyScores = async (jwt, seasonId, weekNum) => {
    const teams = await getTeams(jwt);
    const keyedTeams = _.keyBy(teams, "team_id");

    let teamWeeks = await getTeamWeeksForWeek(jwt, {
        seasonId: seasonId,
        weekId: weekNum,
    });
    teamWeeks = teamWeeks.map((tw) => {
        tw.team = keyedTeams[tw.team_id];
        return tw;
    });
    return { weekId: weekNum, scores: teamWeeks };
};

// const test = async () => {
//     const jwt = await login();
//     const scores = await getWeeklyScores(jwt, 6);
//     console.log(scores);
// };

export const api = {
    login,
    getConfigData,
    setConfigData,
    getTeams,
    getMatchups,
    getTeamWeeks,
    getTeamWeeksForWeek,
    getWinners,
    getWeeklyScores,
    addTeam,
    addMatchup,
    addTeamWeek,
    updateTeam,
    updateMatchup,
    updateTeamWeek,
    getTeamId,
    getMatchupId,
    getTeamWeekId,
};

// export default functions;

// module.exports = functions;
