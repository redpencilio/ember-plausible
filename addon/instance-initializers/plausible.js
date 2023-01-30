import { deprecate } from '@ember/debug';

export function initialize(appInstance) {
  let config = appInstance.resolveRegistration('config:environment');
  let plausibleConfig = config['ember-plausible'];

  deprecate(
    'The auto-initializing behavior of ember-plausible is deprecated. Please use the `PlausibleService.enable` method when needed and set `ember-plausible.enabled` to `false` in the `config/environment.js` file.',
    plausibleConfig.enabled === false,
    {
      id: 'ember-plausible.auto-initializing-behavior',
      until: '0.3.0',
      url: 'https://github.com/redpencilio/ember-plausible/issues/4',
      for: 'ember-plausible',
      since: {
        available: '0.2.0',
        enabled: '0.2.0',
      },
    }
  );

  let isEnabled = plausibleConfig?.enabled;

  if (typeof isEnabled === 'undefined') {
    isEnabled = config.environment === 'production';
  }

  if (typeof isEnabled === 'string') {
    isEnabled = isEnabled === 'true';
  }

  if (typeof isEnabled !== 'boolean') {
    // We don't want to enable the service even if the value is truthy.
    isEnabled = false;
  }

  if (isEnabled) {
    let plausibleService = appInstance.lookup('service:plausible');
    plausibleService.enable(plausibleConfig);
  }
}

export default {
  initialize,
};
