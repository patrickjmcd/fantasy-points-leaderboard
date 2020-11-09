import React from "react";
import _ from "lodash";

const Leaderboard = (props) => {
    // props = { weekId, scoreTable }
    const orderedWeekTable = _.orderBy(props.leaderboard, "week_id");
    if (orderedWeekTable.length === 0) {
        return <p>No winners loaded yet...</p>;
    }

    const tableBody = orderedWeekTable.map((scoreRow, i) => {
        return (
            <tr key={"leaderboard-" + i}>
                <td>{scoreRow.week_id}</td>
                <td>{scoreRow.team.name}</td>
                <td>{scoreRow.score}</td>
                <td>{scoreRow.best_possible_score}</td>
            </tr>
        );
    });

    return (
        <div className="LeaderBoard-{props.weekId}">
            <table className="uk-table uk-table-striped">
                <thead>
                    <tr>
                        <th>Week</th>
                        <th>Team Name</th>
                        <th>Actual Score</th>
                        <th>Best Possible Score</th>
                    </tr>
                </thead>
                <tbody>{tableBody}</tbody>
            </table>
        </div>
    );
};

export default Leaderboard;
