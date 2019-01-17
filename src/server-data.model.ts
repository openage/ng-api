import { RemoteData } from './remote-data.model';

export class ServerData<TModel> extends RemoteData {
    public data: TModel | undefined;
}
