interface EmptyListProps {
  list?: any[] | null;
  message?: string;
}

export default function EmptyList({
  list,
  message = "No items found.",
}: EmptyListProps) {
  if (list && list.length > 0) return null;
  return (
    <li className="text-center py-4 text-base-content/50 text-sm">{message}</li>
  );
}
