import { Separator } from "@/components/ui/separator";

export const SectionHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => {
  return (
    <div className="col-span-full">
      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mt-4">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action && <>{action}</>}
      </div>
    </div>
  );
};
