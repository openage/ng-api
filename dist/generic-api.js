import { Headers, RequestOptions } from '@angular/http';
import 'rxjs/Rx';
import { Page } from './page.model';
var GenericApi = /** @class */ (function () {
    function GenericApi(url, key, http, headers, extension) {
        this.url = url;
        this.key = key;
        this.http = http;
        this.headers = headers;
        this.extension = extension;
    }
    GenericApi.prototype.get = function (id, hack) {
        var _this = this;
        var url = this.apiUrl(id);
        var options = { headers: this.getHeaders() };
        return this.http
            .get(url, options)
            .map(function (response) { return _this.extractModel(response, hack); });
    };
    GenericApi.prototype.search = function (query, options, hack) {
        var _this = this;
        return this.http
            .get(this.getSearchUrl(query, options), { headers: this.getHeaders() })
            .map(function (response) { return _this.extractPage(response, hack); });
    };
    GenericApi.prototype.create = function (model, hack) {
        var _this = this;
        var options = new RequestOptions({
            headers: this.getHeaders()
        });
        return this.http
            .post(this.apiUrl(), JSON.stringify(model), options)
            .map(function (response) { return _this.extractModel(response, hack); });
    };
    GenericApi.prototype.update = function (id, model, hack) {
        var _this = this;
        return this.http
            .put(this.apiUrl(id), JSON.stringify(model), { headers: this.getHeaders() })
            .map(function (response) { return _this.extractModel(response, hack); });
    };
    GenericApi.prototype.remove = function (id) {
        return this.http.delete(this.apiUrl(id), { headers: this.getHeaders() })
            .map(function (response) {
            if (response.status !== 200) {
                throw new Error('This request has failed ' + response.status);
            }
            var dataModel = response.json().data;
            var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel['IsSuccess'];
            if (!isSuccess) {
                if (response.status === 200) {
                    throw new Error(dataModel.code || dataModel.message || 'failed');
                }
                else {
                    throw new Error(response.status + '');
                }
            }
        });
    };
    GenericApi.prototype.post = function (field, data, requestOptions) {
        var options = requestOptions || new RequestOptions({
            headers: this.getHeaders()
        });
        return this.http
            .post(this.apiUrl(field), JSON.stringify(data), options)
            .map(function (responseData) {
            if (responseData.status !== 200) {
                throw new Error('This request has failed ' + responseData.status);
            }
            var dataModel = responseData.json();
            var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel['IsSuccess'];
            if (!isSuccess) {
                if (responseData.status === 200) {
                    throw new Error(dataModel.code || dataModel.message || 'failed');
                }
                else {
                    throw new Error(responseData.status);
                }
            }
            return dataModel.data;
        });
    };
    GenericApi.prototype.getHeaders = function () {
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        if (this.headers && this.headers.length > 0) {
            this.headers.forEach(function (item) {
                var value;
                if (item.value) {
                    switch (typeof item.value) {
                        case 'string':
                            value = item.value;
                            break;
                        case 'function':
                            value = item.value();
                            break;
                        default:
                            value = JSON.stringify(item.value);
                            break;
                    }
                }
                else {
                    value = localStorage.getItem(item.key);
                }
                if (value) {
                    headers.append(item.key, value + '');
                }
            });
        }
        return headers;
    };
    GenericApi.prototype.apiUrl = function (field) {
        var key;
        switch (typeof this.key) {
            case 'string':
                key = this.key;
                break;
            case 'function':
                key = this.key();
                break;
            default:
                key = JSON.stringify(this.key);
                break;
        }
        var root = this.url + "/" + key;
        if (field) {
            return this.extension ? root + "/" + field + this.extension : root + "/" + field;
        }
        else {
            return this.extension ? "" + root + this.extension : "" + root;
        }
    };
    GenericApi.prototype.getSearchUrl = function (query, options) {
        var params = new URLSearchParams();
        // tslint:disable-next-line:prefer-const
        for (var key in query) {
            if (query[key]) {
                params.set(key, query[key]);
            }
        }
        var queryString = params.toString();
        var url = queryString ? this.apiUrl() + "?" + queryString : this.apiUrl();
        return url;
    };
    GenericApi.prototype.extractModel = function (responseData, hack) {
        if (responseData.status !== 200) {
            throw new Error('This request has failed ' + responseData.status);
        }
        var dataModel = responseData.json();
        var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel['IsSuccess'];
        if (!isSuccess) {
            if (responseData.status === 200) {
                throw new Error(dataModel.code || dataModel.message || 'failed');
            }
            else {
                throw new Error(responseData.status);
            }
        }
        return hack ? hack(dataModel.data) : dataModel.data;
    };
    GenericApi.prototype.extractPage = function (responseData, hack) {
        if (responseData.status !== 200) {
            throw new Error('This request has failed ' + responseData.status);
        }
        var dataModel = responseData.json();
        var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel['IsSuccess'];
        if (!isSuccess) {
            if (responseData.status === 200) {
                throw new Error(dataModel.code || dataModel.message || 'failed');
            }
            else {
                throw new Error(responseData.status + '');
            }
        }
        var data = dataModel['data'] || dataModel;
        var items = [];
        data.items.forEach(function (item) {
            items.push(hack ? hack(item) : item);
        });
        var page = new Page();
        page.pageNo = data.pageNo;
        page.pageSize = data.pageSize;
        page.total = data.total;
        page.stats = data.stats;
        page.items = items;
        return page;
    };
    return GenericApi;
}());
export { GenericApi };
//# sourceMappingURL=generic-api.js.map