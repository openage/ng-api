
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FileItem, FileUploader } from 'ng2-file-upload';
import { Observable, Subject, timer, Subscription } from 'rxjs';
import { IApi } from './api.interface';
import { PageOptions } from './page-options.model';
import { Page } from './page.model';
import { RemoteData } from './remote-data.model';
import { ServerData } from './server-data.model';

import { Headers } from 'ng2-file-upload'
import { ErrorHandler } from '@angular/core';
import moment from 'moment';


export class GenericApi<TModel> implements IApi<TModel> {

    private _createSubject = new Subject<TModel>();
    private _removeSubject = new Subject<string | number>();
    private _postSubject = new Subject<any>();
    private _bulkSubject = new Subject<any>();
    private _uploadSubject = new Subject<any>();


    afterCreate = this._createSubject.asObservable();
    afterRemove = this._removeSubject.asObservable();
    afterPost = this._postSubject.asObservable();
    afterBulk = this._bulkSubject.asObservable();
    afterUpload = this._uploadSubject.asObservable();

    constructor(
        private http: HttpClient,
        private url: string,
        private options?: {
            collection?: any,
            headers?: Array<{ key: string, value?: any }>,
            map?: (obj: any) => TModel
            extension?: string,
            errorHandler?: ErrorHandler
        }
    ) {
        this.options = this.options || {}
    }

    public get(id: number | string, options?: {
        watch?: number
        offline?: boolean,
        timeStamp?: Date,
        map?: (obj: any) => TModel
    }): Observable<TModel> {
        options = options || {}
        const subject = new Subject<TModel>();

        let timeStamp: Date = options.timeStamp;
        const ticker = (options.watch ? timer(0, options.watch) : timer(0)).subscribe(() => {
            const url = this.apiUrl(id);
            let requestTime = new Date();
            const request = this.http
                .get<ServerData<TModel>>(url, { headers: this.getHeaders(timeStamp) })
                .subscribe(
                    dataModel => {
                        try {

                            const isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : (dataModel as any).IsSuccess;
                            if (!isSuccess) {
                                let error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed')
                                return this.handleError(error, subject, request)
                            }

                            let model;

                            if (options && options.map) {
                                model = options.map(dataModel.data)
                            } else if (this.options.map) {
                                model = this.options.map(dataModel.data)
                            } else {
                                model = dataModel.data
                            }

                            if (!model && timeStamp) {
                                return;
                            }

                            if (model && (model as any)['timeStamp']) {
                                let modelTimeStamp = (model as any)['timeStamp'];

                                if (!timeStamp || !moment(timeStamp).isSame(modelTimeStamp, 'millisecond')) {
                                    timeStamp = moment(modelTimeStamp).toDate();
                                    return subject.next(model);
                                } else {
                                    return
                                }
                            }

                            timeStamp = requestTime;
                            subject.next(model);
                        } catch (err) {
                            this.handleError(err, subject)
                        }
                    },
                    err => {
                        if (err.status === 304) { // Not Modified
                            // its ok - we need not let user know anything
                            return;
                        }
                        this.handleError(err, subject)
                    });

            if (!subject.observers || !subject.observers.length) {
                ticker.unsubscribe();
                request.unsubscribe();
                return;
            }
        })
        return subject.asObservable();
    }
    public search(query?: any, options?: {
        offset?: number,
        limit?: number,
        offline?: boolean,
        map?: (obj: any) => TModel
    } | PageOptions): Observable<Page<TModel>> {
        options = options || {}
        let headers = this.getHeaders()
        let pageOptions = new PageOptions({
            offset: options.offset,
            limit: options.limit
        });

        let mapper = options instanceof PageOptions ? null : options.map

        const subject = new Subject<Page<TModel>>();

        let request = this.http
            .get<Page<TModel>>(this.getSearchUrl(query, pageOptions), { headers: headers })
            .subscribe(
                response => this.extractPage(response, { map: mapper }, subject, request),
                err => this.handleError(err, subject, request))
        return subject.asObservable();
    }
    public create(model: any, options?: {
        offline?: boolean,
        map?: (obj: any) => TModel
    }): Observable<TModel> {

        options = options || {}
        const subject = new Subject<TModel>();

        let request = this.http
            .post<ServerData<TModel>>(this.apiUrl(), JSON.stringify(model), { headers: this.getHeaders() })
            .subscribe(
                response => {
                    let item = this.extractModel(response, options, subject, request);
                    this._createSubject.next(item);
                },
                err => this.handleError(err, subject, request))
        return subject.asObservable();
    }
    public update(id: number | string, model: any, options?: {
        offline?: boolean,
        map?: (obj: any) => TModel
    }): Observable<TModel> {
        options = options || {}
        const subject = new Subject<TModel>();

        let request = this.http
            .put<ServerData<TModel>>(this.apiUrl(id), JSON.stringify(model), { headers: this.getHeaders() })
            .subscribe(
                response => {
                    let item = this.extractModel(response, options, subject, request);
                    this._createSubject.next(item);
                },
                err => this.handleError(err, subject, request))
        return subject.asObservable();
    }
    public remove(id: number | string, options?: {
        offline?: boolean
    }): Observable<void> {
        options = options || {}
        const subject = new Subject<void>();

        let request = this.http
            .delete<RemoteData>(this.apiUrl(id), { headers: this.getHeaders() })
            .subscribe(
                dataModel => {
                    const isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : (dataModel as any).IsSuccess;


                    if (isSuccess) {
                        this._removeSubject.next(id);
                    }
                    if (!subject.observers || !subject.observers.length) {
                        request.unsubscribe();
                        return;
                    }
                    if (isSuccess) {
                        return subject.next();
                    }

                    let err = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
                    this.handleError(err, subject)
                },
                err => this.handleError(err, subject, request))
        return subject.asObservable();

    }

    public post(data: any, field: string, options?: {
        map?: (obj: any) => any
    }): Observable<any> {

        options = options || {}

        const subject = new Subject<any>();

        let request = this.http
            .post<ServerData<any>>(this.apiUrl(field), JSON.stringify(data), { headers: this.getHeaders() })
            .subscribe(
                dataModel => {
                    let shouldHandle = this.shouldHandle(subject, request);

                    const isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : (dataModel as any).IsSuccess;

                    if (!isSuccess) {
                        if (shouldHandle) {
                            let error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
                            this.handleError(error, subject);
                        }
                        return;
                    }
                    let item = options.map ? options.map(dataModel.data) : dataModel.data

                    this._postSubject.next(item)
                    if (shouldHandle) {
                        subject.next(item)
                    }
                },
                err => this.handleError(err, subject, request))
        return subject.asObservable();
    }

    public bulk(models: TModel[], path?: string, options?: {
        map?: (obj: any) => TModel
    }): Observable<any> {
        options = options || {}
        const subject = new Subject<any>();

        let request = this.http
            .post<Page<TModel>>(this.apiUrl(path || 'bulk'), JSON.stringify({ items: models }), { headers: this.getHeaders() })
            .subscribe(
                response => {
                    try {
                        let page = this.extractPage(response, options, subject, request);
                        this._bulkSubject.next(page);
                    } catch (err) {
                        this.handleError(err, subject, request);
                    }
                },
                err => this.handleError(err, subject, request))
        return subject.asObservable();
    }

    public upload(file: File, path?: string, query?: any): Observable<any> {
        const params = new URLSearchParams();
        for (let key in query) {
            if (query[key]) {
                params.set(key, query[key]);
            }
        }
        const queryString = params.toString();
        const url = queryString ? `${this.apiUrl(path)}?${queryString}` : this.apiUrl(path);

        const headers: Headers[] = [];

        const httpHeaders = this.getHeaders();
        for (const name of httpHeaders.keys()) {
            let value = httpHeaders.get(name);

            if (name === 'Content-Type' || !value) {
                continue;
            }

            headers.push({
                name: name,
                value: value
            })
        }

        const uploader = new FileUploader({
            url: url,
            headers: headers,
            autoUpload: true
        });

        uploader.onBeforeUploadItem = (item) => {
            item.withCredentials = false;
        }

        let subject = new Subject<any>();

        uploader.onErrorItem = (item: FileItem, response: string, status: number) => {
            let error = new Error('failed')
            this.handleError(error, subject)
        }

        uploader.onCompleteItem = (item: FileItem, response: string, status: number) => {
            const dataModel = JSON.parse(response) as ServerData<any>;
            const isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : (dataModel as any).IsSuccess;

            if (!isSuccess) {
                let error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed')
                this.handleError(error, subject);
            } else {
                subject.next(dataModel.data);
                this._uploadSubject.next(dataModel.data);
            }
        }

        uploader.addToQueue([file]);

        return subject.asObservable()
    }

    private getHeaders(timeStamp?: Date): HttpHeaders {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (timeStamp) {
            headers['If-Modified-Since'] = timeStamp.toISOString()
        }
        if (this.options.headers && this.options.headers.length > 0) {
            this.options.headers.forEach((item) => {
                let value: string | null;
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
                } else {
                    value = localStorage.getItem(item.key)
                }

                if (value) {
                    headers[item.key] = value;
                }
            });
        }

        return new HttpHeaders(headers);
    }

    private apiUrl(field?: number | string): string {
        let url = this.url

        if (this.options.collection) {

            var key: string;

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

            url = `${url}/${key}`;
        }

        if (field) {
            url = `${url}/${field}`;
        }

        if (this.options.extension) {
            url = `${url}.${this.options.extension}`;
        }

        return url;
    }

    private getSearchUrl(query: any, options?: PageOptions): string {

        const params = new URLSearchParams();
        // tslint:disable-next-line:prefer-const
        for (let key in query) {
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

        const queryString = params.toString();
        const url = queryString ? `${this.apiUrl()}?${queryString}` : this.apiUrl();

        return url;
    }

    private extractModel(
        dataModel: ServerData<TModel>,
        options: { map?: (obj: any) => TModel },
        subject: Subject<TModel>,
        request: Subscription): TModel {
        options = options || {}

        let shouldHandle = this.shouldHandle(subject, request)

        const isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : (dataModel as any).IsSuccess;
        if (!isSuccess) {
            let error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed')

            if (shouldHandle) {
                this.handleError(error, subject, request)
            }
            return null;
        }

        let model: TModel;
        if (options && options.map) {
            model = options.map(dataModel.data)
        } else if (this.options.map) {
            model = this.options.map(dataModel.data)
        } else {
            model = dataModel.data as TModel;
        }

        if (shouldHandle) {
            subject.next(model);
        }
        return model;
    }

    private extractPage(
        dataModel: Page<TModel>,
        options: { map?: (obj: any) => TModel },
        subject: Subject<Page<TModel>>,
        request?: Subscription): Page<TModel> {

        let shouldHandle = this.shouldHandle(subject, request)
        options = options || {}
        const isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : (dataModel as any).IsSuccess;
        if (!isSuccess) {
            if (shouldHandle) {
                let error = new Error(dataModel.error || dataModel.code || dataModel.message || 'failed')
                this.handleError(error, subject)
            }

            return
        }

        var data = (dataModel as any)['data'] || dataModel;
        const items: TModel[] = [];
        data.items.forEach((item: TModel) => {
            if (options.map) {
                items.push(options.map(item))
            } else if (this.options.map) {
                items.push(this.options.map(item))
            } else {
                items.push(item as TModel);
            }
        });

        const page: Page<TModel> = new Page<TModel>();
        page.pageNo = data.pageNo;
        page.pageSize = data.pageSize;
        page.total = data.total;
        page.stats = data.stats;
        page.items = items;

        if (shouldHandle) {
            subject.next(page)
        }
        return page
    }

    private handleError(err: any, subject: Subject<any>, request?: Subscription) {
        if (!this.shouldHandle(subject, request)) {
            return;
        }

        if (this.options.errorHandler) {
            this.options.errorHandler.handleError(err);
        }
        subject.error(err)
    }

    private shouldHandle(subject: Subject<any>, request?: Subscription): boolean {
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

    }
}
