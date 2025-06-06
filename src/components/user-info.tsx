type UserInfoProps = {
  user: { name: string; email: string; avatar: string };
};

export function UserInfo({ user }: UserInfoProps) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{user.name}</span>
      <span className="truncate text-xs">{user.email}</span>
    </div>
  );
}
