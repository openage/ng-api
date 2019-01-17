import { Page } from './page.model';
import { PageOptions } from './page-options.model';
import { Observable } from 'rxjs';
import { RemoteData } from './remote-data.model';

export interface IApi<TModel> {
    get(id: number | string, options?: {
        watch?: number
        map?: (obj: any) => TModel
    }): Observable<TModel>;
    search(query?: any, options?: {
        offset?: number,
        limit?: number,
        map?: (obj: any) => TModel
    } | PageOptions): Observable<Page<TModel>>;
    create(model: TModel, options?: {
        map?: (obj: any) => TModel
    }): Observable<TModel>;
    update(id: number | string, model: TModel, options?: {
        map?: (obj: any) => TModel
    }): Observable<TModel>;
    remove(id: number | string, options?: {
        offline?: boolean
    }): Observable<void>;

    post(model: any, key?: string, options?: {
        map?: (obj: any) => any
    }): Observable<any>;
    bulk(models: TModel[], path?: string, options?: {
        map?: (obj: any) => any
    }): Observable<any>
    upload(file: File, path?: string, query?: any): Observable<any>;
}
