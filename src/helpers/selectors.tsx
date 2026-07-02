import { useState } from "react";

export default function useSelect() {
  const [selected, setSelected] = useState<{
    [key: string]: any;
  } | null>({});
  const mapped = selected ? Object.keys(selected).map(String) : [];
  const add_to = (item: { id: string; [key: string]: any }) => {
    setSelected((prev) => ({
      ...prev,
      [item.id]: item,
    }));
  };

  const remove = (id: string) => {
    setSelected((prev) => {
      const newSelected = { ...prev };
      delete newSelected[id];
      return newSelected;
    });
  };

  const clear = () => {
    setSelected({});
  };
  const exists = (id: string) => {
    return selected && selected[id] !== undefined;
  };

  return { selected, setSelected, mapped, add_to, remove, clear, exists };
}
