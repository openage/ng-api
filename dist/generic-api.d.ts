import { Http } from '@angular/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { IApi } from './api.interface';
import { Page } from './page.model';
import { PageOptions } from './page-options.model';
export declare class GenericApi<TModel> implements IApi<TModel> {
    private url;
    private key;
    private http;
    private headers;
    private extension;
    constructor(url: string, key: any, http: Http, headers?: Array<{
        key: string;
        value?: any;
    }>, extension?: string);
    get(id: number | string, hack?: (obj: any) => TModel): Observable<TModel>;
    search(query?: any, options?: PageOptions, hack?: (obj: any) => TModel): Observable<Page<TModel>>;
    create(model: TModel, hack?: (obj: any) => TModel): Observable<TModel>;
    update(id: number | string, model: TModel, hack?: (obj: any) => TModel): Observable<TModel>;
    remove(id: number | string): Observable<void>;
    post(data: any, field: string, hack?: (obj: any) => any): Observable<any>;
    bulk(models: TModel[], path?: string, hack?: (obj: any) => any): Observable<any>;
    upload(file: File, path?: string, query?: any): Observable<any>;
    private getHeaders();
    private apiUrl(field?);
    private getSearchUrl(query, options?);
    private extractModel(responseData, hack?);
    private extractPage(responseData, hack?);
}
