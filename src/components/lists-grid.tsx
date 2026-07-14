'use client';

import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Edit, GripVertical, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import { ReorderControls } from '@/components/reorder-controls';
import { Button } from '@/components/ui/button';
import { useReorderSensors } from '@/hooks/use-reorder-sensors';
import { sameIdOrder } from '@/lib/list-order';
import { LocalList, moveList } from '@/lib/lists';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

interface ListsGridProps {
  lists: LocalList[];
  /** 0-based index of the first list on this page within the full ordering. */
  offset: number;
  /** Total number of lists across all pages. */
  totalCount: number;
}

function reorderErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to reorder lists';
}

// Not useOptimistic/useTransition: moveList's revalidatePath makes Next
// intermittently never settle the transition, wedging isPending at true
// (https://github.com/vercel/next.js/discussions/82289). Manual pending
// state with a finally block cannot wedge.
function useReorderableLists(lists: LocalList[], offset: number) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [localLists, setLocalLists] = useState(lists);
  const [prevLists, setPrevLists] = useState(lists);

  // Render-time reset when the server-rendered prop changes — the React-docs
  // replacement for syncing props into state with an effect. While a move is
  // in flight, a refresh carrying the pre-move order must not clobber the
  // optimistic order (it would snap back until the next refresh); adopt it
  // only once idle, or immediately when it already agrees with the local
  // order (fresh data, nothing moves).
  if (prevLists !== lists) {
    setPrevLists(lists);
    if (
      !isPending ||
      sameIdOrder(
        lists.map((list) => list.id),
        localLists.map((list) => list.id),
      )
    ) {
      setLocalLists(lists);
    }
  }

  async function commitMove(listId: string, toLocalIndex: number, previous: LocalList[]) {
    setIsPending(true);
    try {
      await moveList(listId, Math.max(0, offset + toLocalIndex));
      // Fire-and-forget: awaiting ties pending to unrelated refetches.
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    } catch (error) {
      setLocalLists(previous);
      toast.error(reorderErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  }

  /**
   * Optimistically moves a list to `toLocalIndex` (an index within this page;
   * -1 or length mean "onto the adjacent page" and are clamped locally while
   * the server applies the real cross-page move).
   */
  function move(listId: string, toLocalIndex: number) {
    const fromLocalIndex = localLists.findIndex((list) => list.id === listId);
    if (isPending || fromLocalIndex === -1 || toLocalIndex === fromLocalIndex) {
      return;
    }
    const clampedIndex = Math.max(0, Math.min(toLocalIndex, localLists.length - 1));
    setLocalLists(arrayMove(localLists, fromLocalIndex, clampedIndex));
    void commitMove(listId, toLocalIndex, localLists);
  }

  return { localLists, isPending, move };
}

function ListCardLink({ list }: { list: LocalList }) {
  return (
    <Link
      href={`/lists/${list.id}`}
      className="relative block min-h-[200px] overflow-hidden rounded-lg border border-muted bg-muted/60 p-6 transition-all hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
    >
      <div className="flex h-full flex-col">
        <div className="flex-1">
          <div className="mb-4 text-4xl">{list.emoji}</div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{list.name}</h3>
          <div className="min-h-[40px]">
            {list.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{list.description}</p>
            )}
          </div>
        </div>
        <div className="mt-4 border-t border-muted pt-4">
          <p className="text-sm text-muted-foreground">{list.itemCount} items</p>
          <p className="text-xs text-muted-foreground">
            Updated {list.updatedAt.toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

interface SortableListCardProps {
  list: LocalList;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  editing: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableListCard({
  list,
  isFirst,
  isLast,
  disabled,
  editing,
  onMoveUp,
  onMoveDown,
}: SortableListCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group/list relative rounded-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-black',
        isDragging && 'z-10 opacity-80 shadow-lg',
        editing && 'ring-2 ring-blue-400/50 ring-offset-2 ring-offset-black',
      )}
    >
      <ListCardLink list={list} />

      {editing ? (
        <ReorderControls
          name={list.name}
          isFirst={isFirst}
          isLast={isLast}
          disabled={disabled}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          handleAttributes={attributes}
          handleListeners={listeners}
        />
      ) : (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-focus-within/list:opacity-100 group-hover/list:opacity-100">
          <EditListDialog
            listId={list.id}
            listName={list.name}
            listDescription={list.description}
            listEmoji={list.emoji}
          >
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
          </EditListDialog>
          <DeleteListButton
            listId={list.id}
            listName={list.name}
            itemCount={list.itemCount}
            redirectAfterDelete={false}
          >
            <Button variant="destructive" size="icon" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DeleteListButton>
        </div>
      )}
    </div>
  );
}

export function ListsGrid({ lists, offset, totalCount }: ListsGridProps) {
  const { localLists, isPending, move } = useReorderableLists(lists, offset);
  const [isEditing, setIsEditing] = useState(false);
  const sensors = useReorderSensors();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    move(
      String(active.id),
      localLists.findIndex((list) => list.id === over.id),
    );
  }

  if (lists.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl opacity-50">📝</div>
        <h2 className="mb-2 text-xl font-semibold">No lists yet</h2>
        <p className="text-zinc-400">
          Create your first list to organize your movies, TV shows, and people
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <Button
          variant={isEditing ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setIsEditing((value) => !value)}
          aria-pressed={isEditing}
        >
          {isEditing ? (
            <>
              <Check className="h-4 w-4" />
              Done
            </>
          ) : (
            <>
              <GripVertical className="h-4 w-4" />
              Reorder lists
            </>
          )}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localLists.map((list) => list.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
            {localLists.map((list, index) => (
              <SortableListCard
                key={list.id}
                list={list}
                isFirst={offset + index === 0}
                isLast={offset + index === totalCount - 1}
                disabled={isPending}
                editing={isEditing}
                onMoveUp={() => move(list.id, index - 1)}
                onMoveDown={() => move(list.id, index + 1)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
