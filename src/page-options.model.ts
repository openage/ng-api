export class PageOptions {
    public offset = 0;
    public limit = 10;
    public noPaging = false;

    constructor(obj?: any) {
        if (!obj) { return; }
        if (obj.offset) { this.offset = obj.offset; }
        if (obj.limit) { this.limit = obj.limit; }
        if (obj.noPaging) { this.noPaging = obj.noPaging; }
    }
}
