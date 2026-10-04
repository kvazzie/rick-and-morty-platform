import { Link as RouterLink, useRouteError } from 'react-router';
import { usePreviousPath } from '../hooks/usePreviousPath';
import { Link } from '@heroui/link';
import { OfflineError, RequestError } from '../api';

export const NotFoundPage = () => {
  const err = useRouteError();
  const { previousPath } = usePreviousPath();
  const requestFailed = err instanceof RequestError;
  const offline = err instanceof OfflineError;

  return (
    <div
      role={requestFailed ? 'alert' : undefined}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-4"
    >
      <h1 className="text-4xl font-bold text-red-500 mb-4">
        {offline ? "You're offline" : requestFailed ? 'Unable to load content' : '404'}
      </h1>
      <p className="text-2xl text-gray-300 mb-8">
        {offline
          ? err.message
          : requestFailed
            ? 'The request failed. Check your connection and try again later.'
            : "Oops! The page you're looking for doesn't exist."}
      </p>
      <Link as={RouterLink} to={previousPath || '/'}>
        {previousPath ? 'Go Back' : 'Go Home'}
      </Link>
    </div>
  );
};
