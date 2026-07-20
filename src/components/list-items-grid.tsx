'use client';

import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';

import type { ListItem } from '@/app/lists/[id]/list-details-content';
import ItemCard from '@/components/item-card';
import PersonCard from '@/components/person-card';
import { SortableItemCard } from '@/components/sortable-item-card';
import { useReorderSensors } from '@/hooks/use-reorder-sensors';

interface ListItemsGridProps {
  items: ListItem[];
  offset: number;
  itemCount: number;
  isPending: boolean;
  editing: boolean;
  onMove: (id: string, toIndex: number) => void;
  userId?: string;
  listId?: string;
}

function itemName(item: ListItem) {
  return 'title' in item ? item.title : item.name;
}

function renderItemCard(
  item: ListItem,
  editing: boolean,
  userId: string | undefined,
  listId?: string,
): ReactNode {
  if (item.resourceType === 'person') {
    return (
      <PersonCard
        person={item}
        userId={userId}
        showListButton={!editing}
        listId={editing ? undefined : listId}
        key={`${item.resourceType}-${item.id}`}
      />
    );
  }

  return (
    <ItemCard
      resource={item}
      type={item.resourceType}
      userId={userId}
      showListButton={!editing}
      listId={editing ? undefined : listId}
      key={`${item.resourceType}-${item.id}`}
    />
  );
}

/**
 * Renders a list's items as a sortable grid. The drag handle and move
 * up/down controls inside each card appear only while `editing` is true.
 */
export function ListItemsGrid({
  items,
  offset,
  itemCount,
  isPending,
  editing,
  onMove,
  userId,
  listId,
}: ListItemsGridProps) {
  const sensors = useReorderSensors();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    onMove(
      String(active.id),
      items.findIndex((item) => item.listItemId === over.id),
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.listItemId)} strategy={rectSortingStrategy}>
        <div
          id="content"
          className="grid scroll-m-5 grid-cols-2 gap-4 @3xl:grid-cols-4 @8xl:grid-cols-5"
        >
          {items.map((item, index) => (
            <SortableItemCard
              key={item.listItemId}
              id={item.listItemId}
              name={itemName(item)}
              isFirst={offset + index === 0}
              isLast={offset + index === itemCount - 1}
              disabled={isPending}
              editing={editing}
              onMoveUp={() => onMove(item.listItemId, index - 1)}
              onMoveDown={() => onMove(item.listItemId, index + 1)}
            >
              {renderItemCard(item, editing, userId, listId)}
            </SortableItemCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
