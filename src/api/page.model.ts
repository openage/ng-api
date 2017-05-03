import { RemoteData } from './remote-data.model';

export class Page<TModel> extends RemoteData {
    public pageNo: number;
    public pageSize: number;
    public total: number;
    public items: TModel[];
    public stats: any;
}
