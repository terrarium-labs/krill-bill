import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
    onChange?: (value: string) => void
    onSearch?: (value: string) => void
    debounceMs?: number
    placeholder?: string
    value?: string
    className?: string
    isLoading?: boolean
    disabled?: boolean
    inputClassName?: string
}

const SearchBar = ({
    onChange,
    onSearch,
    debounceMs = 300,
    placeholder = "Search",
    value: controlledValue,
    className,
    isLoading = false,
    disabled = false,
    inputClassName
}: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMac, setIsMac] = useState(false)
    const [internalValue, setInternalValue] = useState("")
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const [isInViewport, setIsInViewport] = useState(false)

    // Use controlled value if provided, otherwise use internal state
    const searchValue = controlledValue !== undefined ? controlledValue : internalValue

    useEffect(() => {
        // Detect if user is on Mac
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    }, [])

    // Intersection Observer to track viewport visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInViewport(entry.isIntersecting)
            },
            {
                threshold: 0.1 // Trigger when at least 10% is visible
            }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Cmd+K (macOS) or Ctrl+K (Windows/Linux)
            // Only focus if the search bar is in viewport
            if ((event.metaKey || event.ctrlKey) && event.key === 'k' && isInViewport) {
                event.preventDefault()
                inputRef.current?.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isInViewport])

    // Track if this is the first render to avoid auto-search on mount
    const isFirstRender = useRef(true)

    // Debounced onSearch effect
    useEffect(() => {
        if (onSearch) {
            // Skip on first render to avoid auto-search
            if (isFirstRender.current) {
                isFirstRender.current = false
                return
            }

            // Clear existing timeout
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }

            // Set new timeout
            debounceRef.current = setTimeout(() => {
                onSearch(searchValue)
            }, debounceMs)
        }

        // Cleanup function
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [searchValue, debounceMs])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value

        if (controlledValue === undefined) {
            // Uncontrolled: update internal state
            setInternalValue(newValue)
        }

        // Always call onChange immediately for controlled components
        if (onChange) {
            onChange(newValue)
        }
    }

    const handleClear = () => {
        if (controlledValue === undefined) {
            // Uncontrolled: update internal state
            setInternalValue("")
        }

        // Always call onChange for controlled components
        if (onChange) {
            onChange("")
        }

        // Maintain focus on the input after clearing
        inputRef.current?.focus()
    }

    return (
        <div ref={containerRef} className={`relative ${className}`} >
            {isLoading ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
                ref={inputRef}
                value={searchValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                className={cn("pl-10 pr-16 h-[38px] text-sm rounded-lg focus-visible:ring-0 shadow-none", inputClassName)}
            />

            {searchValue.length > 0 ?
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="absolute right-[6px] top-1/2 transform -translate-y-1/2 h-6 w-6 px-2 text-xs text-muted-foreground">
                    <X className="h-4 w-4" />
                </Button>
                : <Button
                    variant="outline"
                    className="absolute right-[6px] top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs text-muted-foreground pointer-events-none">
                    {isMac ? '⌘' : 'Ctrl'}
                    + K
                </Button>}
        </div>
    )
}

export default SearchBar