interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground hidden text-sm sm:block">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
