import { Http, RequestOptions } from '@angular/http';
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
    private apiUrl;
    private baseUrl;
    constructor(url: string, key: string, http: Http, headers?: Array<{
        key: string;
        value?: any;
    }>);
    get(id: number | string, hack?: (obj: any) => TModel): Observable<TModel>;
    search(query?: any, options?: PageOptions, hack?: (obj: any) => TModel): Observable<Page<TModel>>;
    create(model: TModel, hack?: (obj: any) => TModel): Observable<TModel>;
    update(id: number | string, model: TModel, hack?: (obj: any) => TModel): Observable<TModel>;
    remove(id: number | string): Observable<void>;
    post(field: string, data: any, requestOptions?: RequestOptions): Observable<any>;
    private getHeaders();
    private getObjectUrl(id);
    private getSearchUrl(query, options?);
    private extractModel(responseData, hack?);
    private extractPage(responseData, hack?);
}
