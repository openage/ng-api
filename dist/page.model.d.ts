import { RemoteData } from './remote-data.model';
export declare class Page<TModel> extends RemoteData {
    pageNo: number;
    pageSize: number;
    total: number;
    items: TModel[];
    stats: any;
}
