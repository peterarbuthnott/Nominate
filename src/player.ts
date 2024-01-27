export default class Player {
    public _currentScore: number = 0;
    public _isDealer: boolean = false;
    public _playerRoundScores: Array<PlayerRoundScore> = [];
    private _name: string = "unknown player";

    constructor(name: string, isDealer: boolean) {
        this._name = name;
        this._isDealer = isDealer;
        for (let rounds: number = 0; rounds < 18; rounds++) {
            this._playerRoundScores.push(new PlayerRoundScore());
        }
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    public getCurrentScore() {
        return this._currentScore;
    }
}

class PlayerRoundScore {
    public _tricksNominated: number = 0;
    public _tricksWon: number = 0;
    public _score: number = 0;
    public _madeBid: boolean = false;

    constructor() {
    }
}