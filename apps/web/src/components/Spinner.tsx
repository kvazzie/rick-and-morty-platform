import { Spinner as HeroSpinner } from '@heroui/spinner';

export const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-32">
      <HeroSpinner size="lg" />
      <p className="ml-4 text-xl text-gray-400">Loading...</p>
    </div>
  );
};
