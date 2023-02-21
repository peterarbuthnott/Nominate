<script lang="ts">
    import {loop} from 'svelte/internal';
    import Game from './game.ts';

    export let name: string;

    let theGame: Game = new Game();
    let numberOfPlayers: number;
    let gameState: number = 0;

    function setNumberOfPlayers(numberOfPlayers: number): void {
        console.log("set number" + numberOfPlayers);
        theGame.setNumberOfPlayers(numberOfPlayers);
        gameState++;
    }

    function nameThisPlayer(playerNum: number, playerName: string): void {
        theGame._players[playerNum].name = playerName;
    }

    function namingIsDone(): void {
        console.log("naming done?");
        gameState++;
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
                <td>tricks</td>
                {#each theGame._players as p}
                    <td colspan="3">{p.name}</td>
                {/each}
            </tr>
            {#each theGame._rounds as r}
                <tr>
                    <td>{r.roundNumber}</td>
                    <td>{r._trumpSuit}</td>
                    <td>{r.isBlind}</td>
                    <td>{r.tricks}</td>
                    {#each theGame._players as p}
                        <td class="edge">nominated</td>
                        <td>result</td>
                        <td>score</td>
                    {/each}
                </tr>
            {/each}
            <tr>
                <td colspan="4" class="totes">Score</td>
                {#each theGame._players as p}
                    <td colspan="3" class="totes">totes</td>
                {/each}
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

    td {
        border: 1px solid lightgray;
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