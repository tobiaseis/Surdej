const { withAndroidManifest } = require('@expo/config-plugins');

const NOTIFEE_FOREGROUND_SERVICE = 'app.notifee.core.ForegroundService';
const DATA_SYNC_TYPE = 'dataSync';

const mergeServiceType = (currentType) => {
  const serviceTypes = new Set(
    currentType
      ? currentType.split('|').map((type) => type.trim()).filter(Boolean)
      : []
  );
  serviceTypes.add(DATA_SYNC_TYPE);
  return Array.from(serviceTypes).join('|');
};

module.exports = function withNotifeeForegroundService(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) {
      return manifestConfig;
    }

    application.service = application.service ?? [];
    let service = application.service.find(
      (entry) => entry.$?.['android:name'] === NOTIFEE_FOREGROUND_SERVICE
    );

    if (!service) {
      service = {
        $: {
          'android:name': NOTIFEE_FOREGROUND_SERVICE,
          'android:exported': 'false',
        },
      };
      application.service.push(service);
    }

    service.$ = service.$ ?? {};
    service.$['android:name'] = NOTIFEE_FOREGROUND_SERVICE;
    service.$['android:exported'] = service.$['android:exported'] ?? 'false';
    service.$['android:foregroundServiceType'] = mergeServiceType(
      service.$['android:foregroundServiceType']
    );

    return manifestConfig;
  });
};
