import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service plausible;

  beforeModel() {
    // this.plausible.setup({
    //   domain: 'organisaties.abb.vlaanderen.be',
    //   apiHost: 'http://localhost:8000',
    //   trackLocalhost: true,
    //   enableAutoPageviewTracking: false,
    //   enableAutoOutboundLinkTracking: true,
    // });
  }
}
