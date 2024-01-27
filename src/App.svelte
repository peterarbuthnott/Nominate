<script lang="ts">
    import Game from './game';

    export let name: string;

    let theGame: Game = new Game();
    let numberOfPlayers: number;
    let gameState: number = 0;
    let roundState: number = 0;

    let setNumberOfPlayers = (numberOfPlayers: number): void => {
        console.log("set number" + numberOfPlayers);
        theGame.setNumberOfPlayers(numberOfPlayers);
        gameState++;
    }

    let nameThisPlayer = (playerNum: number, playerName: string): void => {
        theGame._players[playerNum].name = playerName;
    }

    let namingIsDone = (): void => {
        console.log("naming done?");
        gameState++;
    }

    let isCurrentRound = (round: Number): boolean => {
        return theGame._currentRound == round;
    }

    let biddingIsDone = (): void => {
        console.log("bidding done?");
        roundState++;
    }

    let trickingIsDone = (): void => {
        console.log("tricking done?");
        for (let scoredPlayers:number = 0; scoredPlayers < theGame._numberOfPlayers; scoredPlayers++) {
            let tempPRS = theGame._players[scoredPlayers]._playerRoundScores[theGame._currentRound];
            if (tempPRS._tricksWon == tempPRS._tricksNominated) {
                tempPRS._madeBid = true;
                tempPRS._score = 10 + tempPRS._tricksNominated;
            } else {
                tempPRS._score = tempPRS._tricksWon;
            }
        }
        theGame._currentRound++;
        roundState = 0;
    }
</script>

<main>
    <h1>Welcome to {name}!</h1>
    {#if gameState === 0}
        <h2>How many players?</h2>
        <select bind:value={numberOfPlayers} on:change="{() => setNumberOfPlayers(numberOfPlayers)}">
            <option value="">Pick one!</option>
            {#each Array(3) as _, index (index)}
                <option value={index+2}>{index + 2}</option>
            {/each}
        </select>
    {/if}
    {#if gameState === 1}
        <h2>Names For Them Players?</h2>
        {#each theGame._players as p, index(index)}
            Player {index + 1} <input type="text" bind:value={p.name}
                                      on:change={() => nameThisPlayer(index, p.name)}><br/>
        {/each}
        <button on:click={() => namingIsDone()}>Done Naming</button>
    {/if}
    {#if gameState === 2}
        <table id="resultsTable">
            <tr>
                <td>round</td>
                <td>trumps</td>
                <td>blind?</td>
                <td>miss?</td>
                <td>tricks</td>
                {#each theGame._players as p}
                    <td colspan="3">{p.name}</td>
                {/each}
                <td>Actions ...</td>
            </tr>
            {#each theGame._rounds as r}
                <tr class:isCurrent={isCurrentRound(r.roundNumber)}>
                    <td>{r.roundNumber}</td>
                    <td>{r._trumpSuit}</td>
                    <td>{r.isBlind}</td>
                    <td>{r.isMiss}</td>
                    <td>{r.tricks}</td>
                    {#each theGame._players as p}
                        {#if r.roundNumber < theGame._currentRound}
                            <td class="edge entered">{p._playerRoundScores[r.roundNumber]._tricksNominated}</td>
                            <td class="edge entered">{p._playerRoundScores[r.roundNumber]._tricksWon}</td>
                            <td class="edge entered">{p._playerRoundScores[r.roundNumber]._score}</td>
                        {:else if isCurrentRound(r.roundNumber)}
                            {#if roundState === 0}
                                <td class="edge results">
                                    <select bind:value={p._playerRoundScores[r.roundNumber]._tricksNominated}>
                                        <option value="">Bid?</option>
                                        {#each Array(r.tricks + 1) as _, index (index)}
                                            <option value={index}>{index}</option>
                                        {/each}
                                    </select>
                                </td>
                                <td class="results">got</td>
                                <td class="results">score</td>
                            {:else if roundState === 1}
                                <td class="edge entered">{p._playerRoundScores[r.roundNumber]._tricksNominated}</td>
                                <td class="edge results">
                                    <select bind:value={p._playerRoundScores[r.roundNumber]._tricksWon}>
                                        <option value="">Got?</option>
                                        {#each Array(r.tricks + 1) as _, index (index)}
                                            <option value={index}>{index}</option>
                                        {/each}
                                    </select>
                                </td>
                                <td class="results">score</td>
                            {/if}
                        {:else}
                            <td class="results">bid</td>
                            <td class="results">got</td>
                            <td class="results">score</td>
                        {/if}
                    {/each}

                    {#if isCurrentRound(r.roundNumber)}
                        <td class="actions">
                            {#if roundState === 0}
                                <button on:click={() => biddingIsDone()}>Bidding Done</button>
                            {:else if roundState === 1}
                                <button on:click={() => trickingIsDone()}>Tricking Done</button>
                            {/if}
                        </td>
                    {:else}
                        <td>&nbsp;</td>
                    {/if}
                </tr>
            {/each}
            <tr>
                <td colspan="5" class="totes">Score</td>
                {#each theGame._players as p}
                    <td colspan="3" class="totes">{p.getCurrentScore()}</td>
                {/each}
                <td>&nbsp;</td>
            </tr>
        </table>
    {/if}
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
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
        font-size: 20px;
    }

    td {
        border-bottom: 1px solid lightgray;
    }

    td.results {
        color: lightgray;
        font-size: 10px;
    }

    td.entered {
        color: black;
        font-size: 10px;
    }

    td.edge {
        border-left: 1px solid #ff3e00;
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