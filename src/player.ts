export default class Player {
    public _currentScore: number = 0;
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

    public wonSome(tricks: number) {
        this._currentScore += tricks;
    }
}