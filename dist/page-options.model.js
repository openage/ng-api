var PageOptions = /** @class */ (function () {
    function PageOptions(obj) {
        this.noPaging = false;
        if (!obj) {
            return;
        }
        if (obj.limit) {
            this.limit = obj.limit;
            this.offset = obj.offset || 0;
            this.noPaging = false;
        }
        if (obj.noPaging !== undefined) {
            this.noPaging = obj.noPaging;
        }
    }
    return PageOptions;
}());
export { PageOptions };
//# sourceMappingURL=../src/dist/page-options.model.js.map