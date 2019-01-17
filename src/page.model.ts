import { RemoteData } from './remote-data.model';

export class Page<TModel> extends RemoteData {
    public pageNo: number | undefined;
    public pageSize: number | undefined;
    public total: number | undefined;
    public items: TModel[] | undefined;
    public stats: any;
}
