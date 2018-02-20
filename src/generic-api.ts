import { Injectable, isDevMode } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
// import * as _ from 'lodash';
import { IApi } from './api.interface';
import { ServerData } from './server-data.model';
import { Page } from './page.model';
import { PageOptions } from './page-options.model';
import { RemoteData } from './remote-data.model';

export class GenericApi<TModel> implements IApi<TModel> {

    private apiUrl: string;
    private baseUrl: string;
    constructor(
        private url: string,
        private key: string,
        private http: Http,
        private headers?: Array<{ key: string, value?: any }>) {
        this.apiUrl = `${url}/${key}`;
    }

    public get(id: number | string, hack?: (obj: any) => TModel): Observable<TModel> {
        const url = this.getObjectUrl(id);
        const options = { headers: this.getHeaders() };
        return this.http
            .get(url, options)
            .map((response) => this.extractModel(response, hack));
    }
    public search(query?: any, options?: PageOptions, hack?: (obj: any) => TModel): Observable<Page<TModel>> {
        return this.http
            .get(this.getSearchUrl(query, options), { headers: this.getHeaders() })
            .map((response) => this.extractPage(response, hack));
    }
    public create(model: TModel, hack?: (obj: any) => TModel): Observable<TModel> {

        const options = new RequestOptions({
            headers: this.getHeaders()
        });

        return this.http
            .post(this.apiUrl, JSON.stringify(model), options)
            .map((response) => this.extractModel(response, hack));
    }
    public update(id: number | string, model: TModel, hack?: (obj: any) => TModel): Observable<TModel> {
        return this.http
            .put(this.getObjectUrl(id), JSON.stringify(model), { headers: this.getHeaders() })
            .map((response) => this.extractModel(response, hack));
    }
    public remove(id: number | string): Observable<void> {
        return this.http.delete(this.getObjectUrl(id), { headers: this.getHeaders() })
            .map((response) => {
                if (response.status !== 200) {
                    throw new Error('This request has failed ' + response.status);
                }
                const dataModel = response.json().data as RemoteData;

                if (!dataModel.isSuccess) {
                    if (response.status === 200) {
                        throw new Error(dataModel.code || dataModel.message || 'failed');
                    } else {
                        throw new Error(response.status + '');
                    }
                }
            });
    }

    public post(field: string, data: any, requestOptions?: RequestOptions): Observable<any> {

        const options = requestOptions || new RequestOptions({
            headers: this.getHeaders()
        });

        return this.http
            .post(this.apiUrl + '/' + field, JSON.stringify(data), options)
            .map((responseData) => {

                if (responseData.status !== 200) {
                    throw new Error('This request has failed ' + responseData.status);
                }

                const dataModel = responseData.json() as ServerData<any>;

                if (!dataModel.isSuccess) {
                    if (responseData.status === 200) {
                        throw new Error(dataModel.code || dataModel.message || 'failed');
                    } else {
                        throw new Error(responseData.status);
                    }
                }

                return dataModel.data;
            });
    }

    private getHeaders(): Headers {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        if (this.headers && this.headers.length > 0) {
            this.headers.forEach((item) => {
                let value: string;
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
                    headers.append(item.key, value + '');
                }
            });
        }

        return headers;
    }

    private getObjectUrl(id: number | string): string {
        const url = `${this.apiUrl}/${id}`;

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

        const queryString = params.toString();
        const url = queryString ? `${this.apiUrl}?${queryString}` : this.apiUrl;

        return url;
    }

    private extractModel(responseData: Response, hack?: (obj: any) => TModel): TModel {

        if (responseData.status !== 200) {
            throw new Error('This request has failed ' + responseData.status);
        }

        const dataModel = responseData.json() as ServerData<any>;

        if (!dataModel.isSuccess) {
            if (responseData.status === 200) {
                throw new Error(dataModel.code || dataModel.message || 'failed');
            } else {
                throw new Error(responseData.status);
            }
        }

        return hack ? hack(dataModel.data) : dataModel.data as TModel;

    }

    private extractPage(responseData: Response, hack?: (obj: any) => TModel): Page<TModel> {

        if (responseData.status !== 200) {
            throw new Error('This request has failed ' + responseData.status);
        }

        const dataModel = responseData.json() as Page<any>;

        if (!dataModel.isSuccess) {
            if (responseData.status === 200) {
                throw new Error(dataModel.code || dataModel.message || 'failed');
            } else {
                throw new Error(responseData.status + '');
            }
        }

        const items: TModel[] = [];
        dataModel.items.forEach((item) => {
            items.push(hack ? hack(item) : item as TModel);
        });

        const page: Page<TModel> = new Page<TModel>();
        page.pageNo = dataModel.pageNo;
        page.pageSize = dataModel.pageSize;
        page.total = dataModel.total;
        page.stats = dataModel.stats;
        page.items = items;

        return page;

    }
}
