"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Btn, IconBtn, TextInput } from "./ui";

const ADD_CATEGORY = "__opsaky_add_custom_category__";

export function CategorySelector({
  value,
  categories,
  onChange,
  onCreate,
  testId,
  allowEmpty = false,
}: {
  value: string;
  categories: string[];
  onChange: (category: string) => void;
  onCreate: (category: string) => void;
  testId: string;
  allowEmpty?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const options = [...new Set([...categories, value].filter(Boolean))];

  function addCategory() {
    const name = newCategory.trim().slice(0, 80);
    if (!name) return;
    const existing = categories.find((category) => category.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing) onChange(existing);
    else {
      onCreate(name);
      onChange(name);
    }
    setNewCategory("");
    setAdding(false);
  }

  return (
    <div className="space-y-2">
      <select
        value={adding ? ADD_CATEGORY : value}
        onChange={(event) => {
          if (event.target.value === ADD_CATEGORY) {
            setNewCategory("");
            setAdding(true);
          } else {
            setAdding(false);
            onChange(event.target.value);
          }
        }}
        data-testid={testId}
        className="h-11 w-full rounded-xl border border-line bg-white/80 px-3 text-sm outline-none focus:border-ink"
      >
        {allowEmpty && <option value="">Choose a category</option>}
        {options.map((category) => <option key={category} value={category}>{category}</option>)}
        <option value={ADD_CATEGORY}>Other / + New Category</option>
      </select>
      {adding && (
        <div className="flex items-center gap-2">
          <TextInput
            autoFocus
            aria-label="Custom category name"
            value={newCategory}
            maxLength={80}
            placeholder="Type new category name..."
            data-testid={`${testId}-new-name`}
            onChange={(event) => setNewCategory(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCategory();
              }
            }}
          />
          <Btn type="button" size="sm" variant="soft" disabled={!newCategory.trim()} onClick={addCategory} data-testid={`${testId}-add`}>
            <Plus className="h-3.5 w-3.5" />Add
          </Btn>
          <IconBtn type="button" label="Cancel new category" onClick={() => { setAdding(false); setNewCategory(""); }} data-testid={`${testId}-cancel`}>
            <X className="h-4 w-4" />
          </IconBtn>
        </div>
      )}
    </div>
  );
}
