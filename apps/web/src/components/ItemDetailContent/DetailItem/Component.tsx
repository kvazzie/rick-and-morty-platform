export const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-700 p-3 rounded-lg">
    <p className="text-sm font-semibold text-yellow-400">{label}</p>
    <p className="text-lg text-white">{value}</p>
  </div>
);
