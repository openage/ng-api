import { Page } from './page.model';
import { PageOptions } from './page-options.model';
import { Observable } from 'rxjs/Rx';
import { RemoteData } from './remote-data.model';

export interface IApi<TModel> {
    get(id: number | string, hack?: (obj: any) => TModel): Observable<TModel>;
    search(query?: any, options?: PageOptions, hack?: (obj: any) => TModel): Observable<Page<TModel>>;
    create(model: TModel, hack?: (obj: any) => any): Observable<TModel>;
    update(id: number | string, model: TModel, hack?: (obj: any) => TModel): Observable<TModel>;
    remove(id: number | string): Observable<void>;

    post(model: any, key?: string, hack?: (obj: any) => any): Observable<any>;
    bulk(models: TModel[], path?: string, hack?: (obj: any) => any): Observable<any>
    // TODO:
    // upload(file: File, path?: string, format?: string): Observable<any>;
}
