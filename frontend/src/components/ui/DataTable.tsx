 import { ReactNode } from "react";
 import { Loader2 } from "lucide-react";
 
 interface Column<T> {
   key: string;
   header: string;
   render?: (item: T) => ReactNode;
   className?: string;
 }
 
 interface DataTableProps<T> {
   columns: Column<T>[];
   data: T[];
   keyField: keyof T;
   isLoading?: boolean;
   emptyMessage?: string;
   onRowClick?: (item: T) => void;
 }
 
 export function DataTable<T>({
   columns,
   data,
   keyField,
   isLoading = false,
   emptyMessage = "No data available",
   onRowClick,
 }: DataTableProps<T>) {
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (data.length === 0) {
     return (
       <div className="text-center py-12">
         <p className="text-muted-foreground">{emptyMessage}</p>
       </div>
     );
   }
 
   return (
     <div className="overflow-x-auto">
       <table className="w-full">
         <thead>
           <tr className="table-header">
             {columns.map((col) => (
               <th
                 key={col.key}
                 className={`table-cell text-left ${col.className || ""}`}
               >
                 {col.header}
               </th>
             ))}
           </tr>
         </thead>
         <tbody>
           {data.map((item) => (
             <tr
               key={String(item[keyField])}
               className={`
                 hover:bg-muted/50 transition-colors
                 ${onRowClick ? "cursor-pointer" : ""}
               `}
               onClick={() => onRowClick?.(item)}
             >
               {columns.map((col) => (
                 <td key={col.key} className={`table-cell ${col.className || ""}`}>
                   {col.render
                     ? col.render(item)
                     : String((item as Record<string, unknown>)[col.key] ?? "")}
                 </td>
               ))}
             </tr>
           ))}
         </tbody>
       </table>
     </div>
   );
 }