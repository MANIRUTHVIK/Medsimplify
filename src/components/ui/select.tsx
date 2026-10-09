"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  selectSize?: "sm" | "md" | "lg";
  id?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      children,
      options: optionsProp,
      value: controlledValue,
      defaultValue,
      onChange,
      onValueChange,
      name,
      placeholder,
      disabled = false,
      error,
      label,
      helperText,
      icon,
      selectSize = "md",
      id,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const generatedId = React.useId();
    const selectId = id || (label ? generatedId : undefined);

    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    // Extract options from options prop or <option> children
    const options: SelectOption[] = React.useMemo(() => {
      if (optionsProp && optionsProp.length > 0) {
        return optionsProp;
      }
      const list: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child)) {
          list.push({
            value: String(child.props.value ?? ""),
            label: child.props.children,
            disabled: Boolean(child.props.disabled),
          });
        }
      });
      return list;
    }, [children, optionsProp]);

    // Uncontrolled vs controlled value
    const [internalValue, setInternalValue] = React.useState<string>(
      defaultValue ?? (options[0]?.value ?? "")
    );
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // Find current selected option
    const selectedOption = options.find((opt) => String(opt.value) === String(currentValue));

    // Close on click outside
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen]);

    const handleSelectOption = (optValue: string, isDisabled?: boolean) => {
      if (isDisabled || disabled) return;

      if (!isControlled) {
        setInternalValue(optValue);
      }
      setIsOpen(false);

      if (onValueChange) {
        onValueChange(optValue);
      }

      if (onChange) {
        const syntheticEvent = {
          target: {
            value: optValue,
            name: name || "",
          },
          currentTarget: {
            value: optValue,
            name: name || "",
          },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        onChange(syntheticEvent);
      }
    };

    const sizeStyles = {
      sm: {
        trigger: "text-xs h-9 py-1.5 pl-3 pr-8 rounded-xl",
        iconLeft: "left-2.5",
        iconRight: "right-2.5",
        chevronSize: "w-3.5 h-3.5",
        paddingWithIcon: "pl-8",
        item: "px-2.5 py-1.5 text-xs rounded-lg",
      },
      md: {
        trigger: "text-sm h-[42px] py-2 pl-3.5 pr-9.5 rounded-[var(--radius)]",
        iconLeft: "left-3",
        iconRight: "right-3",
        chevronSize: "w-4 h-4",
        paddingWithIcon: "pl-9.5",
        item: "px-3 py-2 text-sm rounded-[calc(var(--radius)-4px)]",
      },
      lg: {
        trigger: "text-base h-12 py-2.5 pl-4 pr-10 rounded-[var(--radius)]",
        iconLeft: "left-3.5",
        iconRight: "right-3.5",
        chevronSize: "w-4.5 h-4.5",
        paddingWithIcon: "pl-11",
        item: "px-3.5 py-2.5 text-base rounded-[calc(var(--radius)-2px)]",
      },
    };

    const currentSize = sizeStyles[selectSize];

    return (
      <div
        ref={containerRef}
        className={cn("w-full flex flex-col relative", containerClassName)}
        {...props}
      >
        {label && (
          <label
            htmlFor={selectId}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            className="block text-xs font-semibold text-secondary mb-1.5 select-none cursor-pointer"
          >
            {label}
          </label>
        )}

        {/* Hidden input for HTML form submissions */}
        {name && <input type="hidden" name={name} value={currentValue} />}

        <div className="relative w-full">
          {/* Custom Trigger Button */}
          <button
            id={selectId}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={selectId ? `${selectId}-listbox` : "select-listbox"}
            aria-haspopup="listbox"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            className={cn(
              "w-full flex items-center justify-between text-left bg-card border font-medium transition-all duration-150 cursor-pointer shadow-2xs select-none",
              "hover:border-primary/50 hover:bg-muted/10",
              isOpen
                ? "border-primary ring-2 ring-primary/25"
                : "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary",
              disabled &&
                "bg-muted text-muted-foreground cursor-not-allowed opacity-60 hover:border-border hover:bg-muted",
              currentSize.trigger,
              icon && currentSize.paddingWithIcon,
              error
                ? "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive"
                : "border-border",
              className
            )}
          >
            {icon && (
              <div
                className={cn(
                  "absolute pointer-events-none text-muted-foreground flex items-center justify-center transition-colors",
                  currentSize.iconLeft,
                  isOpen && "text-primary"
                )}
              >
                {icon}
              </div>
            )}

            <span className={cn("truncate block flex-1 min-w-0 pr-2", !selectedOption && "text-muted-foreground")}>
              {selectedOption ? selectedOption.label : placeholder || "Select..."}
            </span>

            <div
              className={cn(
                "absolute pointer-events-none text-muted-foreground flex items-center justify-center transition-transform duration-200",
                currentSize.iconRight,
                isOpen && "rotate-180 text-primary",
                disabled && "opacity-50"
              )}
            >
              <ChevronDown className={currentSize.chevronSize} />
            </div>
          </button>

          {/* Floating Dropdown Menu */}
          {isOpen && (
            <div
              id={selectId ? `${selectId}-listbox` : "select-listbox"}
              ref={menuRef}
              role="listbox"
              tabIndex={-1}
              className={cn(
                "absolute left-0 right-0 top-full mt-1.5 z-50",
                "bg-card/95 backdrop-blur-md border border-border shadow-xl shadow-navy-deep/10 rounded-xl",
                "p-1.5 max-h-60 overflow-y-auto",
                "animate-in fade-in-0 zoom-in-95 duration-150"
              )}
            >
              {options.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground italic text-center">
                  No options available
                </div>
              ) : (
                options.map((opt, index) => {
                  const isSelected = String(opt.value) === String(currentValue);
                  return (
                    <button
                      key={`${opt.value}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => handleSelectOption(opt.value, opt.disabled)}
                      className={cn(
                        "w-full flex items-center justify-between text-left font-medium transition-colors cursor-pointer select-none",
                        currentSize.item,
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted/80 hover:text-foreground",
                        opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      <span className="truncate flex-1 min-w-0">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary shrink-0 ml-2 animate-in zoom-in-50 duration-100" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
        {!error && helperText && (
          <span className="text-[10px] text-muted-foreground mt-1 block leading-normal">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
