export function initialize(appInstance) {
  let config = appInstance.resolveRegistration('config:environment');
  let plausibleConfig = config['ember-plausible'];

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
