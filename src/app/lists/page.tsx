import { ListsGrid } from '@/components/lists-grid';
import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import { getUserLists } from '@/lib/lists';
import { redirect } from 'next/navigation';

export default async function ListsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const lists = await getUserLists();

  return (
    <div className="p-4">
      <SectionTitle>My Lists</SectionTitle>
      <ListsGrid lists={lists} />
    </div>
  );
}
