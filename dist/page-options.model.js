var PageOptions = /** @class */ (function () {
    function PageOptions(obj) {
        this.offset = 0;
        this.limit = 10;
        this.noPaging = false;
        if (!obj) {
            return;
        }
        if (obj.offset) {
            this.offset = obj.offset;
        }
        if (obj.limit) {
            this.limit = obj.limit;
        }
        if (obj.noPaging) {
            this.noPaging = obj.noPaging;
        }
    }
    return PageOptions;
}());
export { PageOptions };
//# sourceMappingURL=page-options.model.js.map