import { Headers, RequestOptions } from '@angular/http';
import 'rxjs/Rx';
import { Subject } from 'rxjs/Rx';
import { Page } from './page.model';
import { FileUploader } from 'ng2-file-upload';
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
    GenericApi.prototype.post = function (data, field, hack) {
        var options = new RequestOptions({
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
            if (hack) {
                return hack(dataModel.data);
            }
            return dataModel.data;
        });
    };
    GenericApi.prototype.bulk = function (models, path, hack) {
        var _this = this;
        var options = new RequestOptions({
            headers: this.getHeaders()
        });
        return this.http
            .post(this.apiUrl(path || 'bulk'), JSON.stringify({ items: models }), options)
            .map(function (response) { return _this.extractPage(response, hack); });
    };
    GenericApi.prototype.upload = function (file, path, query) {
        var params = new URLSearchParams();
        for (var key in query) {
            if (query[key]) {
                params.set(key, query[key]);
            }
        }
        var queryString = params.toString();
        var url = queryString ? this.apiUrl(path) + "?" + queryString : this.apiUrl(path);
        var headers = [];
        this.getHeaders().forEach(function (values, name) {
            if (name === 'Content-Type') {
                return;
            }
            values.forEach(function (value) {
                headers.push({
                    name: name,
                    value: value
                });
            });
        });
        var uploader = new FileUploader({
            url: url,
            headers: headers,
            autoUpload: true
        });
        uploader.onBeforeUploadItem = function (item) {
            item.withCredentials = false;
        };
        var subject = new Subject();
        uploader.onErrorItem = function (item, response, status) {
            subject.error(new Error('failed'));
        };
        uploader.onCompleteItem = function (item, response, status) {
            var dataModel = JSON.parse(response);
            var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel['IsSuccess'];
            if (!isSuccess) {
                if (status === 200) {
                    subject.error(dataModel.code || dataModel.message || 'failed');
                }
                else {
                    subject.error('' + status);
                }
            }
            else {
                subject.next(dataModel.data);
            }
        };
        uploader.addToQueue([file]);
        return subject.asObservable();
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