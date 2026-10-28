// Shared table shell: white card + horizontal scroll + min-width wrapper.
// Usage:
//   <Table minWidth="min-w-[800px]">
//     <thead>...</thead>
//     <tbody>...</tbody>
//   </Table>
export const Table = ({ children, minWidth = 'min-w-[720px]', className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <div className={minWidth}>
          <table className="w-full">{children}</table>
        </div>
      </div>
    </div>
  );
};

export default Table;
