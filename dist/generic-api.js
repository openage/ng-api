import { HttpHeaders } from '@angular/common/http';
import { FileUploader } from 'ng2-file-upload';
import { Subject, timer } from 'rxjs';
import { PageOptions } from './page-options.model';
import { Page } from './page.model';
import moment from 'moment';
var GenericApi = /** @class */ (function () {
    function GenericApi(http, url, options) {
        this.http = http;
        this.url = url;
        this.options = options;
        this._createSubject = new Subject();
        this._removeSubject = new Subject();
        this._postSubject = new Subject();
        this._bulkSubject = new Subject();
        this._uploadSubject = new Subject();
        this.afterCreate = this._createSubject.asObservable();
        this.afterRemove = this._removeSubject.asObservable();
        this.afterPost = this._postSubject.asObservable();
        this.afterBulk = this._bulkSubject.asObservable();
        this.afterUpload = this._uploadSubject.asObservable();
        this.options = this.options || {};
    }
    GenericApi.prototype.get = function (id, options) {
        var _this = this;
        options = options || {};
        var subject = new Subject();
        var timeStamp = options.timeStamp;
        var ticker = (options.watch ? timer(0, options.watch) : timer(0)).subscribe(function () {
            var url = _this.apiUrl(id);
            var requestTime = new Date();
            var request = _this.http
                .get(url, { headers: _this.getHeaders(timeStamp) })
                .subscribe(function (dataModel) {
                try {
                    var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel.IsSuccess;
                    if (!isSuccess) {
                        var error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
                        return _this.handleError(error, subject, request);
                    }
                    var model = void 0;
                    if (options && options.map) {
                        model = options.map(dataModel.data);
                    }
                    else if (_this.options.map) {
                        model = _this.options.map(dataModel.data);
                    }
                    else {
                        model = dataModel.data;
                    }
                    if (!model && timeStamp) {
                        return;
                    }
                    if (model && model['timeStamp']) {
                        var modelTimeStamp = model['timeStamp'];
                        if (!timeStamp || !moment(timeStamp).isSame(modelTimeStamp, 'millisecond')) {
                            timeStamp = moment(modelTimeStamp).toDate();
                            return subject.next(model);
                        }
                        else {
                            return;
                        }
                    }
                    timeStamp = requestTime;
                    subject.next(model);
                }
                catch (err) {
                    _this.handleError(err, subject);
                }
            }, function (err) {
                if (err.status === 304) { // Not Modified
                    // its ok - we need not let user know anything
                    return;
                }
                _this.handleError(err, subject);
            });
            if (!subject.observers || !subject.observers.length) {
                ticker.unsubscribe();
                request.unsubscribe();
                return;
            }
        });
        return subject.asObservable();
    };
    GenericApi.prototype.search = function (query, options) {
        var _this = this;
        options = options || {};
        var headers = this.getHeaders();
        var pageOptions = new PageOptions({
            offset: options.offset,
            limit: options.limit
        });
        var mapper = options instanceof PageOptions ? null : options.map;
        var subject = new Subject();
        var request = this.http
            .get(this.getSearchUrl(query, pageOptions), { headers: headers })
            .subscribe(function (response) { return _this.extractPage(response, { map: mapper }, subject, request); }, function (err) { return _this.handleError(err, subject, request); });
        return subject.asObservable();
    };
    GenericApi.prototype.create = function (model, options) {
        var _this = this;
        options = options || {};
        var subject = new Subject();
        var request = this.http
            .post(this.apiUrl(), JSON.stringify(model), { headers: this.getHeaders() })
            .subscribe(function (response) {
            var item = _this.extractModel(response, options, subject, request);
            _this._createSubject.next(item);
        }, function (err) { return _this.handleError(err, subject, request); });
        return subject.asObservable();
    };
    GenericApi.prototype.update = function (id, model, options) {
        var _this = this;
        options = options || {};
        var subject = new Subject();
        var request = this.http
            .put(this.apiUrl(id), JSON.stringify(model), { headers: this.getHeaders() })
            .subscribe(function (response) {
            var item = _this.extractModel(response, options, subject, request);
            _this._createSubject.next(item);
        }, function (err) { return _this.handleError(err, subject, request); });
        return subject.asObservable();
    };
    GenericApi.prototype.remove = function (id, options) {
        var _this = this;
        options = options || {};
        var subject = new Subject();
        var request = this.http
            .delete(this.apiUrl(id), { headers: this.getHeaders() })
            .subscribe(function (dataModel) {
            var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel.IsSuccess;
            if (isSuccess) {
                _this._removeSubject.next(id);
            }
            if (!subject.observers || !subject.observers.length) {
                request.unsubscribe();
                return;
            }
            if (isSuccess) {
                return subject.next();
            }
            var err = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
            _this.handleError(err, subject);
        }, function (err) { return _this.handleError(err, subject, request); });
        return subject.asObservable();
    };
    GenericApi.prototype.post = function (data, field, options) {
        var _this = this;
        options = options || {};
        var subject = new Subject();
        var request = this.http
            .post(this.apiUrl(field), JSON.stringify(data), { headers: this.getHeaders() })
            .subscribe(function (dataModel) {
            var shouldHandle = _this.shouldHandle(subject, request);
            var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel.IsSuccess;
            if (!isSuccess) {
                if (shouldHandle) {
                    var error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
                    _this.handleError(error, subject);
                }
                return;
            }
            var item = options.map ? options.map(dataModel.data) : dataModel.data;
            _this._postSubject.next(item);
            if (shouldHandle) {
                subject.next(item);
            }
        }, function (err) { return _this.handleError(err, subject, request); });
        return subject.asObservable();
    };
    GenericApi.prototype.bulk = function (models, path, options) {
        var _this = this;
        options = options || {};
        var subject = new Subject();
        var request = this.http
            .post(this.apiUrl(path || 'bulk'), JSON.stringify({ items: models }), { headers: this.getHeaders() })
            .subscribe(function (response) {
            try {
                var page = _this.extractPage(response, options, subject, request);
                _this._bulkSubject.next(page);
            }
            catch (err) {
                _this.handleError(err, subject, request);
            }
        }, function (err) { return _this.handleError(err, subject, request); });
        return subject.asObservable();
    };
    GenericApi.prototype.upload = function (file, path, query) {
        var _this = this;
        var params = new URLSearchParams();
        for (var key in query) {
            if (query[key]) {
                params.set(key, query[key]);
            }
        }
        var queryString = params.toString();
        var url = queryString ? this.apiUrl(path) + "?" + queryString : this.apiUrl(path);
        var headers = [];
        var httpHeaders = this.getHeaders();
        for (var _i = 0, _a = httpHeaders.keys(); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var value = httpHeaders.get(name_1);
            if (name_1 === 'Content-Type' || !value) {
                continue;
            }
            headers.push({
                name: name_1,
                value: value
            });
        }
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
            var error = new Error('failed');
            _this.handleError(error, subject);
        };
        uploader.onCompleteItem = function (item, response, status) {
            var dataModel = JSON.parse(response);
            var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel.IsSuccess;
            if (!isSuccess) {
                var error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
                _this.handleError(error, subject);
            }
            else {
                subject.next(dataModel.data);
                _this._uploadSubject.next(dataModel.data);
            }
        };
        uploader.addToQueue([file]);
        return subject.asObservable();
    };
    GenericApi.prototype.getHeaders = function (timeStamp) {
        var headers = {
            'Content-Type': 'application/json'
        };
        if (timeStamp) {
            headers['If-Modified-Since'] = timeStamp.toISOString();
        }
        if (this.options.headers && this.options.headers.length > 0) {
            this.options.headers.forEach(function (item) {
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
                    headers[item.key] = value;
                }
            });
        }
        return new HttpHeaders(headers);
    };
    GenericApi.prototype.apiUrl = function (field) {
        var url = this.url;
        if (this.options.collection) {
            var key;
            switch (typeof this.options.collection) {
                case 'string':
                    key = this.options.collection;
                    break;
                case 'function':
                    key = this.options.collection();
                    break;
                default:
                    key = JSON.stringify(this.options.collection);
                    break;
            }
            url = url + "/" + key;
        }
        if (field) {
            url = url + "/" + field;
        }
        if (this.options.extension) {
            url = url + "." + this.options.extension;
        }
        return url;
    };
    GenericApi.prototype.getSearchUrl = function (query, options) {
        var params = new URLSearchParams();
        // tslint:disable-next-line:prefer-const
        for (var key in query) {
            if (query[key]) {
                params.set(key, query[key]);
            }
        }
        if (options) {
            if (options.offset || options.limit) {
                options.offset = options.offset || 0;
                options.limit = options.limit || 10;
                params.set('offset', options.offset.toString());
                params.set('limit', options.limit.toString());
            }
        }
        var queryString = params.toString();
        var url = queryString ? this.apiUrl() + "?" + queryString : this.apiUrl();
        return url;
    };
    GenericApi.prototype.extractModel = function (dataModel, options, subject, request) {
        options = options || {};
        var shouldHandle = this.shouldHandle(subject, request);
        var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel.IsSuccess;
        if (!isSuccess) {
            var error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
            if (shouldHandle) {
                this.handleError(error, subject, request);
            }
            return null;
        }
        var model;
        if (options && options.map) {
            model = options.map(dataModel.data);
        }
        else if (this.options.map) {
            model = this.options.map(dataModel.data);
        }
        else {
            model = dataModel.data;
        }
        if (shouldHandle) {
            subject.next(model);
        }
        return model;
    };
    GenericApi.prototype.extractPage = function (dataModel, options, subject, request) {
        var _this = this;
        var shouldHandle = this.shouldHandle(subject, request);
        options = options || {};
        var isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : dataModel.IsSuccess;
        if (!isSuccess) {
            if (shouldHandle) {
                var error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
                this.handleError(error, subject);
            }
            return;
        }
        var data = dataModel['data'] || dataModel;
        var items = [];
        data.items.forEach(function (item) {
            if (options.map) {
                items.push(options.map(item));
            }
            else if (_this.options.map) {
                items.push(_this.options.map(item));
            }
            else {
                items.push(item);
            }
        });
        var page = new Page();
        page.pageNo = data.pageNo;
        page.pageSize = data.pageSize;
        page.total = data.total;
        page.stats = data.stats;
        page.items = items;
        if (shouldHandle) {
            subject.next(page);
        }
        return page;
    };
    GenericApi.prototype.handleError = function (err, subject, request) {
        if (!this.shouldHandle(subject, request)) {
            return;
        }
        if (this.options.errorHandler) {
            this.options.errorHandler.handleError(err);
        }
        subject.error(err);
    };
    GenericApi.prototype.shouldHandle = function (subject, request) {
        if (!subject) {
            return false;
        }
        if (!subject.observers || !subject.observers.length) {
            if (request) {
                request.unsubscribe();
            }
            return false;
        }
        return true;
    };
    return GenericApi;
}());
export { GenericApi };
//# sourceMappingURL=../src/dist/generic-api.js.map