import Service from '@ember/service';
import { assert } from '@ember/debug';

// These default options extend the default options from the plausible-tracker package and mimics the behavior of the official script:
// https://plausible-tracker.netlify.app/globals#plausibleinitoptions
const DEFAULT_OPTIONS = {
  enableAutoPageviewTracking: true,
  enableAutoOutboundTracking: false, // This requires an extension when using the script version: https://plausible.io/docs/script-extensions
};

export default class PlausibleService extends Service {
  _plausible = null;
  _autoPageviewTrackingCleanup = null;
  _autoOutboundTrackingCleanup = null;

  get isEnabled() {
    return Boolean(this._plausible);
  }

  get isAutoPageviewTrackingEnabled() {
    return Boolean(this._autoPageviewTrackingCleanup);
  }

  get isAutoOutboundTrackingEnabled() {
    return Boolean(this._autoOutboundTrackingCleanup);
  }

  get _shouldExcludeCurrentVisits() {
    // Plausible supports ignoring the current browser if the `plausible_ignore` key is set in the localStorage
    // More information https://plausible.io/docs/excluding-localstorage

    // TODO: remove this code once implemented in the plausible-tracker package:
    // https://github.com/plausible/plausible-tracker/issues/8

    return localStorage.getItem('plausible_ignore') === 'true';
  }

  async enable(options = {}) {
    if (!this.isEnabled && !this._shouldExcludeCurrentVisits) {
      let plausibleOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      let domain = handleDomainConfig(plausibleOptions.domain);

      let Plausible = await this._loadPlausible();

      this._plausible = Plausible({
        ...plausibleOptions,
        domain,
      });

      if (plausibleOptions.enableAutoPageviewTracking) {
        this.enableAutoPageviewTracking();
      }

      if (plausibleOptions.enableAutoOutboundTracking) {
        this.enableAutoOutboundTracking();
      }
    }
  }

  trackPageview() {
    if (this.isEnabled && !this._shouldExcludeCurrentVisits) {
      return new Promise((resolve) => {
        this._plausible.trackPageview(
          {},
          {
            callback: resolve,
          }
        );
      });
    }
  }

  trackEvent(eventName, props = {}) {
    assert(
      assertMessage('"eventName" is required'),
      typeof eventName === 'string'
    );

    if (this.isEnabled && !this._shouldExcludeCurrentVisits) {
      return new Promise((resolve) => {
        this._plausible.trackEvent(eventName, { props, callback: resolve });
      });
    }
  }

  enableAutoPageviewTracking() {
    if (
      !this.isAutoPageviewTrackingEnabled &&
      this.isEnabled &&
      !this._shouldExcludeCurrentVisits
    ) {
      this._autoPageviewTrackingCleanup = this._plausible.enableAutoPageviews();
    }
  }

  disableAutoPageviewTracking() {
    if (this.isAutoPageviewTrackingEnabled) {
      this._autoPageviewTrackingCleanup();
      this._autoPageviewTrackingCleanup = null;
    }
  }

  enableAutoOutboundTracking() {
    if (
      !this.isAutoOutboundTrackingEnabled &&
      this.isEnabled &&
      !this._shouldExcludeCurrentVisits
    ) {
      this._autoOutboundTrackingCleanup =
        this._plausible.enableAutoOutboundTracking();
    }
  }

  disableAutoOutboundTracking() {
    if (this.isAutoOutboundTrackingEnabled) {
      this._autoOutboundTrackingCleanup();
      this._autoOutboundTrackingCleanup = null;
    }
  }

  async _loadPlausible() {
    let { default: Plausible } = await import('plausible-tracker');
    return Plausible;
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this.disableAutoPageviewTracking();
    this.disableAutoOutboundTracking();
  }
}

function handleDomainConfig(domain) {
  assert(
    assertMessage('"domain" should be a string or an array of strings'),
    typeof domain === 'string' || Array.isArray(domain)
  );

  if (Array.isArray(domain)) {
    return domain.join();
  }

  return domain;
}

function assertMessage(message) {
  return `ember-plausible: ${message}`;
}
