import React from "react";
import _ from "lodash";

const WeekTable = (props) => {
    // props = { weekId, scoreTable }
    const actualScoreTable = _.orderBy(props.scoreTable, "score").reverse();
    if (actualScoreTable.length === 0) {
        return <p>No scores loaded yet...</p>;
    }

    const tableBody = actualScoreTable.map((scoreRow, i) => {
        let rowStyle = {};
        if (scoreRow.is_bitch) {
            rowStyle = { color: "red" };
        } else if (scoreRow.is_winner) {
            rowStyle = { fontWeight: "bold" };
        }

        const bitchLabel = scoreRow.is_bitch ? "BITCH" : "     ";
        return (
            <tr key={"week-" + i} style={rowStyle}>
                <td>{i + 1}</td>
                <td>{scoreRow.team.name}</td>
                <td>{scoreRow.score}</td>
                <td>{scoreRow.best_possible_score}</td>
                <td>{bitchLabel}</td>
            </tr>
        );
    });

    return (
        <div className="WeekTable-{props.weekId}">
            <table className="uk-table uk-table-striped">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team Name</th>
                        <th>Actual Score</th>
                        <th>Best Possible Score</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>{tableBody}</tbody>
            </table>
        </div>
    );
};

export default WeekTable;
