import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IApi } from './api.interface';
import { PageOptions } from './page-options.model';
import { Page } from './page.model';
import { ErrorHandler } from '@angular/core';
export declare class GenericApi<TModel> implements IApi<TModel> {
    private http;
    private url;
    private options?;
    private _createSubject;
    private _removeSubject;
    private _postSubject;
    private _bulkSubject;
    private _uploadSubject;
    afterCreate: Observable<TModel>;
    afterRemove: Observable<string | number>;
    afterPost: Observable<any>;
    afterBulk: Observable<any>;
    afterUpload: Observable<any>;
    constructor(http: HttpClient, url: string, options?: {
        collection?: any;
        headers?: Array<{
            key: string;
            value?: any;
        }>;
        map?: (obj: any) => TModel;
        extension?: string;
        errorHandler?: ErrorHandler;
    });
    get(id: number | string, options?: {
        watch?: number;
        offline?: boolean;
        timeStamp?: Date;
        map?: (obj: any) => TModel;
    }): Observable<TModel>;
    search(query?: any, options?: {
        offset?: number;
        limit?: number;
        offline?: boolean;
        sort?: string;
        desc?: boolean;
        map?: (obj: any) => TModel;
    } | PageOptions): Observable<Page<TModel>>;
    create(model: any, options?: {
        offline?: boolean;
        map?: (obj: any) => TModel;
    }): Observable<TModel>;
    update(id: number | string, model: any, options?: {
        offline?: boolean;
        map?: (obj: any) => TModel;
    }): Observable<TModel>;
    remove(id: number | string, options?: {
        offline?: boolean;
    }): Observable<void>;
    post(data: any, field: string, options?: {
        map?: (obj: any) => any;
    }): Observable<any>;
    bulk(models: TModel[], path?: string, options?: {
        map?: (obj: any) => TModel;
    }): Observable<any>;
    upload(file: File, path?: string, query?: any): Observable<any>;
    private getHeaders;
    private apiUrl;
    private getSearchUrl;
    private extractModel;
    private extractPage;
    private handleError;
    private shouldHandle;
}
