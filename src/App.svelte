<script lang="ts">
    import Game from './game.ts';

    export let name: string;

    let theGame: Game = new Game();
    let numberOfPlayers: number;
    let gameState: number = 0;

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
        console.log * ("current round" + theGame._currentRound);
        return theGame._currentRound == round;
    }

    // show 'board'
    // for each round () {
    //   for each player (> dealer) {
    //     get bid
    //   }
    //   await completion
    //   for each player() {
    //     made bid?
    //   }
    //   move dealer
    // }
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
    {#if (gameState === 1)}
        <h2>Names For Them Players?</h2>
        {#each theGame._players as p, index(index)}
            Player {index + 1} <input type="text" bind:value={p.name}
                                      on:change={() => nameThisPlayer(index, p.name)}><br/>
        {/each}
        <button on:click={() => namingIsDone()}>Done Naming</button>
    {/if}
    {#if (gameState === 2)}
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
                        {#if isCurrentRound(r.roundNumber)}
                            <td class="edge results">
                                <select bind:value={p.makeBid} on:change="{() => p.makeBid()}">
                                    <option value="">Pick Their Bid!</option>
                                    {#each Array(r.tricks + 1) as _, index (index)}
                                        <option value={index}>{index}</option>
                                    {/each}
                                </select>
                            </td>
                        {:else}
                            <td class="edge results">nominated</td>
                        {/if}
                        <td class="results">result</td>
                        <td class="results">score</td>
                    {/each}
                    {#if isCurrentRound(r.roundNumber)}
                        <td class="actions">
                            <button on:click={() => namingIsDone()}>Bidding Done</button>
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