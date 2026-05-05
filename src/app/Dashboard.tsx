export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Krill Bill</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Your local-first invoice manager SaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-4xl font-bold text-green-600">0</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Invoices Created</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-4xl font-bold text-blue-600">0</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Total Amount</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-4xl font-bold text-purple-600">0</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Clients</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Getting Started</h2>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li>✓ Set up serial numbers for your invoices</li>
          <li>○ Create your first invoice</li>
          <li>○ Configure clients and vendors</li>
          <li>○ Enable mail billing automation</li>
        </ul>
      </div>
    </div>
  );
}
