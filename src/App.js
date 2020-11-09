import React, { useState, useEffect } from "react";
import "./App.css";
import data from "./data/index.mjs";
import load from "./data/dataLoad.mjs";
import WeekTable from "./WeekTable";
import Leaderboard from "./Leaderboard";

//create your forceUpdate hook
function useForceUpdate() {
    const [, forceUpdate] = React.useState();

    return React.useCallback(() => {
        forceUpdate((s) => !s);
    }, []);
}

const App = () => {
    const [jwt, setJwt] = useState("");
    const [scores, setScores] = useState();
    const [currentWeek, setCurrentWeek] = useState();
    const [currentSeasonId, setCurrentSeasonId] = useState();
    const [leagueId, setLeagueId] = useState();
    const [loading, setLoading] = useState(true);
    const [winners, setWinners] = useState([]);

    const forceUpdate = useForceUpdate();

    useEffect(() => {
        const fetchData = async () => {
            const fetchedJwt = await data.api.login();
            setJwt(fetchedJwt);

            const fetchedConfig = await data.api.getConfigData(fetchedJwt);
            const currentConfig = fetchedConfig[0];
            setCurrentWeek(currentConfig.current_week_id);
            setCurrentSeasonId(currentConfig.current_season_id);
            setLeagueId(currentConfig.league_id);

            const allScores = [];
            for (let i = 1; i <= currentConfig.current_week_id; i++) {
                const scoreWeek = await data.api.getWeeklyScores(
                    fetchedJwt,
                    currentConfig.current_season_id,
                    i
                );
                allScores.push(scoreWeek);
            }
            setScores(allScores.reverse());

            const fetchedWinners = await data.api.getWinners(fetchedJwt);
            setWinners(fetchedWinners);

            setLoading(false);
        };
        fetchData();
    }, []);

    let scoresTables = <div>Loading scores...</div>;

    if (scores) {
        scoresTables = scores.map((s) => {
            return (
                <div key={s.weekId}>
                    <h2>Week {s.weekId}</h2>
                    <WeekTable weekId={s.weekId} scoreTable={s.scores} />
                </div>
            );
        });
    }

    const buttonText = loading ? "Loading scores..." : "Update Scores";

    return (
        <div className="App uk-container">
            <h1 className="uk-h1">Winners</h1>
            <Leaderboard leaderboard={winners} />
            <hr className="uk-divider-icon" />
            <h1 className="uk-h1">Weekly Score Leaderboard</h1>
            {scoresTables}
            <hr className="uk-divider-icon" />
            <h3 className="uk-h3">For updating scores only, dont touch</h3>
            <div>
                <div className="uk-margin">
                    <div uk-form-custom="target: true">
                        <input
                            className="uk-input uk-form-width-medium"
                            type="text"
                            value={currentWeek}
                            onChange={(e) => {
                                setCurrentWeek(e.target.value);
                            }}
                        />
                    </div>
                    <button
                        className="uk-button uk-button-primary"
                        onClick={async () => {
                            console.log({
                                leagueId,
                                currentSeasonId,
                                currentWeek,
                            });
                            if (currentWeek > 0 && currentWeek < 20) {
                                setLoading(true);
                                await data.api.setConfigData(jwt, {
                                    leagueId,
                                    seasonId: currentSeasonId,
                                    weekId: currentWeek,
                                });
                                await load(
                                    leagueId,
                                    currentSeasonId,
                                    currentWeek
                                );
                                setLoading(false);
                                forceUpdate();
                            } else {
                                console.log("NO WEEK SPECIFIED");
                            }
                        }}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
