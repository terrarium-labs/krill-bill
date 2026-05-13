interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-border pb-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      {description && <p className="text-muted-foreground mt-2">{description}</p>}
    </div>
  );
}
