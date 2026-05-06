import PageHeader from '../../components/page-header';

export default function SettingsGeneral() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="General Settings"
        description="Configure general application settings"
      />

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          General settings will be available soon. This section will include business information, preferences, and other general configurations.
        </p>
      </div>
    </div>
  );
}
