import { Page } from './page.model';
import { PageOptions } from './page-options.model';
import { Observable } from 'rxjs';
export interface IApi<TModel> {
    get(id: number | string, options?: {
        watch?: number;
        map?: (obj: any) => TModel;
    }): Observable<TModel>;
    search(query?: any, options?: {
        offset?: number;
        limit?: number;
        map?: (obj: any) => TModel;
    } | PageOptions): Observable<Page<TModel>>;
    afterCreate: Observable<TModel>;
    create(model: any, options?: {
        map?: (obj: any) => TModel;
    }): Observable<TModel>;
    update(id: number | string, model: any, options?: {
        map?: (obj: any) => TModel;
    }): Observable<TModel>;
    afterRemove: Observable<number | string>;
    remove(id: number | string, options?: {
        offline?: boolean;
    }): Observable<void>;
    afterPost: Observable<any>;
    post(model: any, key?: string, options?: {
        map?: (obj: any) => any;
    }): Observable<any>;
    afterBulk: Observable<any>;
    bulk(models: any[], path?: string, options?: {
        map?: (obj: any) => any;
    }): Observable<any>;
    afterUpload: Observable<any>;
    upload(file: File, path?: string, query?: any): Observable<any>;
}
