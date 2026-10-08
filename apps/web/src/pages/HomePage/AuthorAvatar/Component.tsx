import { Avatar, AvatarIcon } from '@heroui/avatar';
import { Link as UILink } from '@heroui/link';
import { Tooltip } from '@heroui/tooltip';
import { useAuthorInfo } from '../../../hooks/useAuthorInfo';

export const AuthorAvatar = () => {
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
