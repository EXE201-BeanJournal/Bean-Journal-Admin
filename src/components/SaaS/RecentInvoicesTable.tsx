import React from 'react';

interface Invoice {
  serialNo: string;
  closeDate: string;
  user: string;
  amount: string;
  status: 'Complete' | 'Pending' | 'Cancelled';
}

const invoicesData: Invoice[] = [
  { serialNo: '#DF429', closeDate: 'April 28, 2016', user: 'Jenny Wilson', amount: '$473.85', status: 'Complete' },
  { serialNo: '#HTY274', closeDate: 'October 30, 2017', user: 'Wade Warren', amount: '$293.01', status: 'Complete' },
  { serialNo: '#LKE600', closeDate: 'May 29, 2017', user: 'Darlene Robertson', amount: '$782.01', status: 'Pending' },
  { serialNo: '#HRP447', closeDate: 'May 20, 2015', user: 'Arlene McCoy', amount: '$202.87', status: 'Cancelled' },
  { serialNo: '#WRH647', closeDate: 'March 13, 2014', user: 'Bessie Cooper', amount: '$490.51', status: 'Complete' },
];

const getStatusClass = (status: Invoice['status']) => {
  switch (status) {
    case 'Complete':
      return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
    case 'Pending':
      return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400';
    case 'Cancelled':
      return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100';
  }
};

const RecentInvoicesTable: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Invoices</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Serial No:</th>
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Close Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">User</th>
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {invoicesData.map((invoice) => (
              <tr key={invoice.serialNo}>
                <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">{invoice.serialNo}</td>
                <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">{invoice.closeDate}</td>
                <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">{invoice.user}</td>
                <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">{invoice.amount}</td>
                <td className="px-6 py-4 text-left">
                  <span className={`inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs ${getStatusClass(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentInvoicesTable; 