import { Page } from './page.model';
import { PageOptions } from './page-options.model';
import { Observable } from 'rxjs/Rx';

export interface IApi<TModel> {
    get(id: number | string, hack?: (obj: any) => TModel): Observable<TModel>;
    search(query?: any, options?: PageOptions, hack?: (obj: any) => TModel): Observable<Page<TModel>>;
    create(model: TModel, hack?: (obj: any) => any): Observable<TModel>;
    update(id: number | string, model: TModel, hack?: (obj: any) => TModel): Observable<TModel>;
    remove(id: number | string): Observable<void>;
}
