<script lang="ts">
    import Game from './game';

    export let name: string;

    let theGame: Game = new Game();
    let numberOfPlayers: number;
    let gameState: number = 0;
    let roundState: number = 0;

    let setNumberOfPlayers = (numberOfPlayers: number): void => {
        console.log("set number of players =" + numberOfPlayers);
        theGame.setNumberOfPlayers(numberOfPlayers);
        gameState++;
    }

    let nameThisPlayer = (playerNum: number, playerName: string): void => {
        theGame._players[playerNum].name = playerName;
    }

    let namingIsDone = (): void => {
        console.log("naming done");
        gameState++;
    }

    let isCurrentRound = (round: Number): boolean => {
        return theGame._currentRound == round;
    }

    let biddingIsDone = (): void => {
        console.log("bidding done");
        let totalBids: number = 0;
        let dealerName: string = "";
        for (let scoredPlayers: number = 0; scoredPlayers < theGame._numberOfPlayers; scoredPlayers++) {
            totalBids += theGame._players[scoredPlayers]._playerRoundScores[theGame._currentRound]._tricksNominated;
            if (theGame._players[scoredPlayers]._isDealer) dealerName = theGame._players[scoredPlayers]._name;
        }
        console.log("totalBids=" + totalBids + " tricks=" + theGame._rounds[theGame._currentRound - 1].tricks);
        if (totalBids === theGame._rounds[theGame._currentRound - 1].tricks) {
            alert("The total bids can't equal the number of tricks - the Dealer [" + dealerName
                + "] needs to change their bid?");
        } else {
            roundState++;
        }
    }

    let trickingIsDone = (): void => {
        console.log("tricking done");
        let totalTricksWon: number = 0;
        let totalTricksAvailable: number = 7;
        for (let scoredPlayers: number = 0; scoredPlayers < theGame._numberOfPlayers; scoredPlayers++) {
            totalTricksWon += theGame._players[scoredPlayers]._playerRoundScores[theGame._currentRound]._tricksWon;
        }
        if (!theGame._rounds[theGame._currentRound - 1].isMiss) {
            totalTricksAvailable = theGame._rounds[theGame._currentRound - 1].tricks;
        }
        console.log("totalTricksWon=" + totalTricksWon + " tricks=" + totalTricksAvailable);

        if (totalTricksWon !== totalTricksAvailable) {
            alert("The total tricks won [" + totalTricksWon + "] must equal the number of tricks available [" +
                totalTricksAvailable + "]- please update?");
        } else {

            for (let scoredPlayers: number = 0; scoredPlayers < theGame._numberOfPlayers; scoredPlayers++) {
                let tempPRS = theGame._players[scoredPlayers]._playerRoundScores[theGame._currentRound];
                if (theGame._rounds[theGame._currentRound - 1].isMiss) {
                    tempPRS._score = -3 * tempPRS._tricksWon;
                    tempPRS._madeBid = (tempPRS._tricksWon === 0);
                } else {
                    if (tempPRS._tricksWon === tempPRS._tricksNominated) {
                        tempPRS._madeBid = true;
                        tempPRS._score = 10 + tempPRS._tricksNominated;
                    } else {
                        tempPRS._score = tempPRS._tricksWon;
                    }
                }
                theGame._players[scoredPlayers]._currentScore += tempPRS._score;
                if (tempPRS._madeBid) theGame._players[scoredPlayers]._madeBids += 1;
            }
            theGame._currentRound++;
            console.log("the next round is " + theGame._currentRound);
            if (theGame._currentRound > 18) {
                gameState++;
            } else {
                theGame.moveDealerOn();
                roundState = 0;
                if (theGame._rounds[theGame._currentRound - 1].isMiss) roundState++;
            }
        }
    }
</script>

<main>
    <h1>Welcome to {name}!</h1>
    {#if gameState === 0}
        <h2>How many players?</h2>
        <select bind:value={numberOfPlayers} on:change="{() => setNumberOfPlayers(numberOfPlayers)}">
            <option value="">Pick one!</option>
            {#each Array(6) as _, index (index)}
                <option value={index+2}>{index + 2}</option>
            {/each}
        </select>
    {/if}
    {#if gameState === 1}
        <h2>Names them players!</h2>
        {#each theGame._players as p, index(index)}
            Player {index + 1} <input type="text" bind:value={p.name}
                                      on:change={() => nameThisPlayer(index, p.name)}><br/>
        {/each}
        <button on:click={() => namingIsDone()}>Done Naming &gt;&gt;</button>
    {/if}
    {#if gameState === 2}
        <h2>Scoring!</h2>
        <table>
            <thead>
            <tr>
                <th>round</th>
                <th>&nbsp;</th>
                <th>&nbsp;</th>
                <th>trumps</th>
                <th>tricks</th>
                {#each theGame._players as p}
                    <td colspan="3">{p.name}</td>
                {/each}
                <th>Actions ...</th>
            </tr>
            </thead>
            <tbody>
            {#each theGame._rounds as r}
                <tr class:isCurrent={isCurrentRound(r.roundNumber)}
                    class:isMiss={r.isMiss} class:isBlind={r.isBlind}>
                    <td>{r.roundNumber}</td>
                    <td>{r.isBlind ? "blind" : ""}</td>
                    <td>{r.isMiss ? "miss" : ""}</td>
                    <td class="totes" class:redSuit={r._isRedSuit}>{r._trumpSuit === "no" ? "" : r._trumpSuit}</td>
                    <td>{r.tricks}</td>
                    {#each theGame._players as p}
                        {#if r.roundNumber < theGame._currentRound}
                            <td class="edge entered"
                                title="bid">{p._playerRoundScores[r.roundNumber]._tricksNominated}</td>
                            <td class="edge entered" title="got">{p._playerRoundScores[r.roundNumber]._tricksWon}</td>
                            <td class="edge entered" class:madeBid={p._playerRoundScores[r.roundNumber]._madeBid}
                                title="score">{p._playerRoundScores[r.roundNumber]._score}</td>
                        {:else if isCurrentRound(r.roundNumber)}
                            {#if roundState === 0}
                                <td class="edge results" class:dealer={p._isDealer} title="bid">
                                    <select bind:value={p._playerRoundScores[r.roundNumber]._tricksNominated}
                                            title="bid">
                                        {#each Array(r.tricks + 1) as _, index (index)}
                                            <option value={index}>{index}</option>
                                        {/each}
                                    </select>
                                </td>
                                <td class="results" class:dealer={p._isDealer}>got</td>
                            {:else if roundState === 1}
                                <td class="edge entered" class:dealer={p._isDealer}
                                    title="bid">{p._playerRoundScores[r.roundNumber]._tricksNominated}</td>
                                <td class="edge results" class:dealer={p._isDealer} title="got">
                                    <select bind:value={p._playerRoundScores[r.roundNumber]._tricksWon} title="got">
                                        {#each Array((r.isMiss ? 8 : r.tricks + 1)) as _, index (index)}
                                            <option value={index}>{index}</option>
                                        {/each}
                                    </select>
                                </td>
                            {/if}
                            <td class="results">score</td>
                        {:else}
                            <td class="results">bid</td>
                            <td class="results">got</td>
                            <td class="results">score</td>
                        {/if}
                    {/each}

                    {#if isCurrentRound(r.roundNumber)}
                        <td class="actions">
                            {#if roundState === 0}
                                <button on:click={() => biddingIsDone()}>Bidding Done &gt;&gt;</button>
                            {:else if roundState === 1}
                                <button on:click={() => trickingIsDone()}>Tricking Done &gt;&gt;</button>
                            {/if}
                        </td>
                    {:else}
                        <td>&nbsp;</td>
                    {/if}
                </tr>
            {/each}
            </tbody>
            <tfoot>
            <tr>
                <td colspan="5" class="totes">Score</td>
                {#each theGame._players as p}
                    <td colspan="2" class="results totes" title="bids made">{p.getMadeBids()}</td>
                    <td class="totes" title="score">{p.getCurrentScore()}</td>
                {/each}
                <td>&nbsp;</td>
            </tr>
            </tfoot>
        </table>
    {/if}
    {#if gameState === 3}
        <h2>Results!</h2>
        <table>
            <thead>
            <tr>
                <th>Name</th>
                <th>Made</th>
                <th>Final Score</th>
            </tr>
            </thead>
            <tbody>
            {#each theGame._players as p}
                <tr>
                    <td>{p.name}</td>
                    <td class="totes results" title="made bids (out of 18 possible)">{p.getMadeBids()}</td>
                    <td class="totes" title="final score">{p.getCurrentScore()}</td>
                </tr>
            {/each}
            </tbody>
        </table>
    {/if}
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        margin: 0 auto;
    }

    button {
        background: red;
        border: 1px solid darkred;
        border-radius: 6px;
        box-shadow: rgba(0, 0, 0, 0.1) 1px 2px 4px;
        box-sizing: border-box;
        color: white;
        cursor: pointer;
        display: inline-block;
        font-size: 16px;
        line-height: 16px;
        min-height: 40px;
        outline: 0;
        padding: 12px 14px;
        text-align: center;
        text-rendering: geometricprecision;
        text-transform: none;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        vertical-align: middle;
    }

    button:hover,
    button:active {
        background-color: initial;
        background-position: 0 0;
        color: #FF4742;
    }

    button:active {
        background-color: white;
    }

    table {
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    tr.isCurrent {
        background-color: lightgreen;
    }

    tr.isMiss {
        background-color: lightpink;
    }

    tr.isBlind {
        background-color: darksalmon;
    }

    td {
        border-bottom: 1px solid lightslategray;
        min-width: 40px;
    }

    td.redSuit {
        color: red;
    }

    td.actions {
        background-color: white;
        padding-top: 8px;
    }

    td.results {
        font-size: 10px;
    }

    td.entered {
        color: black;
        font-size: 10px;
    }

    td.edge {
        border-left: 1px solid #ff3e00;
    }

    td select {
        width: 40px;
    }

    td.dealer {
        background-color: green;
    }

    td.madeBid {
        background-color: aquamarine;
    }

    td.totes {
        text-align: right;
        font-weight: bold;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>