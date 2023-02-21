export default class Player {
    public _currentScore: number = 0;
    public _currentBid: number = 0;
    public _madeBids: number = 0;
    public _isDealer: boolean = false;
    private _name: string = "unknown player";

    constructor(name: string, isDealer: boolean) {
        this._name = name;
        this._isDealer = isDealer;
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

    public makeBid(tricks: number) {
        this._currentBid = tricks;
    }

    public madeBid() {
        this._madeBids++;
        this._currentScore += 10 + this._currentBid;
    }

    public wonSome(tricks: number) {
        this._currentScore += tricks;
    }
}