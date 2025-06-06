import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserAvatarProps = {
  user: { name: string; email: string; avatar: string };
};

/**
 * Displays a user's avatar image or, if unavailable, their initials as a fallback.
 *
 * Renders a circular avatar with the user's image. If the image cannot be loaded, the user's initials are shown instead.
 *
 * @param user - The user object containing {@link UserAvatarProps.name}, {@link UserAvatarProps.email}, and {@link UserAvatarProps.avatar}.
 */
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
