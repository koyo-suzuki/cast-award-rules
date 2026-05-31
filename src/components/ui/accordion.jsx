import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export function Accordion({ items, defaultOpen = 0, className }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("grid gap-2", className)}>
      {items.map((item, index) => (
        <div key={item.title} className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <button
            type="button"
            className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold"
            onClick={() => setOpen(open === index ? -1 : index)}
            aria-expanded={open === index}
          >
            <span>{item.title}</span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open === index && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          {open === index ? (
            <div className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
              {item.body}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
