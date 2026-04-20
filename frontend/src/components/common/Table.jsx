const Table = ({ columns, data, loading, emptyMessage = 'No data available' }) => {
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-64 text-secondary-500">{emptyMessage}</div>;

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className="w-full">
        <thead>
          <tr className="border-b border-secondary-200 bg-secondary-50">
            {columns.map((col, idx) => <th key={idx} className="h-14 px-6 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">{col.header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-200">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-secondary-50 transition-colors">
              {columns.map((col, colIdx) => <td key={colIdx} className="h-18 px-6 text-sm text-secondary-900">{col.render ? col.render(row) : row[col.accessor]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
