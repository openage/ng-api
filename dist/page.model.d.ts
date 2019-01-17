import { RemoteData } from './remote-data.model';
export declare class Page<TModel> extends RemoteData {
    pageNo: number | undefined;
    pageSize: number | undefined;
    total: number | undefined;
    items: TModel[] | undefined;
    stats: any;
}
