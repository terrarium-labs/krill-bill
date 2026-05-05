interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-gray-200 pb-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
      {description && <p className="text-gray-600 dark:text-gray-400 mt-2">{description}</p>}
    </div>
  );
}
