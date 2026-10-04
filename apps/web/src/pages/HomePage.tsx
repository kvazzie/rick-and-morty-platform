import { Button } from '@heroui/button';
import { Link as NavLink } from 'react-router';
import { Link as UILink } from '@heroui/link';
import { Avatar, AvatarIcon } from '@heroui/avatar';
import { Image } from '@heroui/image';
import { Spacer } from '@heroui/spacer';
import { useAuthorInfo } from '../hooks/useAuthorInfo';
import { Tooltip } from '@heroui/tooltip';

const AuthorAvatar = () => {
  const info = useAuthorInfo();
  return (
    <Tooltip content="Wubba Lubba Dub-Dub!" placement="top-start" showArrow delay={230}>
      <Avatar
        src={info?.avatar_url}
        name={info?.login}
        as={UILink}
        isExternal
        href={info?.html_url}
        fallback={<AvatarIcon />}
        className="w-30 h-30 text-large"
      />
    </Tooltip>
  );
};
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
