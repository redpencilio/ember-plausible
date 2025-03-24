import config from 'test-app/config/environment';

export function restorePlausibleConfig(hooks) {
  hooks.beforeEach(function () {
    this.originalPlausibleConfig = config['ember-plausible'];
  });

  hooks.afterEach(function () {
    config['ember-plausible'] = this.originalPlausibleConfig;
  });
}

export function preventAutoPlausibleEnable(hooks) {
  hooks.beforeEach(function () {
    this.originalPlausibleConfig = config['ember-plausible'];
    config['ember-plausible'] = { enable: false };
  });

  hooks.afterEach(function () {
    config['ember-plausible'] = this.originalPlausibleConfig;
  });
}
