type UserInfoProps = {
  user: { name: string; email: string; avatar: string };
};

/**
 * Displays a user's name and email in a styled layout.
 *
 * @param user - The user object containing name, email, and avatar properties. Only name and email are displayed.
 *
 * @remark The avatar property is defined in the user object but is not rendered by this component.
 */
export function UserInfo({ user }: UserInfoProps) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{user.name}</span>
      <span className="truncate text-xs">{user.email}</span>
    </div>
  );
}
