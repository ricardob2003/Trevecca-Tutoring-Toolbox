 import { Search, X } from "lucide-react";
 
 interface SearchInputProps {
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
   className?: string;
 }
 
 export function SearchInput({
   value,
   onChange,
   placeholder = "Search...",
   className = "",
 }: SearchInputProps) {
   return (
     <div className={`relative ${className}`}>
       <Search
         size={18}
         className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
       />
       <input
         type="text"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         placeholder={placeholder}
         className="input-field pl-10 pr-10"
       />
       {value && (
         <button
           onClick={() => onChange("")}
           className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
         >
           <X size={18} />
         </button>
       )}
     </div>
   );
 }