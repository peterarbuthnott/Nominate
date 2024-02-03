import Player from './player.js';

export default class Game {

    public _rounds: Array<Round> = [];
    public _currentRound: number = 1;
    public _numberOfPlayers: number = 2;
    public _players: Array<Player> = [];


    constructor() {
        // // set up rounds
        for (let rounds: number = 0; rounds < 18; rounds++) {
            this._rounds.push(new Round(rounds + 1));
        }
    }

    setNumberOfPlayers(numberOfPlayers: number) {
        this._numberOfPlayers = numberOfPlayers;
        // set up players
        this._players = [];
        this._players.push(new Player('1', true));
        for (let players: number = 2; players <= numberOfPlayers; players++) {
            this._players.push(new Player(players.toLocaleString(), false));
        }
    }

    moveDealerOn() {
        for (let player: number = 0; player <= this._numberOfPlayers; player++) {
            if (this._players[player]._isDealer) {
                console.log("current dealer = " + this._players[player]._name);
                this._players[player]._isDealer = false;
                if (player === this._numberOfPlayers - 1) {
                    this._players[0]._isDealer = true;
                    console.log("new dealer = " + this._players[0]._name);
                } else {
                    this._players[player + 1]._isDealer = true;
                    console.log("new dealer = " + this._players[player + 1]._name);
                }
                break;
            }
        }
    }

    renderNominated(table: HTMLTableElement) {
        let headerRow = table.insertRow().insertCell();
        headerRow.colSpan = this._numberOfPlayers;
        headerRow.textContent = this.renderGameResults();
        for (let row: number = 0; row < this._rounds.length; row++) {
            let rowData = table.insertRow();
            for (let col: number = 0; col < this._numberOfPlayers; col++) {
                let colData = rowData.insertCell();
                colData.textContent = "x" + col + row + "y"; // this._players[row].Player; //.[col];
            }
        }
    }

    renderGameResults() {
        return "round:" + this._currentRound + " total players = " + this._players.length;
    }
}

class Round {
    private _roundNumber: number = 0;
    public _trumpSuit: string = "no"
    private _trumpSuits: string[] = ["clubs ♣", "diamonds ♦", "hearts ♥", "spades ♠"];
    public _isRedSuit: boolean = false;
    private _redSuits: boolean[] = [false, true, true, false];
    private _tricks: number = 0;
    public _isMiss: boolean = false;
    public _isBlind: boolean = false;

    constructor(roundNumber: number) {
        this._roundNumber = roundNumber;
        if (this._roundNumber <= 7) {
            this._tricks = roundNumber;
            this._trumpSuit = this._trumpSuits[(roundNumber < 5 ? roundNumber - 1 : roundNumber - 5)];
            this._isRedSuit = this._redSuits[(roundNumber < 5 ? roundNumber - 1 : roundNumber - 5)];
        } else if (this._roundNumber > 7 && this._roundNumber < 12) {
            if (this._roundNumber == 8 || this._roundNumber == 10) {
                this._trumpSuit = this._trumpSuits[(roundNumber < 9 ? roundNumber - 5 : roundNumber - 10)];
                this._isRedSuit = this._redSuits[(roundNumber < 9 ? roundNumber - 5 : roundNumber - 10)];
            }
            if (this._roundNumber > 9) {
                this._isBlind = true;
            }
            this._isMiss = true;
            this._tricks = 0;
        } else {
            this._tricks = (19 - this._roundNumber);
            this._isBlind = false;
            this._trumpSuit = this._trumpSuits[(roundNumber < 15 ? roundNumber - 11 : roundNumber - 15)];
            this._isRedSuit = this._redSuits[(roundNumber < 15 ? roundNumber - 11 : roundNumber - 15)];
        }
    }

    get roundNumber(): number {
        return this._roundNumber;
    }

    set roundNumber(value: number) {
        this._roundNumber = value;
    }

    get isBlind(): boolean {
        return this._isBlind;
    }

    set isBlind(value: boolean) {
        this._isBlind = value;
    }

    get isMiss(): boolean {
        return this._isMiss;
    }

    set isMiss(value: boolean) {
        this._isMiss = value;
    }

    get tricks(): number {
        return this._tricks;
    }

    set tricks(value: number) {
        this._tricks = value;
    }
}

