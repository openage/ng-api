import { NgModule, ModuleWithProviders } from '@angular/core';

import { GenericApi, ServerData, Page, PageOptions } from './index';

const components = [
  GenericApi,
  ServerData,
  Page,
  PageOptions
];

const services = [
];

@NgModule({

  declarations: [],
  exports: [],
  imports: [],
  providers: []
})
export class NgApiModule {

  /**
   * Use in AppModule
   */
  public static forRoot(): ModuleWithProviders {
    return {
      ngModule: NgApiModule,
      providers: []
    };
  }

  /**
   * Use in features modules with lazy loading.
   */
  public static forChild(): ModuleWithProviders {
    return {
      ngModule: NgApiModule,
      providers: []
    };
  }
}
