export class PageOptions {
    public offset: number;
    public limit: number;
    public sort: string;
    public desc: boolean
    public noPaging = false;

    constructor(obj?: any) {
        if (!obj) { return; }
        if (obj.limit) {
            this.limit = obj.limit;
            this.offset = obj.offset || 0;
            this.noPaging = false;
        }

        this.sort = obj.sort;
        this.desc = obj.desc;

        if (obj.noPaging !== undefined) { this.noPaging = obj.noPaging; }
    }
}
