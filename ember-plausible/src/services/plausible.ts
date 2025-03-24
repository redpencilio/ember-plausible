import Service from '@ember/service';
import { assert } from '@ember/debug';
import Plausible, {
  type EventOptions,
  type PlausibleOptions,
} from 'plausible-tracker';

// These default options extend the default options from the plausible-tracker package and mimics the behavior of the official script:
// https://plausible-tracker.netlify.app/globals#plausibleinitoptions
const DEFAULT_OPTIONS = {
  enableAutoPageviewTracking: true,
  enableAutoOutboundTracking: false, // This requires an extension when using the script version: https://plausible.io/docs/script-extensions
};

type Options = PlausibleOptions & {
  domain: string | string[];
  enableAutoPageviewTracking?: boolean;
  enableAutoOutboundTracking?: boolean;
};

type PlausibleInstance = ReturnType<typeof Plausible>;
type AutoPageviewTrackingCleanup = ReturnType<
  PlausibleInstance['enableAutoPageviews']
>;
type AutoOutboundTrackingCleanup = ReturnType<
  PlausibleInstance['enableAutoOutboundTracking']
>;

export default class PlausibleService extends Service {
  _plausible: PlausibleInstance | null = null;
  _autoPageviewTrackingCleanup: AutoPageviewTrackingCleanup | null = null;
  _autoOutboundTrackingCleanup: AutoOutboundTrackingCleanup | null = null;

  get isEnabled() {
    return Boolean(this._plausible);
  }

  get isAutoPageviewTrackingEnabled() {
    return Boolean(this._autoPageviewTrackingCleanup);
  }

  get isAutoOutboundTrackingEnabled() {
    return Boolean(this._autoOutboundTrackingCleanup);
  }

  enable(options: Options) {
    if (!this.isEnabled) {
      const plausibleOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      const domain = handleDomainConfig(plausibleOptions.domain);

      this._plausible = this._createPlausibleTracker({
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

  trackPageview(
    eventData: PlausibleOptions = {},
    props: EventOptions['props'] = {},
  ) {
    if (this._plausible) {
      return new Promise<void>((resolve) => {
        this._plausible!.trackPageview(eventData, {
          props,
          callback: resolve,
        });
      });
    }
  }

  trackEvent(
    eventName: string,
    props: EventOptions['props'] = {},
    eventData: PlausibleOptions = {},
  ) {
    assert(
      assertMessage('"eventName" is required'),
      typeof eventName === 'string',
    );

    if (this._plausible) {
      return new Promise<void>((resolve) => {
        this._plausible!.trackEvent(
          eventName,
          { props, callback: resolve },
          eventData,
        );
      });
    }
  }

  enableAutoPageviewTracking() {
    if (!this.isAutoPageviewTrackingEnabled && this._plausible) {
      this._autoPageviewTrackingCleanup = this._plausible.enableAutoPageviews();
    }
  }

  disableAutoPageviewTracking() {
    if (typeof this._autoPageviewTrackingCleanup === 'function') {
      this._autoPageviewTrackingCleanup();
      this._autoPageviewTrackingCleanup = null;
    }
  }

  enableAutoOutboundTracking() {
    if (!this.isAutoOutboundTrackingEnabled && this._plausible) {
      this._autoOutboundTrackingCleanup =
        this._plausible.enableAutoOutboundTracking();
    }
  }

  disableAutoOutboundTracking() {
    if (typeof this._autoOutboundTrackingCleanup === 'function') {
      this._autoOutboundTrackingCleanup();
      this._autoOutboundTrackingCleanup = null;
    }
  }

  _createPlausibleTracker(plausibleOptions: PlausibleOptions) {
    return Plausible(plausibleOptions);
  }

  willDestroy() {
    super.willDestroy();

    this.disableAutoPageviewTracking();
    this.disableAutoOutboundTracking();
  }
}

function handleDomainConfig(domain: string | string[]) {
  assert(
    assertMessage('"domain" should be a string or an array of strings'),
    typeof domain === 'string' || Array.isArray(domain),
  );

  if (Array.isArray(domain)) {
    return domain.join();
  }

  return domain;
}

function assertMessage(message: string) {
  return `ember-plausible: ${message}`;
}
