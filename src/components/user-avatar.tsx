import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserAvatarProps = {
  user: { name: string; email: string; avatar: string };
};

export function UserAvatar({ user }: UserAvatarProps) {
  return (
    <Avatar className="h-8 w-8 overflow-hidden rounded-full">
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback>
        {user.name
          .split(' ')
          .map((n) => n[0])
          .join('')}
      </AvatarFallback>
    </Avatar>
  );
}
