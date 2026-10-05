import { AuthorAvatar } from './AuthorAvatar';
import { Button } from '@heroui/button';
import { Link as NavLink } from 'react-router';
import { Image } from '@heroui/image';
import { Spacer } from '@heroui/spacer';

export const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center p-4">
      <h1 className="flex text-5xl md:text-7xl font-extrabold text-white mb-4 items-center">
        <AuthorAvatar />
        <Spacer x={3} />
        X
        <Spacer x={3} />
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/archive/b/b1/20220319060843%21Rick_and_Morty.svg"
          className="object-cover"
          height={110}
        />
      </h1>
      <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
        Dive into the multiverse. Explore detailed information about all the characters, locations, and episodes from
        the show.
      </p>
      <div className="mb-3 flex flex-wrap justify-center gap-4">
        <Button as={NavLink} to="/characters" color="success">
          Explore Characters
        </Button>
        <Button as={NavLink} to="/locations" color="primary">
          Discover Locations
        </Button>
        <Button as={NavLink} to="/episodes" color="secondary">
          View Episodes
        </Button>
      </div>
    </div>
  );
};
